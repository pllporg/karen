#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const args = parseArgs({
  allowPositionals: true,
  options: {
    'api-base': { type: 'string', default: process.env.API_BASE_URL || 'http://127.0.0.1:4000' },
    email: { type: 'string', default: process.env.OPS_SMOKE_USER_EMAIL || 'admin@lic-demo.local' },
    password: { type: 'string', default: process.env.OPS_SMOKE_USER_PASSWORD || 'ChangeMe123!' },
    token: { type: 'string', default: process.env.OPS_SMOKE_SESSION_TOKEN || '' },
    out: { type: 'string', default: 'artifacts/ops/release-smoke-summary.json' },
    'wait-ms': { type: 'string', default: '60000' },
  },
});

const apiBase = String(args.values['api-base']).replace(/\/+$/, '');
const outPath = resolve(String(args.values.out));
const email = String(args.values.email || '').trim();
const password = String(args.values.password || '').trim();
let sessionToken = String(args.values.token || '').trim();
const waitMs = Number.parseInt(String(args.values['wait-ms'] || '60000'), 10);

if (!Number.isFinite(waitMs) || waitMs <= 0) {
  throw new Error(`Invalid --wait-ms value: ${args.values['wait-ms']}`);
}

const startedAt = new Date().toISOString();
const runStamp = stamp();
const result = {
  requirementId: 'REQ-RC-014',
  startedAt,
  completedAt: null,
  apiBase,
  outPath,
  healthy: false,
  summary: {
    totalSteps: 6,
    passed: 0,
    failed: 0,
    skipped: 0,
  },
  authUser: null,
  ids: {
    matterId: null,
    documentId: null,
    documentVersionId: null,
    invoiceId: null,
    portalMessageId: null,
    aiJobId: null,
  },
  steps: [],
};

try {
  await waitForHealth(`${apiBase}/health`, waitMs);

  if (!sessionToken) {
    const loginOutcome = await postJson(`${apiBase}/auth/login`, { email, password });
    if (!loginOutcome.ok) {
      throw new Error(`Login failed (${loginOutcome.status}): ${clip(loginOutcome.text)}`);
    }

    const payload = safeParse(loginOutcome.text);
    sessionToken = String(payload.token || '').trim();
    result.authUser = payload.user || null;
    if (!sessionToken) {
      throw new Error('Login succeeded but token was missing in response payload.');
    }

    pushStep(result.steps, {
      step: 'login',
      status: 'passed',
      statusCode: loginOutcome.status,
      details: { userId: result.authUser?.id ?? null },
    });
  } else {
    pushStep(result.steps, {
      step: 'login',
      status: 'passed',
      statusCode: 200,
      details: { tokenSource: 'pre-supplied' },
    });
  }

  const matterOutcome = await postJson(
    `${apiBase}/matters`,
    {
      name: `RC014 Smoke Matter ${runStamp}`,
      matterNumber: `RC014-${runStamp}`,
      practiceArea: 'General Civil Litigation',
      jurisdiction: 'California',
      venue: 'Orange County Superior Court',
    },
    sessionToken,
  );
  handleEntityStep(result, 'matter_create', matterOutcome, 'matterId');

  const matterId = result.ids.matterId;

  const uploadOutcome = matterId
    ? await uploadDocument(apiBase, sessionToken, matterId, runStamp)
    : { ok: false, status: null, text: 'Skipped because matter creation failed.', payload: null, skipped: true };
  handleEntityStep(result, 'doc_upload', uploadOutcome, 'documentId', ({ payload }) => ({
    documentVersionId: payload?.version?.id ?? null,
  }));

  const invoiceOutcome = matterId
    ? await createInvoice(apiBase, sessionToken, matterId, runStamp)
    : { ok: false, status: null, text: 'Skipped because matter creation failed.', payload: null, skipped: true };
  handleEntityStep(result, 'invoice_create', invoiceOutcome, 'invoiceId');

  const portalOutcome = matterId
    ? await postJson(
        `${apiBase}/portal/messages`,
        {
          matterId,
          subject: `RC014 portal check ${runStamp}`,
          body: 'Release smoke portal message.',
        },
        sessionToken,
      )
    : { ok: false, status: null, text: 'Skipped because matter creation failed.', payload: null, skipped: true };
  handleEntityStep(result, 'portal_message', portalOutcome, 'portalMessageId');

  const aiOutcome = matterId
    ? await postJson(
        `${apiBase}/ai/jobs`,
        {
          matterId,
          toolName: 'timeline.extract',
          input: {
            source: 'release-smoke',
            runStamp,
            notes: 'Smoke validation job payload.',
          },
        },
        sessionToken,
      )
    : { ok: false, status: null, text: 'Skipped because matter creation failed.', payload: null, skipped: true };
  handleEntityStep(result, 'ai_job_create', aiOutcome, 'aiJobId');

  finalizeSummary(result);
  result.completedAt = new Date().toISOString();
  result.healthy = result.summary.failed === 0;
  writeArtifact(outPath, result);

  if (!result.healthy) {
    process.exitCode = 1;
  }

  console.log(`Release smoke summary written -> ${outPath}`);
  console.log(JSON.stringify(result.summary));
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  pushStep(result.steps, {
    step: 'runner_error',
    status: 'failed',
    statusCode: null,
    details: { error: message },
  });
  finalizeSummary(result);
  result.completedAt = new Date().toISOString();
  result.healthy = false;
  writeArtifact(outPath, result);
  console.error(`Release smoke run failed: ${message}`);
  process.exitCode = 1;
}

async function createInvoice(apiBaseValue, token, matterId, runStampValue) {
  const now = new Date();
  const start = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
  const end = now.toISOString();

  const timeEntry = await postJson(
    `${apiBaseValue}/billing/time-entries`,
    {
      matterId,
      description: `RC014 smoke time entry ${runStampValue}`,
      startedAt: start,
      endedAt: end,
      billableRate: 300,
      utbmsPhaseCode: 'L100',
      utbmsTaskCode: 'L110',
    },
    token,
  );

  if (!timeEntry.ok) {
    return timeEntry;
  }

  const payload = safeParse(timeEntry.text);
  const timeEntryId = payload.id;
  if (!timeEntryId) {
    return {
      ok: false,
      status: timeEntry.status,
      text: `Time entry response missing id: ${clip(timeEntry.text)}`,
      payload: null,
    };
  }

  const invoice = await postJson(
    `${apiBaseValue}/billing/invoices`,
    {
      matterId,
      notes: `RC014 smoke invoice ${runStampValue}`,
      lineItems: [
        {
          description: 'Release smoke billing line item',
          quantity: 1,
          unitPrice: 300,
          timeEntryId,
          utbmsPhaseCode: 'L100',
          utbmsTaskCode: 'L110',
        },
      ],
    },
    token,
  );

  return invoice;
}

async function uploadDocument(apiBaseValue, token, matterId, runStampValue) {
  const form = new FormData();
  form.set('matterId', matterId);
  form.set('title', `RC014 Smoke Document ${runStampValue}`);
  form.set('category', 'GENERAL');
  form.set('tags', 'release-smoke,rc014');
  form.set('file', new Blob(['release-smoke-content'], { type: 'text/plain' }), `rc014-smoke-${runStampValue}.txt`);

  const response = await fetch(`${apiBaseValue}/documents/upload`, {
    method: 'POST',
    headers: {
      'x-session-token': token,
    },
    body: form,
  });
  const text = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    text,
    payload: safeParse(text),
  };
}

function handleEntityStep(resultValue, name, outcome, idKey, extraFn) {
  if (outcome.skipped) {
    pushStep(resultValue.steps, {
      step: name,
      status: 'skipped',
      statusCode: null,
      details: { reason: outcome.text },
    });
    return;
  }

  if (!outcome.ok) {
    pushStep(resultValue.steps, {
      step: name,
      status: 'failed',
      statusCode: outcome.status,
      details: { error: clip(outcome.text) },
    });
    return;
  }

  const payload = outcome.payload ?? safeParse(outcome.text);
  const id = payload?.id ?? payload?.document?.id ?? payload?.message?.id ?? payload?.job?.id ?? null;

  resultValue.ids[idKey] = id;
  if (extraFn) {
    Object.assign(resultValue.ids, extraFn({ payload }));
  }

  pushStep(resultValue.steps, {
    step: name,
    status: id ? 'passed' : 'failed',
    statusCode: outcome.status,
    details: id ? { [idKey]: id } : { error: `Missing identifier in response: ${clip(outcome.text)}` },
  });
}

function pushStep(steps, step) {
  steps.push({
    at: new Date().toISOString(),
    ...step,
  });
}

function finalizeSummary(resultValue) {
  const summary = {
    totalSteps: resultValue.steps.filter((step) => step.step !== 'runner_error').length,
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  for (const step of resultValue.steps) {
    if (step.status === 'passed') summary.passed += 1;
    if (step.status === 'failed') summary.failed += 1;
    if (step.status === 'skipped') summary.skipped += 1;
  }

  resultValue.summary = summary;
}

async function postJson(url, payload, token) {
  const headers = {
    'content-type': 'application/json',
  };
  if (token) {
    headers['x-session-token'] = token;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  return {
    ok: response.ok,
    status: response.status,
    text,
    payload: safeParse(text),
  };
}

async function waitForHealth(url, timeoutMs) {
  const started = Date.now();
  let lastError = null;

  while (Date.now() - started < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
      lastError = `Health check returned ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    await sleep(1000);
  }

  throw new Error(`Timed out waiting for API health endpoint ${url}. Last error: ${lastError || 'unknown'}`);
}

function safeParse(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function writeArtifact(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2));
}

function stamp() {
  return new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
}

function clip(value) {
  const text = String(value || '').trim();
  if (text.length <= 2000) {
    return text;
  }
  return `${text.slice(0, 2000)}...<truncated>`;
}

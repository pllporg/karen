#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const args = parseArgs({
  allowPositionals: true,
  options: {
    'api-base': { type: 'string', default: process.env.API_BASE_URL || 'http://127.0.0.1:4000' },
    out: { type: 'string', default: 'artifacts/ops/provider-status-evidence.json' },
    email: { type: 'string', default: process.env.OPS_EVIDENCE_USER_EMAIL || 'admin@lic-demo.local' },
    password: { type: 'string', default: process.env.OPS_EVIDENCE_USER_PASSWORD || 'ChangeMe123!' },
    token: { type: 'string', default: process.env.OPS_EVIDENCE_SESSION_TOKEN || '' },
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

await waitForHealth(`${apiBase}/health`, waitMs);

let authUser = null;
if (!sessionToken) {
  const login = await fetch(`${apiBase}/auth/login`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const loginText = await login.text();
  if (!login.ok) {
    throw new Error(`Login failed (${login.status}) while capturing provider status evidence: ${clip(loginText)}`);
  }

  let loginPayload = {};
  try {
    loginPayload = loginText ? JSON.parse(loginText) : {};
  } catch {
    loginPayload = {};
  }

  sessionToken = String(loginPayload.token || '').trim();
  authUser = loginPayload.user || null;
  if (!sessionToken) {
    throw new Error('Login succeeded but no session token was returned.');
  }
}

const providerResponse = await fetch(`${apiBase}/ops/provider-status`, {
  headers: {
    'x-session-token': sessionToken,
  },
});
const providerText = await providerResponse.text();
if (!providerResponse.ok) {
  throw new Error(`Provider status request failed (${providerResponse.status}): ${clip(providerText)}`);
}

let payload;
try {
  payload = providerText ? JSON.parse(providerText) : {};
} catch {
  throw new Error(`Provider status response was not valid JSON: ${clip(providerText)}`);
}

const evidence = {
  capturedAt: new Date().toISOString(),
  source: `${apiBase}/ops/provider-status`,
  profile: payload.profile || null,
  healthy: Boolean(payload.healthy),
  evaluatedAt: payload.evaluatedAt || null,
  providerCount: Array.isArray(payload.providers) ? payload.providers.length : 0,
  providers: Array.isArray(payload.providers) ? payload.providers : [],
  authUser,
};

mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, JSON.stringify(evidence, null, 2));

console.log(`Captured provider status evidence -> ${outPath}`);

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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function clip(value) {
  const text = String(value || '').trim();
  if (text.length <= 4000) {
    return text;
  }
  return `${text.slice(0, 4000)}...<truncated>`;
}

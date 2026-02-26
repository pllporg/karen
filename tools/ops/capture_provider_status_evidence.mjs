#!/usr/bin/env node

import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const args = parseArgs({
  allowPositionals: true,
  options: {
    'api-base': { type: 'string', default: process.env.API_BASE_URL || 'http://127.0.0.1:4000' },
    out: { type: 'string', default: 'artifacts/ops/provider-readiness-evidence.json' },
    'json-out': { type: 'string' },
    'md-out': { type: 'string' },
    email: { type: 'string', default: process.env.OPS_EVIDENCE_USER_EMAIL || 'admin@lic-demo.local' },
    password: { type: 'string', default: process.env.OPS_EVIDENCE_USER_PASSWORD || 'ChangeMe123!' },
    token: { type: 'string', default: process.env.OPS_EVIDENCE_SESSION_TOKEN || '' },
    'wait-ms': { type: 'string', default: '60000' },
  },
});

const apiBase = String(args.values['api-base']).replace(/\/+$/, '');
const jsonOutPath = resolve(String(args.values['json-out'] || args.values.out));
const mdOutPath = resolve(String(args.values['md-out'] || jsonOutPath.replace(/\.json$/i, '.md')));
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
    throw new Error(`Login failed (${login.status}) while exporting provider readiness evidence: ${clip(loginText)}`);
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

const providers = Array.isArray(payload.providers) ? payload.providers : [];
const blockingIssues = providers.flatMap((provider) => {
  const issues = Array.isArray(provider.issues) ? provider.issues : [];
  return issues.map((issue) => ({
    provider: provider.key || 'unknown',
    critical: Boolean(provider.critical),
    healthy: Boolean(provider.healthy),
    issue,
    missingEnv: Array.isArray(provider.missingEnv) ? provider.missingEnv : [],
  }));
}).filter((issue) => issue.critical && !issue.healthy);

const evidence = {
  requirement: 'REQ-RC-013',
  capturedAt: new Date().toISOString(),
  source: `${apiBase}/ops/provider-status`,
  environmentProfile: payload.profile || null,
  healthy: Boolean(payload.healthy),
  evaluatedAt: payload.evaluatedAt || null,
  providerCount: providers.length,
  providers,
  blockingIssues,
  authUser,
};

mkdirSync(dirname(jsonOutPath), { recursive: true });
writeFileSync(jsonOutPath, JSON.stringify(evidence, null, 2));

mkdirSync(dirname(mdOutPath), { recursive: true });
writeFileSync(mdOutPath, renderMarkdown(evidence));

console.log(`Exported provider readiness evidence -> ${jsonOutPath}`);
console.log(`Exported provider readiness report -> ${mdOutPath}`);

function renderMarkdown(evidencePayload) {
  const rows = evidencePayload.providers.length
    ? evidencePayload.providers
        .map((provider) => {
          const issues = Array.isArray(provider.issues) && provider.issues.length
            ? provider.issues.join('; ')
            : 'None';
          return `| ${escapeCell(provider.key)} | ${escapeCell(provider.mode)} | ${provider.critical ? 'yes' : 'no'} | ${provider.healthy ? 'yes' : 'no'} | ${escapeCell(issues)} |`;
        })
        .join('\n')
    : '| _none_ | _n/a_ | _n/a_ | _n/a_ | _n/a_ |';

  const blocking = evidencePayload.blockingIssues.length
    ? evidencePayload.blockingIssues
        .map((issue) => `- [ ] ${issue.provider}: ${issue.issue}${issue.missingEnv.length ? ` (missing env: ${issue.missingEnv.join(', ')})` : ''}`)
        .join('\n')
    : '- None';

  return `# Provider Readiness Evidence\n\n- Requirement: ${evidencePayload.requirement}\n- Captured at (UTC): ${evidencePayload.capturedAt}\n- Environment profile: ${evidencePayload.environmentProfile ?? 'unknown'}\n- Overall healthy: ${evidencePayload.healthy ? 'yes' : 'no'}\n- Evaluated at (UTC): ${evidencePayload.evaluatedAt ?? 'unknown'}\n- Source: \`${evidencePayload.source}\`\n\n## Provider rows\n\n| Provider | Mode | Critical | Healthy | Issues |\n| --- | --- | --- | --- | --- |\n${rows}\n\n## Blocking issues\n\n${blocking}\n`;
}

function escapeCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|');
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

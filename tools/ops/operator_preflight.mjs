#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');

const envFiles = [path.join(repoRoot, 'tools', 'backlog-sync', 'config.env'), path.join(repoRoot, '.env')];
const canonicalControlFiles = [
  'tools/backlog-sync/requirements.matrix.json',
  'tools/backlog-sync/session.snapshot.json',
  'docs/SESSION_HANDOFF.md',
  'docs/WORKING_CONTRACT.md',
  'README.md',
];
const requiredTokenEnv = ['LINEAR_API_TOKEN', 'GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_REPO'];

preloadEnvFiles(envFiles);

const artifactPath = path.join(repoRoot, 'artifacts', 'ops', 'operator-preflight.json');
const startedAt = new Date().toISOString();

const branch = runCommand('git', ['rev-parse', '--abbrev-ref', 'HEAD']);
const status = runCommand('git', ['status', '--short', '--branch']);
const dirtyPaths = parseDirtyPaths(status.stdout);
const dirtyCanonicalFiles = canonicalControlFiles.filter((file) => dirtyPaths.includes(file));
const dirtyNonCanonicalFiles = dirtyPaths.filter((file) => !canonicalControlFiles.includes(file));

const missingTokenEnv = requiredTokenEnv.filter((name) => !process.env[name]);

const checks = [];

if (missingTokenEnv.length === 0) {
  const verify = runCommand('pnpm', ['backlog:verify']);
  checks.push(checkResult('backlog:verify', verify));

  if (verify.code === 0) {
    const matrix = runCommand('pnpm', ['backlog:matrix:check']);
    checks.push(checkResult('backlog:matrix:check', matrix));
  } else {
    checks.push(skippedResult('backlog:matrix:check', 'Skipped because backlog:verify failed.'));
  }

  const handoff = runCommand('pnpm', ['backlog:handoff:check']);
  checks.push(checkResult('backlog:handoff:check', handoff));
} else {
  checks.push(skippedResult('backlog:verify', 'Skipped due to missing required token/env variables.'));
  checks.push(skippedResult('backlog:matrix:check', 'Skipped due to missing required token/env variables.'));
  checks.push(skippedResult('backlog:handoff:check', 'Skipped due to missing required token/env variables.'));
}

const failedChecks = checks.filter((check) => check.result === 'FAIL');
const hasHardDirtyControlDrift = dirtyCanonicalFiles.length > 0;

const summary = {
  startedAt,
  completedAt: new Date().toISOString(),
  branch: branch.stdout.trim(),
  gitStatusLines: status.stdout.split(/\r?\n/).filter(Boolean),
  dirtyFileCount: dirtyPaths.length,
  dirtyCanonicalFiles,
  dirtyNonCanonicalFiles,
  requiredEnvPresence: Object.fromEntries(requiredTokenEnv.map((name) => [name, Boolean(process.env[name])])),
  missingRequiredEnv: missingTokenEnv,
  checks,
  outcome: {
    pass: missingTokenEnv.length === 0 && !hasHardDirtyControlDrift && failedChecks.length === 0,
    reasons: [
      ...(missingTokenEnv.length ? [`Missing required env vars: ${missingTokenEnv.join(', ')}`] : []),
      ...(hasHardDirtyControlDrift ? [`Canonical control files are dirty: ${dirtyCanonicalFiles.join(', ')}`] : []),
      ...failedChecks.map((check) => `${check.name} failed`),
    ],
  },
};

fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
fs.writeFileSync(artifactPath, JSON.stringify(summary, null, 2));

printSummary(summary, artifactPath);

if (!summary.outcome.pass) {
  process.exitCode = 1;
}

function parseEnvLine(line) {
  const trimmed = String(line || '').trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
  if (!match) return null;

  const key = match[1];
  let value = match[2] ?? '';

  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.slice(1, -1).replace(/\\n/g, '\n');
  } else if (value.startsWith("'") && value.endsWith("'")) {
    value = value.slice(1, -1);
  } else {
    const hashIndex = value.indexOf(' #');
    if (hashIndex >= 0) value = value.slice(0, hashIndex);
    value = value.trim();
  }

  return { key, value };
}

function preloadEnvFiles(files) {
  for (const filePath of files) {
    if (!fs.existsSync(filePath)) continue;
    const data = fs.readFileSync(filePath, 'utf8');
    for (const line of data.split(/\r?\n/)) {
      const entry = parseEnvLine(line);
      if (!entry) continue;
      if (process.env[entry.key] === undefined) {
        process.env[entry.key] = entry.value;
      }
    }
  }
}

function runCommand(command, args) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
    env: process.env,
  });

  return {
    code: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    command: [command, ...args].join(' '),
  };
}

function checkResult(name, result) {
  return {
    name,
    command: result.command,
    result: result.code === 0 ? 'PASS' : 'FAIL',
    code: result.code,
    stdout: clip(result.stdout),
    stderr: clip(result.stderr),
  };
}

function skippedResult(name, reason) {
  return {
    name,
    command: null,
    result: 'SKIPPED',
    code: null,
    stdout: '',
    stderr: reason,
  };
}

function parseDirtyPaths(statusOutput) {
  const lines = String(statusOutput || '').split(/\r?\n/).filter(Boolean);
  const paths = [];
  for (const line of lines) {
    if (line.startsWith('##')) continue;
    const match = line.match(/^..\s+(.+)$/);
    if (!match) continue;
    const rawPath = match[1].trim();
    const finalPath = rawPath.includes(' -> ') ? rawPath.split(' -> ').pop() : rawPath;
    if (finalPath) paths.push(finalPath);
  }
  return paths;
}

function clip(value, max = 4000) {
  const text = String(value || '').trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}...<truncated>`;
}

function printSummary(result, pathToArtifact) {
  console.log('Operator preflight summary');
  console.log(`- branch: ${result.branch}`);
  console.log(`- dirty files: ${result.dirtyFileCount}`);
  console.log(`- dirty canonical control files: ${result.dirtyCanonicalFiles.length}`);
  console.log(`- missing required env: ${result.missingRequiredEnv.length ? result.missingRequiredEnv.join(', ') : '(none)'}`);
  for (const check of result.checks) {
    console.log(`- ${check.name}: ${check.result}`);
  }
  if (result.outcome.reasons.length) {
    console.log('- blocking reasons:');
    for (const reason of result.outcome.reasons) {
      console.log(`  - ${reason}`);
    }
  }
  console.log(`- artifact: ${pathToArtifact}`);
}

#!/usr/bin/env node

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

import { env } from '../backlog-sync/common.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const artifactPath = path.join(repoRoot, 'artifacts', 'ops', 'symphony-handoff-check.json');

const workflowPath = path.join(repoRoot, 'WORKFLOW.md');
const workflowText = fs.readFileSync(workflowPath, 'utf8');
const workflowFrontmatter = extractFrontmatter(workflowText);
const sourceRepoUrl = env('SOURCE_REPO_URL', '');
const originRemote = runCommand('git', ['remote', 'get-url', 'origin']);
const workspaceRoot = expandHome(env('SYMPHONY_WORKSPACE_ROOT', path.join(os.homedir(), 'symphony-workspaces', 'lic-legal-suite')));
const tempRoot = fs.mkdtempSync(path.join(workspaceRoot, 'handoff-smoke-'));

const checks = [];

checks.push(checkResult('gh-auth', runCommand('gh', ['auth', 'status', '-h', 'github.com'])));

checks.push({
  name: 'origin-remote-ssh',
  result: isSshRepo(originRemote.stdout.trim()) ? 'PASS' : 'FAIL',
  detail: originRemote.stdout.trim() || '(missing)',
});

checks.push({
  name: 'source-repo-url-present',
  result: sourceRepoUrl ? 'PASS' : 'FAIL',
  detail: sourceRepoUrl || '(missing)',
});

checks.push({
  name: 'source-repo-url-ssh',
  result: isSshRepo(sourceRepoUrl) ? 'PASS' : 'FAIL',
  detail: sourceRepoUrl || '(missing)',
});

checks.push({
  name: 'workflow-thread-sandbox',
  result: /thread_sandbox:\s*danger-full-access/.test(workflowFrontmatter) ? 'PASS' : 'FAIL',
  detail: matchLine(workflowFrontmatter, 'thread_sandbox'),
});

checks.push({
  name: 'workflow-turn-sandbox-policy',
  result: /turn_sandbox_policy:\s*\n\s*type:\s*dangerFullAccess/.test(workflowFrontmatter) ? 'PASS' : 'FAIL',
  detail: matchBlock(workflowFrontmatter, 'turn_sandbox_policy'),
});

checks.push({
  name: 'workflow-approval-policy',
  result: /approval_policy:\s*never/.test(workflowFrontmatter) ? 'PASS' : 'FAIL',
  detail: matchLine(workflowFrontmatter, 'approval_policy'),
});

checks.push({
  name: 'workspace-root-exists',
  result: fs.existsSync(workspaceRoot) ? 'PASS' : 'FAIL',
  detail: workspaceRoot,
});

checks.push(checkResult('git-ref-write-smoke', gitRefWriteSmoke(tempRoot)));

const failed = checks.filter((check) => check.result === 'FAIL');
const summary = {
  startedAt: new Date().toISOString(),
  workflowPath,
  workspaceRoot,
  sourceRepoUrl: sourceRepoUrl || null,
  originRemote: originRemote.stdout.trim() || null,
  checks,
  outcome: {
    pass: failed.length === 0,
    reasons: failed.map((check) => check.name),
  },
};

fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
fs.writeFileSync(artifactPath, JSON.stringify(summary, null, 2));

printSummary(summary, artifactPath);

fs.rmSync(tempRoot, { recursive: true, force: true });

if (failed.length > 0) {
  process.exitCode = 1;
}

function extractFrontmatter(text) {
  const match = String(text).match(/^---\n([\s\S]*?)\n---/);
  return match?.[1] ?? '';
}

function matchLine(text, key) {
  const match = String(text).match(new RegExp(`^\\s*${escapeRegExp(key)}:\\s*(.+)$`, 'm'));
  return match?.[0]?.trim() ?? '(missing)';
}

function matchBlock(text, key) {
  const lines = String(text).split(/\r?\n/);
  const startIndex = lines.findIndex((line) => new RegExp(`^\\s*${escapeRegExp(key)}:`).test(line));
  if (startIndex < 0) return '(missing)';
  const collected = [lines[startIndex]];
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    if (/^\S/.test(lines[i])) break;
    if (/^[A-Za-z0-9_-]+:/.test(lines[i].trim())) break;
    collected.push(lines[i]);
  }
  return collected.join('\n').trim();
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function expandHome(value) {
  if (!value) return value;
  if (value === '~') return os.homedir();
  if (value.startsWith('~/')) return path.join(os.homedir(), value.slice(2));
  return value;
}

function isSshRepo(value) {
  return /^git@github\.com:[^/]+\/[^/]+\.git$/.test(String(value || '').trim());
}

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd || repoRoot,
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 10 * 1024 * 1024,
  });

  return {
    command: [command, ...args].join(' '),
    code: result.status ?? 1,
    stdout: String(result.stdout || '').trim(),
    stderr: String(result.stderr || '').trim(),
  };
}

function checkResult(name, commandResult) {
  return {
    name,
    command: commandResult.command,
    result: commandResult.code === 0 ? 'PASS' : 'FAIL',
    detail: [commandResult.stdout, commandResult.stderr].filter(Boolean).join('\n').trim(),
  };
}

function gitRefWriteSmoke(directory) {
  fs.mkdirSync(directory, { recursive: true });

  const commands = [
    runCommand('git', ['init', '-q'], { cwd: directory }),
    runCommand('git', ['config', 'user.name', 'Symphony Smoke'], { cwd: directory }),
    runCommand('git', ['config', 'user.email', 'symphony-smoke@local.invalid'], { cwd: directory }),
  ];

  fs.writeFileSync(path.join(directory, 'README.md'), '# Symphony handoff smoke\n');
  commands.push(runCommand('git', ['checkout', '-b', 'symphony-handoff-smoke'], { cwd: directory }));
  commands.push(runCommand('git', ['add', 'README.md'], { cwd: directory }));
  commands.push(runCommand('git', ['commit', '-m', 'chore: symphony handoff smoke'], { cwd: directory }));

  const failure = commands.find((command) => command.code !== 0);
  if (failure) {
    return failure;
  }

  return {
    command: commands.map((command) => command.command).join(' && '),
    code: 0,
    stdout: 'Branch creation and commit succeeded in disposable workspace.',
    stderr: '',
  };
}

function printSummary(result, artifact) {
  console.log('Symphony handoff check');
  console.log(`- workflow: ${result.workflowPath}`);
  console.log(`- workspace root: ${result.workspaceRoot}`);
  console.log(`- source repo url: ${result.sourceRepoUrl || '(missing)'}`);
  console.log(`- origin remote: ${result.originRemote || '(missing)'}`);
  for (const check of result.checks) {
    console.log(`- ${check.name}: ${check.result}`);
  }
  if (result.outcome.reasons.length > 0) {
    console.log('- blocking reasons:');
    for (const reason of result.outcome.reasons) {
      console.log(`  - ${reason}`);
    }
  }
  console.log(`- artifact: ${artifact}`);
}

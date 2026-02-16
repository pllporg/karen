#!/usr/bin/env node

import fs from 'node:fs';
import { execSync } from 'node:child_process';
import { env, githubRequest, requiredEnv } from './common.mjs';

const githubToken = requiredEnv('GITHUB_TOKEN');
const org = requiredEnv('GITHUB_ORG');
const repo = requiredEnv('GITHUB_REPO');
const visibility = env('GITHUB_REPO_VISIBILITY', 'private');
const defaultBranch = env('GITHUB_DEFAULT_BRANCH', 'main');
const remoteName = env('GITHUB_REMOTE_NAME', 'origin');
const pushOnBootstrap = env('PUSH_ON_BOOTSTRAP', 'true').toLowerCase() !== 'false';
const requiredCheckName = env('GITHUB_REQUIRED_CHECK', 'test');

function run(command, options = {}) {
  return execSync(command, {
    stdio: ['ignore', 'pipe', 'pipe'],
    encoding: 'utf8',
    ...options,
  }).trim();
}

function runSafe(command) {
  try {
    return run(command);
  } catch {
    return null;
  }
}

function ensureGitInitialized() {
  if (!fs.existsSync('.git')) {
    run(`git init -b ${defaultBranch}`);
  }
  run(`git branch -M ${defaultBranch}`);
}

function ensureGitIdentity() {
  const configuredEmail = runSafe('git config user.email');
  const configuredName = runSafe('git config user.name');
  const fallbackEmail = env('GIT_USER_EMAIL');
  const fallbackName = env('GIT_USER_NAME');

  if (!configuredEmail && fallbackEmail) {
    run(`git config user.email "${fallbackEmail}"`);
  }
  if (!configuredName && fallbackName) {
    run(`git config user.name "${fallbackName}"`);
  }
}

function ensureInitialCommit() {
  const hasChanges = Boolean(runSafe('git status --porcelain'));
  if (!hasChanges) return;

  run('git add .');
  try {
    run('git commit -m "chore: bootstrap parity backlog automation"');
  } catch (error) {
    const message = String(error?.stderr || error?.message || '');
    if (message.toLowerCase().includes('author identity unknown')) {
      throw new Error(
        'Git identity is not configured. Set GIT_USER_NAME and GIT_USER_EMAIL env vars, then rerun bootstrap.',
      );
    }
    throw error;
  }
}

async function ensureGithubRepo() {
  try {
    await githubRequest(githubToken, `/orgs/${org}/repos`, {
      method: 'POST',
      body: {
        name: repo,
        private: visibility !== 'public',
        auto_init: false,
      },
    });
    return { created: true };
  } catch (error) {
    if (!String(error.message).toLowerCase().includes('already exists')) {
      throw error;
    }
    return { created: false };
  }
}

function ensureRemote() {
  const remoteUrl = `https://github.com/${org}/${repo}.git`;
  const existing = runSafe(`git remote get-url ${remoteName}`);
  if (!existing) {
    run(`git remote add ${remoteName} ${remoteUrl}`);
    return remoteUrl;
  }
  if (existing !== remoteUrl) {
    run(`git remote set-url ${remoteName} ${remoteUrl}`);
  }
  return remoteUrl;
}

function pushBranch() {
  if (!pushOnBootstrap) return;
  run(`git push -u ${remoteName} ${defaultBranch}`);
}

async function setDefaultBranch() {
  await githubRequest(githubToken, `/repos/${org}/${repo}`, {
    method: 'PATCH',
    body: {
      default_branch: defaultBranch,
    },
  });
}

async function setBranchProtection() {
  await githubRequest(githubToken, `/repos/${org}/${repo}/branches/${defaultBranch}/protection`, {
    method: 'PUT',
    body: {
      required_status_checks: {
        strict: true,
        contexts: [requiredCheckName],
      },
      enforce_admins: false,
      required_pull_request_reviews: {
        dismiss_stale_reviews: true,
        require_code_owner_reviews: false,
        required_approving_review_count: 1,
      },
      restrictions: null,
      required_conversation_resolution: true,
      allow_force_pushes: false,
      allow_deletions: false,
      block_creations: false,
      lock_branch: false,
      allow_fork_syncing: true,
    },
  });
}

async function main() {
  ensureGitInitialized();
  ensureGitIdentity();
  ensureInitialCommit();

  const repoResult = await ensureGithubRepo();
  const remoteUrl = ensureRemote();
  pushBranch();
  await setDefaultBranch();
  await setBranchProtection();

  console.log(`GitHub repo ${repoResult.created ? 'created' : 'already existed'}: ${org}/${repo}`);
  console.log(`Remote configured: ${remoteName} -> ${remoteUrl}`);
  console.log(`Default branch: ${defaultBranch}`);
  console.log('Branch protection: enabled');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

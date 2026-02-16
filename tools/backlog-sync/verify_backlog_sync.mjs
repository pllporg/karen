#!/usr/bin/env node

import {
  env,
  extractRequirementId,
  getLinearProjectByName,
  getLinearProjectIssues,
  githubRequest,
  normalizeLabelName,
  requiredEnv,
} from './common.mjs';

const linearToken = requiredEnv('LINEAR_API_TOKEN');
const githubToken = requiredEnv('GITHUB_TOKEN');
const owner = requiredEnv('GITHUB_OWNER');
const repo = requiredEnv('GITHUB_REPO');
const projectName = env('LINEAR_PROJECT_NAME', 'Prompt Parity - Karen Legal Suite');
const scopeLabel = normalizeLabelName(env('LINEAR_SCOPE_LABEL', 'parity'));
const allowMismatch = normalizeLabelName(env('ALLOW_MISMATCH', 'false')) === 'true';

function parseLinearId(body) {
  const match = String(body || '').match(/Linear-ID:\s*([a-zA-Z0-9-]+)/i);
  return match?.[1] || null;
}

function parseRequirementFromBody(body) {
  const match = String(body || '').match(/Parity-Requirement-ID:\s*([A-Z0-9-]+)/i);
  return match?.[1] || 'UNSPECIFIED';
}

async function listMirroredGitHubIssues() {
  const issues = [];
  let page = 1;
  while (true) {
    const chunk = await githubRequest(
      githubToken,
      `/repos/${owner}/${repo}/issues?state=all&labels=${encodeURIComponent(scopeLabel)}&per_page=100&page=${page}`,
    );
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    issues.push(...chunk.filter((item) => !item.pull_request));
    page += 1;
  }
  return issues;
}

async function main() {
  const project = await getLinearProjectByName(linearToken, projectName);
  if (!project) {
    throw new Error(`Linear project not found: ${projectName}`);
  }

  const linearIssues = (await getLinearProjectIssues(linearToken, project.id)).filter((issue) =>
    (issue.labels?.nodes || []).some((label) => normalizeLabelName(label.name) === scopeLabel),
  );

  const githubIssues = await listMirroredGitHubIssues();
  const githubByLinearId = new Map();
  for (const issue of githubIssues) {
    const linearId = parseLinearId(issue.body);
    if (linearId) githubByLinearId.set(linearId, issue);
  }

  const missingMirrors = [];
  const missingRequirementIds = [];
  for (const issue of linearIssues) {
    const reqId = extractRequirementId(issue.description);
    if (reqId === 'UNSPECIFIED') {
      missingRequirementIds.push(issue.identifier);
    }
    if (!githubByLinearId.has(issue.id)) {
      missingMirrors.push(issue.identifier);
    }
  }

  const orphanMirrors = [];
  for (const [linearId, issue] of githubByLinearId.entries()) {
    if (!linearIssues.some((linearIssue) => linearIssue.id === linearId)) {
      orphanMirrors.push(`#${issue.number}`);
    }
  }

  const githubMissingRequirementMarker = githubIssues
    .filter((issue) => parseLinearId(issue.body))
    .filter((issue) => parseRequirementFromBody(issue.body) === 'UNSPECIFIED')
    .map((issue) => `#${issue.number}`);

  console.log(`Linear scoped issues: ${linearIssues.length}`);
  console.log(`GitHub mirrored issues: ${githubByLinearId.size}`);
  console.log(`Missing mirrors: ${missingMirrors.length}`);
  console.log(`Orphan mirrors: ${orphanMirrors.length}`);
  console.log(`Linear issues missing Requirement ID: ${missingRequirementIds.length}`);
  console.log(`GitHub issues missing requirement marker: ${githubMissingRequirementMarker.length}`);

  if (missingMirrors.length) {
    console.log(`Missing mirrors detail: ${missingMirrors.join(', ')}`);
  }
  if (orphanMirrors.length) {
    console.log(`Orphan mirrors detail: ${orphanMirrors.join(', ')}`);
  }
  if (missingRequirementIds.length) {
    console.log(`Missing requirement IDs detail: ${missingRequirementIds.join(', ')}`);
  }
  if (githubMissingRequirementMarker.length) {
    console.log(`GitHub missing requirement marker detail: ${githubMissingRequirementMarker.join(', ')}`);
  }

  const hasFailures =
    missingMirrors.length > 0 ||
    orphanMirrors.length > 0 ||
    missingRequirementIds.length > 0 ||
    githubMissingRequirementMarker.length > 0 ||
    linearIssues.length !== githubByLinearId.size;

  if (hasFailures && !allowMismatch) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

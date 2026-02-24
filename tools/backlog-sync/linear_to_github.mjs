#!/usr/bin/env node

import {
  asBool,
  buildMirrorBody,
  env,
  extractRequirementId,
  getLinearProjectByName,
  getLinearProjectIssues,
  githubRequest,
  listGitHubIssuesGraphQL,
  linearPriorityToGitHubLabel,
  linearStateToGitHub,
  normalizeLabelName,
  nowIsoMinusMinutes,
  requiredEnv,
} from './common.mjs';

const linearToken = requiredEnv('LINEAR_API_TOKEN');
const githubToken = requiredEnv('GITHUB_TOKEN');
const owner = requiredEnv('GITHUB_OWNER');
const repo = requiredEnv('GITHUB_REPO');
const projectName = env('LINEAR_PROJECT_NAME', 'Prompt Parity - LIC Legal Suite');
const scopeLabel = normalizeLabelName(env('LINEAR_SCOPE_LABEL', 'parity'));
const sinceIso = nowIsoMinusMinutes(Number(env('SYNC_LOOKBACK_MINUTES', '120')));
const dryRun = asBool(env('DRY_RUN', 'false'));

function dedupe(values) {
  return [...new Set(values.filter(Boolean))];
}

function toMirrorLabels(issue) {
  const state = linearStateToGitHub(issue.state?.name, issue.state?.type);
  const priorityLabel = linearPriorityToGitHubLabel(issue.priority);
  const passthroughLinearLabels = (issue.labels?.nodes || []).map((label) => normalizeLabelName(label.name));
  return dedupe(['parity', state.label, priorityLabel, ...passthroughLinearLabels]);
}

function toTitle(issue) {
  return `[${issue.identifier}] ${issue.title}`;
}

function parseLinearId(body) {
  const match = String(body || '').match(/Linear-ID:\s*([a-zA-Z0-9-]+)/i);
  return match?.[1] || null;
}

async function listRepoLabels() {
  const labels = [];
  let page = 1;
  while (true) {
    const chunk = await githubRequest(
      githubToken,
      `/repos/${owner}/${repo}/labels?per_page=100&page=${page}`,
    );
    if (!Array.isArray(chunk) || chunk.length === 0) break;
    labels.push(...chunk);
    page += 1;
  }
  return labels;
}

async function listRepoIssues({ labels = null } = {}) {
  const normalizedLabels = labels
    ? String(labels)
        .split(',')
        .map((value) => normalizeLabelName(value))
        .filter(Boolean)
    : null;
  return listGitHubIssuesGraphQL(githubToken, {
    owner,
    repo,
    labels: normalizedLabels,
  });
}

function colorForLabel(name) {
  if (name.startsWith('status:')) return '1f6feb';
  if (name.startsWith('priority:')) return 'd1242f';
  if (name === 'parity') return '6f42c1';
  return '8250df';
}

async function ensureRepoLabels(labelNames) {
  const existing = await listRepoLabels();
  const existingSet = new Set(existing.map((label) => normalizeLabelName(label.name)));

  for (const label of labelNames) {
    const normalized = normalizeLabelName(label);
    if (!normalized || existingSet.has(normalized)) continue;
    if (dryRun) continue;

    try {
      await githubRequest(githubToken, `/repos/${owner}/${repo}/labels`, {
        method: 'POST',
        body: {
          name: normalized,
          color: colorForLabel(normalized),
          description: normalized.startsWith('status:')
            ? 'Linear workflow mirror status'
            : normalized.startsWith('priority:')
              ? 'Linear priority mirror'
              : 'Linear parity mirror label',
        },
      });
      existingSet.add(normalized);
    } catch (error) {
      if (!String(error.message).includes('already_exists')) {
        throw error;
      }
    }
  }
}

async function loadMirrorIssueMap() {
  // Mirror issues should always carry the parity scope label, so this keeps the query bounded.
  const issues = await listRepoIssues({ labels: scopeLabel });
  const byLinearId = new Map();
  for (const issue of issues) {
    const linearId = parseLinearId(issue.body);
    if (!linearId) continue;
    const existing = byLinearId.get(linearId);
    if (!existing || Number(issue.number) > Number(existing.number)) {
      byLinearId.set(linearId, issue);
    }
  }
  return byLinearId;
}

async function upsertMirror(issue, mirrorIssueByLinearId) {
  const stateMirror = linearStateToGitHub(issue.state?.name, issue.state?.type);
  const labels = toMirrorLabels(issue);
  const requirementId = extractRequirementId(issue.description);
  const body = buildMirrorBody(issue, requirementId);
  const title = toTitle(issue);

  const existing = mirrorIssueByLinearId.get(issue.id) || null;
  if (!existing) {
    if (dryRun) {
      return { action: 'create', number: null, key: issue.identifier };
    }

    const created = await githubRequest(githubToken, `/repos/${owner}/${repo}/issues`, {
      method: 'POST',
      body: {
        title,
        body,
        labels,
      },
    });

    mirrorIssueByLinearId.set(issue.id, created);

    if (stateMirror.state === 'closed') {
      await githubRequest(githubToken, `/repos/${owner}/${repo}/issues/${created.number}`, {
        method: 'PATCH',
        body: { state: 'closed' },
      });
    }

    return { action: 'create', number: created.number, key: issue.identifier };
  }

  if (dryRun) {
    return { action: 'update', number: existing.number, key: issue.identifier };
  }

  await githubRequest(githubToken, `/repos/${owner}/${repo}/issues/${existing.number}`, {
    method: 'PATCH',
    body: {
      title,
      body,
      labels,
      state: stateMirror.state,
    },
  });

  return { action: 'update', number: existing.number, key: issue.identifier };
}

async function main() {
  const project = await getLinearProjectByName(linearToken, projectName);
  if (!project) {
    throw new Error(`Linear project not found: ${projectName}`);
  }

  const allProjectIssues = await getLinearProjectIssues(linearToken, project.id);
  const scopedIssues = allProjectIssues.filter((issue) => {
    const labels = (issue.labels?.nodes || []).map((label) => normalizeLabelName(label.name));
    if (!labels.includes(scopeLabel)) return false;
    return String(issue.updatedAt || '') >= sinceIso;
  });

  const labelUniverse = dedupe(scopedIssues.flatMap((issue) => toMirrorLabels(issue)));
  await ensureRepoLabels(labelUniverse);
  const mirrorIssueByLinearId = await loadMirrorIssueMap();

  let created = 0;
  let updated = 0;
  for (const issue of scopedIssues) {
    const result = await upsertMirror(issue, mirrorIssueByLinearId);
    if (result.action === 'create') created += 1;
    if (result.action === 'update') updated += 1;
    console.log(`${result.action.toUpperCase()} ${result.key}${result.number ? ` -> #${result.number}` : ''}`);
  }

  console.log(`Dry run: ${dryRun ? 'yes' : 'no'}`);
  console.log(`Project: ${projectName}`);
  console.log(`Since: ${sinceIso}`);
  console.log(`Scope label: ${scopeLabel}`);
  console.log(`Processed: ${scopedIssues.length}`);
  console.log(`Created: ${created}`);
  console.log(`Updated: ${updated}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

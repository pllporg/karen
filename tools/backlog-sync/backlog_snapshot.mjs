#!/usr/bin/env node

import { execSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  env,
  extractRequirementId,
  getLinearProjectByName,
  getLinearProjectIssues,
  normalizeLabelName,
  requiredEnv,
} from './common.mjs';

const linearToken = requiredEnv('LINEAR_API_TOKEN');
const projectName = env('LINEAR_PROJECT_NAME', 'Prompt Parity - Karen Legal Suite');
const scopeLabel = normalizeLabelName(env('LINEAR_SCOPE_LABEL', 'parity'));
const uiLaneLabel = normalizeLabelName(env('UI_LANE_LABEL', 'ui-ux'));
const topN = Math.max(1, Number(env('SNAPSHOT_TOP_N', '10')) || 10);
const recentIssueLimit = Math.max(1, Number(env('SNAPSHOT_RECENT_ISSUES', '10')) || 10);

const requirementsMatrixPath = path.join(process.cwd(), 'tools', 'backlog-sync', 'requirements.matrix.json');
const snapshotPath = path.join(process.cwd(), 'tools', 'backlog-sync', 'session.snapshot.json');
const verifyStatePath = path.join(process.cwd(), 'tools', 'backlog-sync', 'state', 'verify.last.json');

function statusWeight(status) {
  const weights = { Missing: 0, Partial: 1, Complete: 2, Verified: 3 };
  return weights[status] ?? 9;
}

function riskWeight(risk) {
  const weights = { High: 0, Medium: 1, Low: 2 };
  return weights[risk] ?? 9;
}

function phaseFromLabels(labels) {
  const normalized = Array.isArray(labels) ? labels.map((label) => normalizeLabelName(label)) : [];
  return normalized.includes('phase-2') ? 'phase-2' : 'phase-1';
}

function phaseWeight(phase) {
  const weights = { 'phase-1': 0, 'phase-2': 1 };
  return weights[phase] ?? 9;
}

function flattenMatrixTasks(matrix) {
  const rows = [];
  for (const epic of matrix.epics || []) {
    for (const task of epic.tasks || []) {
      const labels = Array.isArray(task.labels) ? task.labels : [];
      rows.push({
        epicCode: epic.code,
        epicTitle: epic.title,
        requirementId: task.requirementId,
        title: task.title,
        parityStatus: task.parityStatus,
        risk: task.risk,
        component: task.component,
        labels,
        phase: phaseFromLabels(labels),
      });
    }
  }
  return rows;
}

function countBy(items, keyGetter) {
  const counts = {};
  for (const item of items) {
    const key = keyGetter(item);
    counts[key] = (counts[key] || 0) + 1;
  }
  return counts;
}

function parseVerifyState(raw) {
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.generatedAt === 'string' && parsed.hasFailures === false) {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

function safeGit(command) {
  try {
    return String(execSync(command, { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })).trim();
  } catch {
    return null;
  }
}

async function main() {
  const requirementsMatrix = JSON.parse(await readFile(requirementsMatrixPath, 'utf8'));
  const tasks = flattenMatrixTasks(requirementsMatrix);
  const unresolvedTasks = tasks.filter((task) => task.parityStatus !== 'Verified');
  const sortedUnresolved = [...unresolvedTasks].sort((a, b) => {
    const phaseCompare = phaseWeight(a.phase) - phaseWeight(b.phase);
    if (phaseCompare !== 0) return phaseCompare;
    const statusCompare = statusWeight(a.parityStatus) - statusWeight(b.parityStatus);
    if (statusCompare !== 0) return statusCompare;
    const riskCompare = riskWeight(a.risk) - riskWeight(b.risk);
    if (riskCompare !== 0) return riskCompare;
    return String(a.requirementId).localeCompare(String(b.requirementId));
  });

  const topRequirements = sortedUnresolved.slice(0, topN).map((task) => ({
    requirementId: task.requirementId,
    parityStatus: task.parityStatus,
    risk: task.risk,
    title: task.title,
    component: task.component,
    epicCode: task.epicCode,
    phase: task.phase,
  }));

  const project = await getLinearProjectByName(linearToken, projectName);
  if (!project) {
    throw new Error(`Linear project not found: ${projectName}`);
  }

  const allProjectIssues = await getLinearProjectIssues(linearToken, project.id);
  const scopedIssues = allProjectIssues.filter((issue) =>
    (issue.labels?.nodes || []).some((label) => normalizeLabelName(label.name) === scopeLabel),
  );
  const sortedScoped = [...scopedIssues].sort((a, b) => Date.parse(b.updatedAt || '') - Date.parse(a.updatedAt || ''));

  const inProgressIssues = scopedIssues.filter((issue) => issue.state?.name === 'In Progress');
  const inProgressMissingVerification = inProgressIssues
    .filter((issue) => !/##\s*Verification Evidence/i.test(String(issue.description || '')))
    .map((issue) => issue.identifier);
  const uiLaneIssues = allProjectIssues.filter((issue) =>
    (issue.labels?.nodes || []).some((label) => normalizeLabelName(label.name) === uiLaneLabel),
  );
  const uiLaneOpenIssues = uiLaneIssues.filter((issue) => String(issue.state?.type || '').toLowerCase() !== 'completed');
  const sortedUiLaneOpen = [...uiLaneOpenIssues].sort((a, b) => a.identifier.localeCompare(b.identifier));

  let verifyState = null;
  try {
    verifyState = parseVerifyState(await readFile(verifyStatePath, 'utf8'));
  } catch {
    verifyState = null;
  }

  const gitStatusRaw = safeGit('git status --short --branch');
  const gitStatusLines = gitStatusRaw ? gitStatusRaw.split('\n') : [];
  const dirtyFileCount = gitStatusLines.filter((line) => line && !line.startsWith('##')).length;
  const headCommit = safeGit('git rev-parse HEAD');

  const generatedAt = new Date().toISOString();
  const snapshot = {
    schemaVersion: '1.1.0',
    generatedAt,
    sourceOfTruth: 'Linear',
    contextContract: {
      canonicalOrder: [
        'Linear issue (active)',
        'Linear project state',
        'tools/backlog-sync/requirements.matrix.json',
        'README.md (New Chat Bootstrap)',
        'Prompt-Context',
      ],
      githubIssues: 'mirror-only',
    },
    matrixSummary: {
      totalRequirements: tasks.length,
      unresolvedRequirements: unresolvedTasks.length,
      totalCountsByPhase: countBy(tasks, (task) => task.phase || 'Unknown'),
      unresolvedCountsByPhase: countBy(unresolvedTasks, (task) => task.phase || 'Unknown'),
      unresolvedCountsByStatus: countBy(unresolvedTasks, (task) => task.parityStatus || 'Unknown'),
      unresolvedCountsByRisk: countBy(unresolvedTasks, (task) => task.risk || 'Unknown'),
      unresolvedCountsByStatusAndRisk: countBy(
        unresolvedTasks,
        (task) => `${task.parityStatus || 'Unknown'}:${task.risk || 'Unknown'}`,
      ),
    },
    priority: {
      algorithm:
        'phase-1 before phase-2, then Missing -> Partial -> Complete (each ordered by risk High -> Medium -> Low)',
      topRequirements,
    },
    linearSummary: {
      projectName,
      scopeLabel,
      scopedIssueCount: scopedIssues.length,
      stateCounts: countBy(scopedIssues, (issue) => issue.state?.name || 'Unknown'),
      inProgressIssueKeys: inProgressIssues.map((issue) => issue.identifier),
      inProgressWithoutVerificationEvidence: inProgressMissingVerification,
      recentlyUpdatedIssues: sortedScoped.slice(0, recentIssueLimit).map((issue) => ({
        key: issue.identifier,
        title: issue.title,
        state: issue.state?.name || 'Unknown',
        updatedAt: issue.updatedAt || null,
        requirementId: extractRequirementId(issue.description),
      })),
    },
    uiLaneSummary: {
      label: uiLaneLabel,
      issueCount: uiLaneIssues.length,
      openIssueCount: uiLaneOpenIssues.length,
      stateCounts: countBy(uiLaneIssues, (issue) => issue.state?.name || 'Unknown'),
      openIssueKeys: sortedUiLaneOpen.map((issue) => issue.identifier),
      openIssues: sortedUiLaneOpen.map((issue) => ({
        key: issue.identifier,
        title: issue.title,
        state: issue.state?.name || 'Unknown',
        requirementId: extractRequirementId(issue.description),
        updatedAt: issue.updatedAt || null,
      })),
    },
    operational: {
      lastSuccessfulBacklogVerifyAt: verifyState?.generatedAt || null,
      verifyStatePath: 'tools/backlog-sync/state/verify.last.json',
    },
    workspace: {
      gitHead: headCommit,
      gitStatusShort: gitStatusLines,
      dirtyFileCount,
    },
  };

  await mkdir(path.dirname(snapshotPath), { recursive: true });
  await writeFile(snapshotPath, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');

  console.log(`Snapshot written: ${path.relative(process.cwd(), snapshotPath)}`);
  console.log(`Generated at: ${generatedAt}`);
  console.log(`Top requirements: ${topRequirements.map((item) => item.requirementId).join(', ') || '(none)'}`);
  console.log(`In Progress issues missing verification evidence: ${inProgressMissingVerification.length}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

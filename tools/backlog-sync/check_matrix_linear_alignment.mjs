#!/usr/bin/env node

import fs from 'node:fs';
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
const projectName = env('LINEAR_PROJECT_NAME', 'Prompt Parity - LIC Legal Suite');
const scopeLabel = normalizeLabelName(env('LINEAR_SCOPE_LABEL', 'parity'));
const allowMismatch = normalizeLabelName(env('ALLOW_MATRIX_LINEAR_MISMATCH', 'false')) === 'true';
const matrixPath = env(
  'REQUIREMENTS_MATRIX_PATH',
  path.join(process.cwd(), 'tools', 'backlog-sync', 'requirements.matrix.json'),
);

function parseMatrix(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function isOpenLinearStateType(stateType) {
  return String(stateType || '').toLowerCase() !== 'completed';
}

function expectsOpenLinearIssue(parityStatus) {
  const status = String(parityStatus || '').trim();
  return status === 'Missing' || status === 'Partial';
}

function flattenMatrixRequirements(matrix) {
  const rows = [];
  for (const epic of matrix.epics || []) {
    for (const task of epic.tasks || []) {
      rows.push({
        epicCode: epic.code,
        requirementId: task.requirementId,
        parityStatus: task.parityStatus,
        title: task.title,
      });
    }
  }
  return rows;
}

async function main() {
  const matrix = parseMatrix(matrixPath);
  const matrixRequirements = flattenMatrixRequirements(matrix);
  const matrixByRequirement = new Map(matrixRequirements.map((item) => [item.requirementId, item]));

  const project = await getLinearProjectByName(linearToken, projectName);
  if (!project) {
    throw new Error(`Linear project not found: ${projectName}`);
  }

  const linearIssues = (await getLinearProjectIssues(linearToken, project.id)).filter((issue) =>
    (issue.labels?.nodes || []).some((label) => normalizeLabelName(label.name) === scopeLabel),
  );

  const linearByRequirement = new Map();
  const openLinearByRequirement = new Map();
  const openLinearMissingFromMatrix = [];
  const openLinearDuplicates = [];

  for (const issue of linearIssues) {
    const requirementId = extractRequirementId(issue.description);
    if (!requirementId || requirementId === 'UNSPECIFIED') continue;
    if (!linearByRequirement.has(requirementId)) linearByRequirement.set(requirementId, []);
    linearByRequirement.get(requirementId).push(issue);

    if (requirementId.startsWith('REQ-') && isOpenLinearStateType(issue.state?.type)) {
      if (!matrixByRequirement.has(requirementId)) {
        openLinearMissingFromMatrix.push(issue.identifier);
      }
      if (!openLinearByRequirement.has(requirementId)) openLinearByRequirement.set(requirementId, []);
      openLinearByRequirement.get(requirementId).push(issue);
    }
  }

  for (const [requirementId, issues] of openLinearByRequirement.entries()) {
    if (issues.length > 1) {
      openLinearDuplicates.push({
        requirementId,
        issues: issues.map((item) => item.identifier),
      });
    }
  }

  const matrixRequiresOpenButMissing = [];
  const matrixCompleteButStillOpen = [];

  for (const row of matrixRequirements) {
    if (!row.requirementId || !row.requirementId.startsWith('REQ-')) continue;
    const openIssues = openLinearByRequirement.get(row.requirementId) || [];
    const shouldBeOpen = expectsOpenLinearIssue(row.parityStatus);
    if (shouldBeOpen && openIssues.length === 0) {
      matrixRequiresOpenButMissing.push(row.requirementId);
    }
    if (!shouldBeOpen && openIssues.length > 0) {
      matrixCompleteButStillOpen.push({
        requirementId: row.requirementId,
        parityStatus: row.parityStatus,
        openIssues: openIssues.map((item) => item.identifier),
      });
    }
  }

  const linearRequirementIdsNotInMatrix = [...openLinearByRequirement.keys()].filter(
    (requirementId) => !matrixByRequirement.has(requirementId),
  );

  console.log(`Matrix requirements: ${matrixRequirements.length}`);
  console.log(`Linear scoped issues: ${linearIssues.length}`);
  console.log(`Open Linear REQ issues: ${[...openLinearByRequirement.values()].flat().length}`);
  console.log(`Open Linear issues missing from matrix: ${openLinearMissingFromMatrix.length}`);
  console.log(`Matrix Missing/Partial requirements lacking open Linear issue: ${matrixRequiresOpenButMissing.length}`);
  console.log(`Matrix Complete/Verified requirements with open Linear issue: ${matrixCompleteButStillOpen.length}`);
  console.log(`Open Linear duplicate requirement IDs: ${openLinearDuplicates.length}`);

  if (openLinearMissingFromMatrix.length) {
    console.log(`Open Linear missing from matrix detail: ${openLinearMissingFromMatrix.join(', ')}`);
  }
  if (matrixRequiresOpenButMissing.length) {
    console.log(`Matrix requires open issue detail: ${matrixRequiresOpenButMissing.join(', ')}`);
  }
  if (matrixCompleteButStillOpen.length) {
    console.log(
      `Matrix complete but open detail: ${matrixCompleteButStillOpen
        .map((row) => `${row.requirementId}[${row.parityStatus}] -> ${row.openIssues.join('|')}`)
        .join(', ')}`,
    );
  }
  if (openLinearDuplicates.length) {
    console.log(
      `Open duplicate requirement detail: ${openLinearDuplicates
        .map((row) => `${row.requirementId} -> ${row.issues.join('|')}`)
        .join(', ')}`,
    );
  }
  if (linearRequirementIdsNotInMatrix.length) {
    console.log(`Open Linear requirement IDs not in matrix: ${linearRequirementIdsNotInMatrix.join(', ')}`);
  }

  const hasFailures =
    openLinearMissingFromMatrix.length > 0 ||
    matrixRequiresOpenButMissing.length > 0 ||
    matrixCompleteButStillOpen.length > 0 ||
    openLinearDuplicates.length > 0;

  if (hasFailures && !allowMismatch) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

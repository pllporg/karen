#!/usr/bin/env node

import { readFile } from 'node:fs/promises';
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

const snapshotPath = path.join(process.cwd(), 'tools', 'backlog-sync', 'session.snapshot.json');
const handoffPath = path.join(process.cwd(), 'docs', 'SESSION_HANDOFF.md');

async function main() {
  const snapshot = JSON.parse(await readFile(snapshotPath, 'utf8'));
  const handoff = await readFile(handoffPath, 'utf8');

  const escapedTimestamp = String(snapshot.generatedAt).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const snapshotTimestampPattern = new RegExp('Snapshot Timestamp:\\s*`?' + escapedTimestamp + '`?');
  const handoffContainsSnapshotTimestamp = snapshotTimestampPattern.test(handoff);

  const project = await getLinearProjectByName(linearToken, projectName);
  if (!project) {
    throw new Error(`Linear project not found: ${projectName}`);
  }

  const allIssues = await getLinearProjectIssues(linearToken, project.id);
  const scopedIssues = allIssues.filter((issue) =>
    (issue.labels?.nodes || []).some((label) => normalizeLabelName(label.name) === scopeLabel),
  );

  const inProgressIssues = scopedIssues.filter((issue) => issue.state?.name === 'In Progress');
  const inProgressMissingEvidence = inProgressIssues.filter(
    (issue) => !/##\s*Verification Evidence/i.test(String(issue.description || '')),
  );
  const inProgressMissingRequirementId = inProgressIssues.filter(
    (issue) => extractRequirementId(issue.description) === 'UNSPECIFIED',
  );

  console.log(`Snapshot path: ${path.relative(process.cwd(), snapshotPath)}`);
  console.log(`Handoff path: ${path.relative(process.cwd(), handoffPath)}`);
  console.log(`Snapshot timestamp in handoff: ${handoffContainsSnapshotTimestamp ? 'yes' : 'no'}`);
  console.log(`In Progress parity issues: ${inProgressIssues.length}`);
  console.log(`In Progress missing verification evidence: ${inProgressMissingEvidence.length}`);
  console.log(`In Progress missing Requirement ID: ${inProgressMissingRequirementId.length}`);

  if (!handoffContainsSnapshotTimestamp) {
    console.log(`Expected handoff timestamp: ${snapshot.generatedAt}`);
  }
  if (inProgressMissingEvidence.length > 0) {
    console.log(`Missing evidence keys: ${inProgressMissingEvidence.map((issue) => issue.identifier).join(', ')}`);
  }
  if (inProgressMissingRequirementId.length > 0) {
    console.log(`Missing Requirement ID keys: ${inProgressMissingRequirementId.map((issue) => issue.identifier).join(', ')}`);
  }

  const hasFailures =
    !handoffContainsSnapshotTimestamp ||
    inProgressMissingEvidence.length > 0 ||
    inProgressMissingRequirementId.length > 0;

  if (hasFailures) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import {
  asBool,
  env,
  getLinearProjectByName,
  getLinearProjectIssues,
  getLinearTeamByKey,
  getLinearTeamLabels,
  getLinearTeamStates,
  linearGraphQL,
  normalizeLabelName,
  requiredEnv,
} from './common.mjs';

const dryRun = asBool(env('DRY_RUN', 'false'), false) || process.argv.includes('--dry-run');
const token = requiredEnv('LINEAR_API_TOKEN');
const teamKey = env('LINEAR_TEAM_KEY', 'KAR');
const projectName = env('LINEAR_PROJECT_NAME', 'Prompt Parity - Karen Legal Suite');
const matrixPath = env(
  'REQUIREMENTS_MATRIX_PATH',
  path.join(process.cwd(), 'tools', 'backlog-sync', 'requirements.matrix.json'),
);

function parseJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function toPriorityFromRisk(risk) {
  const normalized = String(risk || '').toLowerCase();
  if (normalized === 'high') return 2;
  if (normalized === 'medium') return 3;
  if (normalized === 'low') return 4;
  return 0;
}

function buildEpicDescription(epic) {
  return [
    `Requirement ID: ${epic.code}`,
    'Prompt Section: Prompt parity epic',
    'Parity Status: Missing',
    `Risk: High`,
    `Component: Program`,
    'Verification Evidence:',
    '- (add links)',
    '',
    '## Problem statement',
    epic.description,
    '',
    '## Requirement excerpt',
    'Track and close all parity tasks under this epic.',
    '',
    '## Acceptance criteria',
    '- Child tasks created and linked.',
    '- Epic includes clear scope and status.',
    '',
    '## API/data/UI impact',
    '- Aggregates child task impact.',
    '',
    '## Security/privacy implications',
    '- Aggregates child task security posture.',
    '',
    '## Definition of done',
    '- All child tasks completed and verified.',
  ].join('\n');
}

function buildTaskDescription(epic, task) {
  const acceptance = task.acceptanceCriteria.map((item) => `- ${item}`).join('\n');
  const done = task.definitionOfDone.map((item) => `- ${item}`).join('\n');
  return [
    `Requirement ID: ${task.requirementId}`,
    `Prompt Section: ${task.promptSection}`,
    `Parity Status: ${task.parityStatus}`,
    `Risk: ${task.risk}`,
    `Component: ${task.component}`,
    'Verification Evidence:',
    '- (add links)',
    '',
    `Parent Epic: ${epic.code} ${epic.title}`,
    '',
    '## Problem statement',
    task.problemStatement,
    '',
    '## Requirement excerpt',
    task.requirementExcerpt,
    '',
    '## Acceptance criteria',
    acceptance,
    '',
    '## API/data/UI impact',
    task.apiImpact,
    '',
    '## Security/privacy implications',
    task.securityImpact,
    '',
    '## Definition of done',
    done,
  ].join('\n');
}

function extractRequirementId(description) {
  const match = String(description || '').match(/Requirement ID:\s*([A-Z0-9-]+)/i);
  return match?.[1]?.toUpperCase() || null;
}

async function ensureLabels(teamId, matrix) {
  const required = new Set();
  for (const epic of matrix.epics) {
    (epic.labels || []).forEach((label) => required.add(normalizeLabelName(label)));
    required.add(normalizeLabelName(`component:program`));
    required.add(normalizeLabelName(`risk:high`));
    for (const task of epic.tasks || []) {
      (task.labels || []).forEach((label) => required.add(normalizeLabelName(label)));
      required.add(normalizeLabelName(`component:${task.component}`));
      required.add(normalizeLabelName(`risk:${task.risk}`));
      required.add(normalizeLabelName(`parity-status:${task.parityStatus}`));
    }
  }

  const existing = await getLinearTeamLabels(token, teamId);
  const map = new Map(existing.map((label) => [normalizeLabelName(label.name), label.id]));

  const created = [];
  for (const labelName of required) {
    if (!labelName || map.has(labelName)) continue;
    if (dryRun) {
      created.push(labelName);
      continue;
    }

    const data = await linearGraphQL(
      token,
      `
        mutation IssueLabelCreate($input: IssueLabelCreateInput!) {
          issueLabelCreate(input: $input) {
            success
            issueLabel {
              id
              name
            }
          }
        }
      `,
      { input: { teamId, name: labelName } },
    );

    if (data?.issueLabelCreate?.success) {
      map.set(normalizeLabelName(data.issueLabelCreate.issueLabel.name), data.issueLabelCreate.issueLabel.id);
      created.push(labelName);
    }
  }

  return { map, created };
}

async function createIssue(input) {
  if (dryRun) {
    return {
      id: `dry-run-${Math.random().toString(16).slice(2)}`,
      identifier: 'DRY-RUN',
      title: input.title,
      description: input.description,
      url: '',
    };
  }

  const data = await linearGraphQL(
    token,
    `
      mutation IssueCreate($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            identifier
            title
            description
            url
          }
        }
      }
    `,
    { input },
  );

  if (!data?.issueCreate?.success) {
    throw new Error(`Failed to create Linear issue: ${input.title}`);
  }

  return data.issueCreate.issue;
}

async function main() {
  const matrix = parseJson(matrixPath);
  const team = await getLinearTeamByKey(token, teamKey);
  if (!team) {
    throw new Error(`Linear team not found: ${teamKey}`);
  }

  const project = await getLinearProjectByName(token, projectName);
  if (!project) {
    throw new Error(`Linear project not found: ${projectName}. Run backlog:linear:setup first.`);
  }

  const stateList = await getLinearTeamStates(token, team.id);
  const backlogState = stateList.find((state) => state.name.toLowerCase() === 'backlog') || null;
  const { map: labelIdByName, created: createdLabels } = await ensureLabels(team.id, matrix);
  const existingIssues = await getLinearProjectIssues(token, project.id);

  const issueByTitle = new Map(existingIssues.map((issue) => [issue.title, issue]));
  const issueByRequirement = new Map();
  for (const issue of existingIssues) {
    const requirementId = extractRequirementId(issue.description);
    if (requirementId) issueByRequirement.set(requirementId, issue);
  }

  let createdEpics = 0;
  let createdTasks = 0;
  let skippedEpics = 0;
  let skippedTasks = 0;

  for (const epic of matrix.epics) {
    const epicTitle = `${epic.code} ${epic.title}`;
    let epicIssue = issueByTitle.get(epicTitle);

    if (!epicIssue) {
      const epicLabelIds = (epic.labels || [])
        .map((label) => labelIdByName.get(normalizeLabelName(label)))
        .filter(Boolean);
      epicLabelIds.push(labelIdByName.get(normalizeLabelName('component:program')));
      epicLabelIds.push(labelIdByName.get(normalizeLabelName('risk:high')));

      epicIssue = await createIssue({
        teamId: team.id,
        projectId: project.id,
        title: epicTitle,
        description: buildEpicDescription(epic),
        stateId: backlogState?.id,
        labelIds: [...new Set(epicLabelIds.filter(Boolean))],
        priority: 2,
      });
      createdEpics += 1;
    } else {
      skippedEpics += 1;
    }

    for (const task of epic.tasks || []) {
      const existing = issueByRequirement.get(task.requirementId);
      if (existing) {
        skippedTasks += 1;
        continue;
      }

      const taskLabelIds = [
        ...(task.labels || []).map((label) => labelIdByName.get(normalizeLabelName(label))),
        labelIdByName.get(normalizeLabelName(`component:${task.component}`)),
        labelIdByName.get(normalizeLabelName(`risk:${task.risk}`)),
        labelIdByName.get(normalizeLabelName(`parity-status:${task.parityStatus}`)),
      ].filter(Boolean);

      const created = await createIssue({
        teamId: team.id,
        projectId: project.id,
        parentId: epicIssue.id,
        title: task.title,
        description: buildTaskDescription(epic, task),
        stateId: backlogState?.id,
        labelIds: [...new Set(taskLabelIds)],
        priority: toPriorityFromRisk(task.risk),
      });
      issueByRequirement.set(task.requirementId, created);
      createdTasks += 1;
    }
  }

  console.log(`Dry run: ${dryRun ? 'yes' : 'no'}`);
  console.log(`Created labels: ${createdLabels.length}`);
  console.log(`Created epics: ${createdEpics}`);
  console.log(`Skipped existing epics: ${skippedEpics}`);
  console.log(`Created tasks: ${createdTasks}`);
  console.log(`Skipped existing tasks: ${skippedTasks}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

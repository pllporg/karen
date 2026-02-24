#!/usr/bin/env node

import {
  env,
  getLinearProjectByName,
  getLinearTeamByKey,
  getLinearTeamLabels,
  getLinearTeamStates,
  linearGraphQL,
  normalizeLabelName,
  requiredEnv,
} from './common.mjs';

const token = requiredEnv('LINEAR_API_TOKEN');
const teamKey = env('LINEAR_TEAM_KEY', 'KAR');
const projectName = env('LINEAR_PROJECT_NAME', 'Prompt Parity - LIC Legal Suite');
const labelList = String(
  env(
    'LINEAR_PARITY_LABELS',
    'parity,security,migration,ai-governance,billing,portal,imports,exports,integrations,domain-construction',
  ),
)
  .split(',')
  .map((item) => normalizeLabelName(item))
  .filter(Boolean);

const desiredStates = String(
  env('LINEAR_WORKFLOW_STATES', 'Backlog,Ready,In Progress,Blocked,In Review,Done'),
)
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

function stateTypeForName(name) {
  const normalized = name.toLowerCase();
  if (normalized === 'backlog' || normalized === 'ready') return 'unstarted';
  if (normalized === 'done') return 'completed';
  return 'started';
}

function stateColorForName(name) {
  const normalized = name.toLowerCase();
  if (normalized === 'backlog') return '#6B7280';
  if (normalized === 'ready') return '#2563EB';
  if (normalized === 'in progress') return '#0284C7';
  if (normalized === 'blocked') return '#DC2626';
  if (normalized === 'in review') return '#D97706';
  if (normalized === 'done') return '#16A34A';
  return '#64748B';
}

async function ensureProject(teamId) {
  const existing = await getLinearProjectByName(token, projectName);
  if (existing) {
    return existing;
  }

  const created = await linearGraphQL(
    token,
    `
      mutation ProjectCreate($input: ProjectCreateInput!) {
        projectCreate(input: $input) {
          success
          project {
            id
            name
            url
          }
        }
      }
    `,
    {
      input: {
        name: projectName,
        teamIds: [teamId],
        description:
          'Canonical prompt-parity backlog for LIC Legal Suite. Linear is source of truth; GitHub issues are a mirror.',
      },
    },
  );

  if (!created?.projectCreate?.success) {
    throw new Error('Linear project creation was not successful.');
  }

  return created.projectCreate.project;
}

async function ensureLabels(teamId) {
  const existing = await getLinearTeamLabels(token, teamId);
  const byName = new Map(existing.map((label) => [normalizeLabelName(label.name), label]));
  const created = [];

  for (const labelName of labelList) {
    if (byName.has(labelName)) continue;

    const result = await linearGraphQL(
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
      {
        input: {
          teamId,
          name: labelName,
        },
      },
    );

    if (result?.issueLabelCreate?.success) {
      created.push(result.issueLabelCreate.issueLabel.name);
    }
  }

  return created;
}

async function ensureWorkflowStates(teamId) {
  const existingStates = await getLinearTeamStates(token, teamId);
  const existingNames = new Set(existingStates.map((state) => state.name.toLowerCase()));
  const created = [];
  const warnings = [];

  for (let index = 0; index < desiredStates.length; index += 1) {
    const stateName = desiredStates[index];
    if (existingNames.has(stateName.toLowerCase())) continue;

    try {
      const response = await linearGraphQL(
        token,
        `
          mutation WorkflowStateCreate($input: WorkflowStateCreateInput!) {
            workflowStateCreate(input: $input) {
              success
              workflowState {
                id
                name
                type
              }
            }
          }
        `,
        {
          input: {
            teamId,
            name: stateName,
            type: stateTypeForName(stateName),
            position: index,
            color: stateColorForName(stateName),
          },
        },
      );

      if (response?.workflowStateCreate?.success) {
        created.push(stateName);
      }
    } catch (error) {
      warnings.push(`Could not auto-create Linear workflow state "${stateName}": ${error.message}`);
    }
  }

  return { created, warnings };
}

function printManualCustomFieldChecklist() {
  console.log('\nManual step required in Linear UI (project settings -> fields):');
  console.log('- Requirement ID (text)');
  console.log('- Prompt Section (single select)');
  console.log('- Parity Status (single select: Missing, Partial, Complete, Verified)');
  console.log('- Risk (single select: High, Medium, Low)');
  console.log('- Component (single select: API, Web, Infra, Data, Integrations, AI)');
  console.log('- Verification Evidence (text)');
}

async function main() {
  const team = await getLinearTeamByKey(token, teamKey);
  if (!team) {
    throw new Error(`Linear team not found for key "${teamKey}".`);
  }

  const project = await ensureProject(team.id);
  const createdLabels = await ensureLabels(team.id);
  const stateResult = await ensureWorkflowStates(team.id);

  console.log('Linear workspace setup complete.');
  console.log(`Team: ${team.name} (${team.key})`);
  console.log(`Project: ${project.name} (${project.id})`);
  console.log(`Created labels: ${createdLabels.length ? createdLabels.join(', ') : 'none'}`);
  console.log(`Created workflow states: ${stateResult.created.length ? stateResult.created.join(', ') : 'none'}`);

  for (const warning of stateResult.warnings) {
    console.warn(`Warning: ${warning}`);
  }

  printManualCustomFieldChecklist();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

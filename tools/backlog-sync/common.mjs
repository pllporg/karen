#!/usr/bin/env node

const LINEAR_API_URL = 'https://api.linear.app/graphql';
const GITHUB_API_URL = 'https://api.github.com';

export function env(name, fallback = undefined) {
  const value = process.env[name];
  if (value === undefined || value === '') {
    return fallback;
  }
  return value;
}

export function requiredEnv(name) {
  const value = env(name);
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function asBool(value, fallback = false) {
  if (value === undefined || value === null || value === '') return fallback;
  const normalized = String(value).trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

export function nowIsoMinusMinutes(minutes) {
  const ms = Number(minutes) * 60 * 1000;
  return new Date(Date.now() - ms).toISOString();
}

export function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}

export function normalizeLabelName(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s:_-]/g, '')
    .replace(/\s+/g, '-')
    .slice(0, 50);
}

export function slugify(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function linearStateToGitHub(stateName, stateType) {
  const name = String(stateName || '').trim();
  const table = {
    Backlog: { state: 'open', label: 'status:backlog' },
    Ready: { state: 'open', label: 'status:ready' },
    'In Progress': { state: 'open', label: 'status:in-progress' },
    Blocked: { state: 'open', label: 'status:blocked' },
    'In Review': { state: 'open', label: 'status:in-review' },
    Done: { state: 'closed', label: 'status:done' },
  };

  if (table[name]) return table[name];

  if (String(stateType || '').toLowerCase() === 'completed') {
    return { state: 'closed', label: 'status:done' };
  }

  return { state: 'open', label: `status:${normalizeLabelName(name || 'unknown')}` };
}

export function linearPriorityToGitHubLabel(priority) {
  const numeric = Number(priority || 0);
  if (numeric === 1) return 'priority:urgent';
  if (numeric === 2) return 'priority:high';
  if (numeric === 3) return 'priority:medium';
  if (numeric === 4) return 'priority:low';
  return null;
}

export function extractRequirementId(text) {
  const source = String(text || '');
  const patterns = [
    /Parity-Requirement-ID:\s*([A-Z0-9-]+)/i,
    /Requirement ID:\s*([A-Z0-9-]+)/i,
    /\b(REQ-[A-Z0-9-]+)\b/i,
  ];
  for (const pattern of patterns) {
    const match = source.match(pattern);
    if (match?.[1]) {
      return match[1].toUpperCase();
    }
  }
  return 'UNSPECIFIED';
}

export function buildMirrorBody(issue, requirementId) {
  const labels = ensureArray(issue.labels?.nodes).map((label) => label.name).join(', ');
  const stateName = issue.state?.name || 'Unknown';
  const updatedAt = issue.updatedAt || '';
  const description = String(issue.description || '').trim();

  return [
    '<!-- LINEAR-GITHUB-MIRROR: DO NOT REMOVE MARKER LINES -->',
    `Linear-ID: ${issue.id}`,
    `Linear-Key: ${issue.identifier}`,
    `Parity-Requirement-ID: ${requirementId}`,
    '',
    '## Source',
    `- Linear URL: ${issue.url || ''}`,
    `- Team: ${issue.team?.key || ''}`,
    `- Project: ${issue.project?.name || ''}`,
    '',
    '## Status',
    `- Linear State: ${stateName}`,
    `- Linear Priority: ${issue.priority ?? 0}`,
    `- Last Updated: ${updatedAt}`,
    '',
    '## Labels',
    labels || '(none)',
    '',
    '## Linear Description',
    description || '(empty)',
  ].join('\n');
}

export async function linearGraphQL(token, query, variables = {}) {
  const response = await fetch(LINEAR_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: token,
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`Linear API request failed (${response.status}): ${JSON.stringify(payload)}`);
  }
  if (payload.errors?.length) {
    throw new Error(`Linear GraphQL error: ${payload.errors.map((error) => error.message).join('; ')}`);
  }
  return payload.data;
}

export async function linearGraphQLWithFallback(token, queries, variables = {}) {
  let lastError;
  for (const query of queries) {
    try {
      return await linearGraphQL(token, query, variables);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export async function githubRequest(token, path, { method = 'GET', body, extraHeaders = {} } = {}) {
  const response = await fetch(`${GITHUB_API_URL}${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...extraHeaders,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) return {};

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`GitHub API request failed (${response.status}) ${method} ${path}: ${JSON.stringify(payload)}`);
  }
  return payload;
}

export async function githubGraphQL(token, query, variables = {}) {
  const response = await fetch(`${GITHUB_API_URL}/graphql`, {
    method: 'POST',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`GitHub GraphQL request failed (${response.status}): ${JSON.stringify(payload)}`);
  }
  if (payload.errors?.length) {
    throw new Error(`GitHub GraphQL errors: ${JSON.stringify(payload.errors)}`);
  }
  return payload.data;
}

export async function listGitHubIssuesGraphQL(token, { owner, repo, labels = null }) {
  const issues = [];
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const data = await githubGraphQL(
      token,
      `
        query RepoIssues($owner: String!, $repo: String!, $after: String, $labels: [String!]) {
          repository(owner: $owner, name: $repo) {
            issues(
              first: 100
              after: $after
              states: [OPEN, CLOSED]
              orderBy: { field: UPDATED_AT, direction: DESC }
              labels: $labels
            ) {
              nodes {
                id
                number
                title
                body
                state
                updatedAt
                labels(first: 50) {
                  nodes {
                    name
                  }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      `,
      {
        owner,
        repo,
        after: cursor,
        labels: labels?.length ? labels : null,
      },
    );

    const page = data?.repository?.issues;
    issues.push(...ensureArray(page?.nodes));
    hasNextPage = Boolean(page?.pageInfo?.hasNextPage);
    cursor = page?.pageInfo?.endCursor || null;
  }

  return issues;
}

export async function getLinearTeamByKey(token, teamKey) {
  const data = await linearGraphQL(
    token,
    `
      query Teams {
        teams(first: 250) {
          nodes {
            id
            key
            name
          }
        }
      }
    `,
  );
  return ensureArray(data?.teams?.nodes).find((team) => team.key === teamKey) || null;
}

export async function getLinearProjectByName(token, projectName) {
  const data = await linearGraphQL(
    token,
    `
      query Projects {
        projects(first: 250) {
          nodes {
            id
            name
            url
          }
        }
      }
    `,
  );
  return ensureArray(data?.projects?.nodes).find((project) => project.name === projectName) || null;
}

export async function getLinearTeamLabels(token, teamId) {
  const data = await linearGraphQLWithFallback(
    token,
    [
      `
        query TeamLabels($teamId: String!) {
          team(id: $teamId) {
            labels(first: 250) {
              nodes {
                id
                name
              }
            }
          }
        }
      `,
      `
        query TeamLabels($teamId: String!) {
          team(id: $teamId) {
            issueLabels(first: 250) {
              nodes {
                id
                name
              }
            }
          }
        }
      `,
    ],
    { teamId },
  );

  const labels = data?.team?.labels?.nodes || data?.team?.issueLabels?.nodes || [];
  return ensureArray(labels);
}

export async function getLinearTeamStates(token, teamId) {
  const data = await linearGraphQLWithFallback(
    token,
    [
      `
        query TeamStates($teamId: String!) {
          team(id: $teamId) {
            states {
              nodes {
                id
                name
                type
              }
            }
          }
        }
      `,
      `
        query TeamStates($teamId: String!) {
          team(id: $teamId) {
            workflowStates {
              nodes {
                id
                name
                type
              }
            }
          }
        }
      `,
    ],
    { teamId },
  );

  const states = data?.team?.states?.nodes || data?.team?.workflowStates?.nodes || [];
  return ensureArray(states);
}

export async function getLinearProjectIssues(token, projectId) {
  const nodes = [];
  let hasNextPage = true;
  let cursor = null;

  while (hasNextPage) {
    const data = await linearGraphQL(
      token,
      `
        query ProjectIssues($projectId: String!, $after: String) {
          project(id: $projectId) {
            issues(first: 100, after: $after) {
              nodes {
                id
                identifier
                title
                description
                priority
                updatedAt
                url
                state {
                  id
                  name
                  type
                }
                team {
                  id
                  key
                }
                project {
                  id
                  name
                }
                labels {
                  nodes {
                    id
                    name
                  }
                }
              }
              pageInfo {
                hasNextPage
                endCursor
              }
            }
          }
        }
      `,
      { projectId, after: cursor },
    );

    const page = data?.project?.issues;
    nodes.push(...ensureArray(page?.nodes));
    hasNextPage = Boolean(page?.pageInfo?.hasNextPage);
    cursor = page?.pageInfo?.endCursor || null;
  }

  return nodes;
}

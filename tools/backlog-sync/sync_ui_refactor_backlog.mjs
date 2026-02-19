#!/usr/bin/env node

import { asBool, env, getLinearProjectByName, getLinearProjectIssues, linearGraphQL, requiredEnv } from './common.mjs';

const token = requiredEnv('LINEAR_API_TOKEN');
const projectName = env('LINEAR_PROJECT_NAME', 'Prompt Parity - Karen Legal Suite');
const dryRun = asBool(env('DRY_RUN', 'false'), false) || process.argv.includes('--dry-run');

const issueSpecs = [
  {
    identifier: 'KAR-54',
    title: 'Plan UI/UX refactor lane with Brand Identity canonical precedence',
    requirementId: 'REQ-UI-001',
    promptSection: 'UI/UX Refactor Lane / Canonical source + precedence',
    parityStatus: 'Complete',
    risk: 'Medium',
    component: 'Web',
    problemStatement:
      'UI guidance drift existed across legacy docs, AGENTS instructions, and implementation tokens. The lane plan now needs one canonical source so refactor work is deterministic.',
    requirementExcerpt:
      'When UI setup conflicts with the Brand Identity Document, the Brand Identity Document must be treated as canonical.',
    acceptanceCriteria: [
      'UI plan names `brand/Brand Identity Document/` as canonical source.',
      'Plan explicitly states conflict-resolution rule: Brand Identity overrides legacy UI docs/setup.',
      'Plan maps downstream execution tickets to enforce token/layout/interaction compliance.',
    ],
    apiImpact: 'No runtime API changes; planning and governance alignment only.',
    securityImpact: 'Reduces governance drift risk in review-critical UI workflows.',
    definitionOfDone: [
      'Plan document is updated and referenced from README.',
      'UI ticket sequence KAR-55 through KAR-60 is aligned to canonical standards.',
    ],
    verificationEvidence: ['docs/UI_REFACTOR_LANE_PLAN.md', 'README.md'],
  },
  {
    identifier: 'KAR-55',
    title: 'Define canonical UI token contract from Brand Identity Document',
    requirementId: 'REQ-UI-002',
    promptSection: 'UI/UX Refactor Lane / Foundation realignment',
    parityStatus: 'Complete',
    risk: 'Medium',
    component: 'Web',
    problemStatement:
      'Token, typography, spacing, geometry, and motion contracts must be derived from Brand Identity source files to prevent ad hoc UI drift.',
    requirementExcerpt:
      'Color, typography, spacing, rules, and motion constants must follow Brand Identity definitions and precedence rules.',
    acceptanceCriteria: [
      'Token contract captures canonical palette and functional color constraints.',
      'Typography role mapping and spacing/grid constraints are documented.',
      'Contract includes explicit compliance failure conditions and checklist linkage.',
    ],
    apiImpact: 'No API changes; shared UI contract and implementation guidance only.',
    securityImpact: 'No direct security impact; improves procedural consistency.',
    definitionOfDone: [
      'Token contract doc references canonical Brand Identity sections.',
      'Compliance checklist linkage is documented for UI tickets.',
    ],
    verificationEvidence: ['docs/UI_TOKEN_CONTRACT.md', 'docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md'],
  },
  {
    identifier: 'KAR-56',
    title: 'Refactor global app shell and navigation to Brand Identity standards',
    requirementId: 'REQ-UI-003',
    promptSection: 'UI/UX Refactor Lane / Shell + navigation',
    parityStatus: 'Missing',
    risk: 'Medium',
    component: 'Web',
    problemStatement:
      'Current shell/navigation patterns are mixed-style and not fully aligned with Brand Identity layout density, hierarchy, and state visibility doctrine.',
    requirementExcerpt:
      'App shell and navigation must follow canonical layout/grid/rule hierarchy and interaction visibility standards.',
    acceptanceCriteria: [
      'Global shell uses canonical layout spacing/grid constraints and rule hierarchy.',
      'Navigation labels/metadata typography and interaction states follow token contract.',
      'No prohibited decoration patterns (shadows, gradients, rounded corners) remain in shell/nav surfaces.',
    ],
    apiImpact: 'No API contract changes expected.',
    securityImpact: 'No direct security impact; preserves operational clarity for privileged workflows.',
    definitionOfDone: [
      'Shell/nav screens pass UI checklist sign-off.',
      'Web regression coverage confirms no navigation-state regressions.',
    ],
    verificationEvidence: ['docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md'],
  },
  {
    identifier: 'KAR-57',
    title: 'Uplift shared UI primitives and interaction state model to canonical standards',
    requirementId: 'REQ-UI-004',
    promptSection: 'UI/UX Refactor Lane / Primitive system uplift',
    parityStatus: 'Missing',
    risk: 'Medium',
    component: 'Web',
    problemStatement:
      'Shared primitives are inconsistent in state handling and styling, creating non-uniform behavior across workflows.',
    requirementExcerpt:
      'Button/Input/Select/Badge/Table/Card/Drawer/Modal/Toast primitives must expose consistent, explicit state behavior under Brand Identity rules.',
    acceptanceCriteria: [
      'Primitive components consume canonical tokens and typography roles.',
      'Focus, disabled, error, success, and destructive states are explicit and consistent.',
      'Destructive actions require explicit confirmation patterns where applicable.',
    ],
    apiImpact: 'No API changes expected.',
    securityImpact: 'Improves safety in destructive or review-gated actions by clarifying state.',
    definitionOfDone: [
      'Primitive library surfaces pass checklist and accessibility checks.',
      'Representative workflow screens use updated primitives without behavior regressions.',
    ],
    verificationEvidence: ['docs/UI_TOKEN_CONTRACT.md', 'docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md'],
  },
  {
    identifier: 'KAR-58',
    title: 'Execute accessibility and interaction compliance remediation lane',
    requirementId: 'REQ-UI-005',
    promptSection: 'UI/UX Refactor Lane / Accessibility + interaction compliance',
    parityStatus: 'Missing',
    risk: 'High',
    component: 'Web',
    problemStatement:
      'Accessibility and interaction rules are not yet uniformly enforced across refactor surfaces.',
    requirementExcerpt:
      'Keyboard-first navigation, visible focus, reduced motion support, and explicit feedback hierarchy are required.',
    acceptanceCriteria: [
      'Focus-visible, tab order, and modal focus management are verified across key screens.',
      'Reduced-motion behavior disables non-essential transitions.',
      'Feedback hierarchy matches checklist (inline state, toast, inline alert, confirmation dialog).',
    ],
    apiImpact: 'No API changes expected.',
    securityImpact: 'Reduces operator error risk by improving clarity of destructive/irreversible actions.',
    definitionOfDone: [
      'Accessibility remediations are covered by tests where patterns already exist.',
      'Checklist sign-off and manual keyboard walkthrough evidence recorded.',
    ],
    verificationEvidence: ['docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md'],
  },
  {
    identifier: 'KAR-59',
    title: 'Define and apply responsive behavior matrix under Brand Identity constraints',
    requirementId: 'REQ-UI-006',
    promptSection: 'UI/UX Refactor Lane / Responsive + breakpoint doctrine',
    parityStatus: 'Missing',
    risk: 'Medium',
    component: 'Web',
    problemStatement:
      'Responsive behavior is not yet codified in a testable matrix for high-priority workflows.',
    requirementExcerpt:
      'Responsive behavior must preserve layout hierarchy, interaction clarity, and dense-data readability across supported breakpoints.',
    acceptanceCriteria: [
      'Responsive behavior matrix exists for dashboard, matters, communications, billing, and portal paths.',
      'Dense data views retain table/list-first patterns where required.',
      'Unsupported viewport constraints (if any) are explicit and handled predictably.',
    ],
    apiImpact: 'No API changes expected.',
    securityImpact: 'No direct security impact.',
    definitionOfDone: [
      'Matrix documentation is linked in verification evidence.',
      'Web tests cover representative responsive behaviors for priority workflows.',
    ],
    verificationEvidence: ['docs/UI_REFACTOR_LANE_PLAN.md', 'docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md'],
  },
  {
    identifier: 'KAR-60',
    title: 'Enforce UI regression and rollout gates for Brand Identity compliance',
    requirementId: 'REQ-UI-007',
    promptSection: 'UI/UX Refactor Lane / Regression + rollout gates',
    parityStatus: 'Missing',
    risk: 'High',
    component: 'Web',
    problemStatement:
      'Without explicit rollout gates, UI regressions can reintroduce non-canonical styles or unsafe interaction patterns.',
    requirementExcerpt:
      'UI rollout must include deterministic regression checks and checklist-based release gates.',
    acceptanceCriteria: [
      'UI-affecting PRs require checklist evidence and screenshot references.',
      'Regression suite covers core shell + matter + portal + AI workflow surfaces.',
      'Release criteria include no-console-errors and build/test pass requirements.',
    ],
    apiImpact: 'No API changes expected.',
    securityImpact: 'Supports safer operator workflows by preventing state-communication regressions.',
    definitionOfDone: [
      'Regression policy is documented and enforced in workflow/PR process.',
      'Evidence from smoke/regression runs is attached in issue and PR.',
    ],
    verificationEvidence: ['docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md', 'docs/WORKING_CONTRACT.md'],
  },
];

function buildDescription(spec) {
  const acceptance = spec.acceptanceCriteria.map((item) => `- ${item}`).join('\n');
  const done = spec.definitionOfDone.map((item) => `- ${item}`).join('\n');
  const evidence = spec.verificationEvidence.map((item) => `- ${item}`).join('\n');

  return [
    `Requirement ID: ${spec.requirementId}`,
    `Prompt Section: ${spec.promptSection}`,
    `Parity Status: ${spec.parityStatus}`,
    `Risk: ${spec.risk}`,
    `Component: ${spec.component}`,
    'Verification Evidence:',
    evidence || '- (add links)',
    '',
    '## Problem statement',
    spec.problemStatement,
    '',
    '## Requirement excerpt',
    spec.requirementExcerpt,
    '',
    '## Acceptance criteria',
    acceptance,
    '',
    '## API/data/UI impact',
    spec.apiImpact,
    '',
    '## Design + Interaction Compliance',
    '- Canonical source: `brand/Brand Identity Document/`',
    '- Checklist: `docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md`',
    '- Conflict rule: Brand Identity standards override conflicting legacy UI setup/docs.',
    '',
    '## Security/privacy implications',
    spec.securityImpact,
    '',
    '## Definition of done',
    done,
  ].join('\n');
}

async function updateIssue(issueId, input) {
  const data = await linearGraphQL(
    token,
    `
      mutation IssueUpdate($id: String!, $input: IssueUpdateInput!) {
        issueUpdate(id: $id, input: $input) {
          success
          issue {
            id
            identifier
            title
          }
        }
      }
    `,
    { id: issueId, input },
  );

  if (!data?.issueUpdate?.success) {
    throw new Error(`Failed to update issue ${issueId}`);
  }

  return data.issueUpdate.issue;
}

async function main() {
  const project = await getLinearProjectByName(token, projectName);
  if (!project) {
    throw new Error(`Linear project not found: ${projectName}`);
  }

  const issues = await getLinearProjectIssues(token, project.id);
  const issueByIdentifier = new Map(issues.map((issue) => [issue.identifier, issue]));

  let updated = 0;
  let skipped = 0;
  let missing = 0;

  for (const spec of issueSpecs) {
    const issue = issueByIdentifier.get(spec.identifier);
    if (!issue) {
      missing += 1;
      console.warn(`Missing issue: ${spec.identifier}`);
      continue;
    }

    const nextDescription = buildDescription(spec);
    const titleChanged = String(issue.title || '') !== String(spec.title);
    const descriptionChanged = String(issue.description || '') !== String(nextDescription);

    if (!titleChanged && !descriptionChanged) {
      skipped += 1;
      continue;
    }

    if (dryRun) {
      console.log(`[dry-run] would update ${spec.identifier}`);
      updated += 1;
      continue;
    }

    await updateIssue(issue.id, {
      title: spec.title,
      description: nextDescription,
    });
    console.log(`Updated ${spec.identifier}`);
    updated += 1;
  }

  console.log(`Dry run: ${dryRun ? 'yes' : 'no'}`);
  console.log(`Updated: ${updated}`);
  console.log(`Skipped (already current): ${skipped}`);
  console.log(`Missing: ${missing}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});

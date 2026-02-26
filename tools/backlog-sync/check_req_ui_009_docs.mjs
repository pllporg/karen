import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const backlogPath = resolve(root, 'docs/UI_PRD_SCREEN_BACKLOG.md');
const backlog = readFileSync(backlogPath, 'utf8');

const routes = [
  ['dashboard', 'REQ-UI-PRD-001'],
  ['matters-list', 'REQ-UI-PRD-002'],
  ['matter-workspace', 'REQ-UI-PRD-003'],
  ['contacts', 'REQ-UI-PRD-004'],
  ['communications', 'REQ-UI-PRD-005'],
  ['documents', 'REQ-UI-PRD-006'],
  ['billing', 'REQ-UI-PRD-007'],
  ['portal', 'REQ-UI-PRD-008'],
  ['ai', 'REQ-UI-PRD-009'],
  ['imports-exports', 'REQ-UI-PRD-010'],
  ['reporting-admin', 'REQ-UI-PRD-011'],
  ['auth-shared-doc', 'REQ-UI-PRD-012']
];

const requiredScreenSections = [
  '## States',
  '## Interaction Model',
  '## Role Visibility',
  '## Review-Gate Expectations',
  '## Accessibility Checks'
];

const requiredPrdSections = [
  '## State Model',
  '## Interaction Model',
  '## Permissions and Visibility',
  '## Accessibility Requirements'
];

const errors = [];
for (const [slug, backlogRef] of routes) {
  const prdRel = `docs/prd/REQ-UI-009-${slug}.prd.md`;
  const screenRel = `docs/screens/REQ-UI-009-${slug}.screen-spec.md`;
  const prd = readFileSync(resolve(root, prdRel), 'utf8');
  const screen = readFileSync(resolve(root, screenRel), 'utf8');

  if (!backlog.includes(prdRel) || !backlog.includes(screenRel)) {
    errors.push(`Coverage matrix missing artifact link for ${slug}.`);
  }

  for (const section of requiredPrdSections) {
    if (!prd.includes(section)) errors.push(`${prdRel} missing section: ${section}`);
  }
  if (!prd.includes('REQ-UI-009') || !prd.includes('KAR-71')) {
    errors.push(`${prdRel} missing traceability identifiers (REQ-UI-009/KAR-71).`);
  }

  for (const section of requiredScreenSections) {
    if (!screen.includes(section)) errors.push(`${screenRel} missing section: ${section}`);
  }
  if (!screen.includes('REQ-UI-009') || !screen.includes('KAR-71')) {
    errors.push(`${screenRel} missing traceability identifiers (REQ-UI-009/KAR-71).`);
  }
}

if (errors.length) {
  console.error('REQ-UI-009 docs consistency check failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('REQ-UI-009 docs consistency check passed.');

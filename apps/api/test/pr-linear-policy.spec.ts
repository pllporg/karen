import { readFileSync } from 'node:fs';
import { join } from 'node:path';

function extractShellRegex(source: string, variable: string): RegExp {
  const match = source.match(new RegExp(`${variable}='([^']+)'`));
  if (!match?.[1]) {
    throw new Error(`Missing regex variable ${variable}`);
  }
  return new RegExp(match[1]);
}

describe('PR Linear policy governance', () => {
  const workflowPath = join(__dirname, '../../../.github/workflows/pr-linear-policy.yml');
  const templatePath = join(__dirname, '../../../.github/pull_request_template.md');

  it('keeps required policy checks in the workflow', () => {
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain('name: PR Linear Policy');
    expect(workflow).toContain('validate-linear-linkage');
    expect(workflow).toContain('types: [opened, edited, synchronize, reopened]');
    expect(workflow).toContain('Branch name must match: lin/<LINEAR_KEY>-<slug>');
    expect(workflow).toContain('PR title must match: [<LINEAR_KEY>] <concise title>');
    expect(workflow).toContain("PR body must include the 'Linear Issue' section from the template.");
    expect(workflow).toContain('PR body must include Requirement ID.');
  });

  it('enforces expected branch/title key patterns', () => {
    const workflow = readFileSync(workflowPath, 'utf8');
    const branchRegex = extractShellRegex(workflow, 'BRANCH_REGEX');
    const titleRegex = extractShellRegex(workflow, 'TITLE_REGEX');
    const keyRegex = extractShellRegex(workflow, 'KEY_REGEX');

    expect(branchRegex.test('lin/KAR-123-verify-policy-hardening')).toBe(true);
    expect(branchRegex.test('feature/KAR-123-policy')).toBe(false);

    expect(titleRegex.test('[KAR-123] Verify policy hardening')).toBe(true);
    expect(titleRegex.test('KAR-123 Verify policy hardening')).toBe(false);

    expect('lin/KAR-123-verify-policy'.match(keyRegex)?.[0]).toBe('KAR-123');
    expect('[KAR-123] Verify policy hardening'.match(keyRegex)?.[0]).toBe('KAR-123');
  });

  it('keeps required metadata sections in the PR template', () => {
    const template = readFileSync(templatePath, 'utf8');

    expect(template).toContain('## Linear Issue');
    expect(template).toContain('## Requirement ID');
    expect(template).toContain('## Acceptance Criteria Checklist');
    expect(template).toContain('## Test Evidence');
    expect(template).toContain('## UI Interaction Checklist');
    expect(template).toContain('## Screenshot Evidence');
    expect(template).toContain('No console errors observed on touched routes.');
  });
});

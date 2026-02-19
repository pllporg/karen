import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('UI regression rollout gate policy', () => {
  const workflowPath = join(__dirname, '../../../.github/workflows/ui-regression-rollout-gates.yml');
  const webPackagePath = join(__dirname, '../../../apps/web/package.json');
  const rootPackagePath = join(__dirname, '../../../package.json');
  const runbookPath = join(__dirname, '../../../docs/UI_REGRESSION_ROLLOUT_GATES.md');

  it('defines dedicated UI rollout evidence + regression workflow gates', () => {
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain('name: UI Regression and Rollout Gates');
    expect(workflow).toContain('ui-rollout-evidence');
    expect(workflow).toContain('ui-regression');
    expect(workflow).toContain('actions/github-script@v7');
    expect(workflow).toContain('UI Interaction Checklist');
    expect(workflow).toContain('Screenshot Evidence');
    expect(workflow).toContain('No console errors');
    expect(workflow).toContain('pnpm --filter web test:regression');
    expect(workflow).toContain('pnpm --filter web build');
    expect(workflow).toContain("file.filename.startsWith('apps/web/')");
    expect(workflow).toContain("file.filename.startsWith('brand/')");
    expect(workflow).toContain("file.filename.startsWith('docs/UI_')");
  });

  it('keeps canonical regression scripts available in package scripts', () => {
    const webPackage = JSON.parse(readFileSync(webPackagePath, 'utf8'));
    const rootPackage = JSON.parse(readFileSync(rootPackagePath, 'utf8'));

    expect(webPackage.scripts?.['test:regression']).toContain('test/app-shell.spec.tsx');
    expect(webPackage.scripts?.['test:regression']).toContain('test/matters-page.spec.tsx');
    expect(webPackage.scripts?.['test:regression']).toContain('test/portal-page.spec.tsx');
    expect(webPackage.scripts?.['test:regression']).toContain('test/ai-page.spec.tsx');
    expect(rootPackage.scripts?.['test:ui-regression']).toContain('pnpm --filter web test:regression');
    expect(rootPackage.scripts?.['test:ui-regression']).toContain('pnpm --filter web build');
  });

  it('documents rollout runbook and release criteria', () => {
    const runbook = readFileSync(runbookPath, 'utf8');

    expect(runbook).toContain('Requirement: `REQ-UI-007` (`KAR-60`)');
    expect(runbook).toContain('UI Regression and Rollout Gates');
    expect(runbook).toContain('UI Interaction Checklist');
    expect(runbook).toContain('Screenshot Evidence');
    expect(runbook).toMatch(/no console errors/i);
    expect(runbook).toContain('pnpm test:ui-regression');
  });
});

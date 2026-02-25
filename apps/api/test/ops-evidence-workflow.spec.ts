import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('ops evidence workflow guardrails', () => {
  const workflowPath = join(__dirname, '../../../.github/workflows/ops-readiness-evidence.yml');
  const packageJsonPath = join(__dirname, '../../../package.json');

  it('defines readiness evidence workflow with backup drill and provider capture commands', () => {
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain('name: Ops Readiness Evidence');
    expect(workflow).toContain('pnpm ops:drill:backup-restore');
    expect(workflow).toContain('pnpm ops:evidence:capture');
    expect(workflow).toContain('actions/upload-artifact@v4');
    expect(workflow).toContain('name: ops-readiness-evidence');
  });

  it('exposes top-level scripts for manual ops evidence generation', () => {
    const packageJson = readFileSync(packageJsonPath, 'utf8');

    expect(packageJson).toContain('"ops:drill:backup-restore"');
    expect(packageJson).toContain('"ops:evidence:capture"');
    expect(packageJson).toContain('"ops:readiness:evidence"');
  });
});

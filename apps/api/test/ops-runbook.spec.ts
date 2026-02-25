import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('Operations runbook verification', () => {
  const runbookPath = join(__dirname, '../../../docs/DEPLOYMENT_RUNBOOK.md');
  const parityArtifactPath = join(__dirname, '../../../docs/parity/ops-runbook-slos.md');
  const readmePath = join(__dirname, '../../../README.md');

  it('documents required deployment and incident response sections', () => {
    const runbook = readFileSync(runbookPath, 'utf8');

    const requiredSections = [
      '## 2) Pre-Deployment Checklist',
      '## 3) Deployment Procedure',
      '## 4) Startup Readiness Checks',
      '## 5) Rollback Procedure',
      '## 6) Incident Response',
      '## 7) Baseline SLOs and Metrics',
      '## 10) Evidence Automation',
    ];

    for (const section of requiredSections) {
      expect(runbook).toContain(section);
    }
  });

  it('captures baseline SLO targets in the runbook', () => {
    const runbook = readFileSync(runbookPath, 'utf8');

    const requiredSlos = [
      'API availability: `99.9%` monthly',
      'Web availability: `99.9%` monthly',
      'P95 API latency (core CRUD): `< 500ms`',
      'P99 API latency (core CRUD): `< 1200ms`',
      'Queue job success rate (AI/import/export jobs): `>= 99%`',
      'Critical webhook delivery success (with retries): `>= 99%`',
      'RPO: `< 15 minutes`',
      'RTO: `< 60 minutes`',
    ];

    for (const target of requiredSlos) {
      expect(runbook).toContain(target);
    }
  });

  it('keeps runbook and parity artifact linked from README', () => {
    const parityArtifact = readFileSync(parityArtifactPath, 'utf8');
    const readme = readFileSync(readmePath, 'utf8');

    expect(parityArtifact).toContain('`docs/DEPLOYMENT_RUNBOOK.md`');
    expect(readme).toContain('`docs/DEPLOYMENT_RUNBOOK.md`');
    expect(readme).toContain('`docs/parity/ops-runbook-slos.md`');
    expect(readme).toContain('ops:drill:backup-restore');
    expect(readme).toContain('ops:evidence:capture');
  });

  it('documents drill and provider evidence commands in runbook', () => {
    const runbook = readFileSync(runbookPath, 'utf8');

    expect(runbook).toContain('pnpm ops:drill:backup-restore');
    expect(runbook).toContain('pnpm ops:evidence:capture');
    expect(runbook).toContain('.github/workflows/ops-readiness-evidence.yml');
  });
});

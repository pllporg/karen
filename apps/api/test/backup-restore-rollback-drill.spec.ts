import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';

describe('backup/restore + rollback drill script', () => {
  it('writes deterministic evidence artifacts in dry-run mode', () => {
    const outDir = mkdtempSync(join(tmpdir(), 'kar95-drill-'));
    const evidenceIndex = join(outDir, 'rc009-drill-evidence.json');

    const result = spawnSync(
      'node',
      [
        'tools/ops/backup_restore_rollback_drill.mjs',
        '--dry-run',
        '--database-url',
        'postgresql://postgres:postgres@localhost:5432/karen?schema=public',
        '--out-dir',
        outDir,
        '--evidence-index-file',
        evidenceIndex,
      ],
      {
        cwd: join(__dirname, '../../..'),
        encoding: 'utf8',
      },
    );

    expect(result.status).toBe(0);
    expect(existsSync(evidenceIndex)).toBe(true);

    const indexEvidence = JSON.parse(readFileSync(evidenceIndex, 'utf8')) as {
      status: string;
      requirementId: string;
      drillArtifacts: { backupRestore: string; migrationRollback: string };
    };
    expect(indexEvidence.status).toBe('passed');
    expect(indexEvidence.requirementId).toBe('REQ-RC-009');

    const backupEvidence = JSON.parse(readFileSync(indexEvidence.drillArtifacts.backupRestore, 'utf8')) as {
      status: string;
      drillType: string;
      checkpoints: Array<{ checkpoint: string; status: string }>;
    };

    const rollbackEvidence = JSON.parse(readFileSync(indexEvidence.drillArtifacts.migrationRollback, 'utf8')) as {
      status: string;
      drillType: string;
      checkpoints: Array<{ checkpoint: string; status: string }>;
    };

    expect(backupEvidence.status).toBe('passed');
    expect(backupEvidence.drillType).toBe('backup_restore');
    expect(backupEvidence.checkpoints.some((item) => item.checkpoint === 'restore-backup' && item.status === 'passed')).toBe(
      true,
    );

    expect(rollbackEvidence.status).toBe('passed');
    expect(rollbackEvidence.drillType).toBe('migration_rollback');
    expect(
      rollbackEvidence.checkpoints.some(
        (item) => item.checkpoint === 'verify-schema-consistency-after-rollback' && item.status === 'passed',
      ),
    ).toBe(true);

    rmSync(outDir, { recursive: true, force: true });
  });

  it('fails fast for non-local database hosts without override', () => {
    const result = spawnSync(
      'node',
      [
        'tools/ops/backup_restore_rollback_drill.mjs',
        '--dry-run',
        '--database-url',
        'postgresql://postgres:postgres@db.production.example:5432/karen?schema=public',
      ],
      {
        cwd: join(__dirname, '../../..'),
        encoding: 'utf8',
      },
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Refusing to run drill against non-local database host');
  });
});

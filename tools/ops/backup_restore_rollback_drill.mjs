#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const DOCKER_POSTGRES_SERVICE = 'postgres';
const SAFE_NON_PROD_HOSTS = new Set(['localhost', '127.0.0.1']);

const args = parseArgs({
  allowPositionals: true,
  options: {
    'database-url': { type: 'string' },
    'admin-database': { type: 'string', default: 'postgres' },
    'out-dir': { type: 'string', default: 'artifacts/ops' },
    'backup-file': { type: 'string' },
    'backup-summary-file': { type: 'string' },
    'rollback-summary-file': { type: 'string' },
    'evidence-index-file': { type: 'string' },
    'keep-temp-db': { type: 'boolean', default: false },
    'allow-nonlocal-db': { type: 'boolean', default: false },
    'dry-run': { type: 'boolean', default: false },
  },
});

const startedMs = Date.now();
const startedAtIso = new Date(startedMs).toISOString();
const timestamp = new Date(startedMs).toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const outDir = resolve(String(args.values['out-dir']));
mkdirSync(outDir, { recursive: true });

const backupSummaryFile = resolve(String(args.values['backup-summary-file'] || `${outDir}/backup-restore-drill-${timestamp}.json`));
const rollbackSummaryFile = resolve(
  String(args.values['rollback-summary-file'] || `${outDir}/migration-rollback-drill-${timestamp}.json`),
);
const evidenceIndexFile = resolve(String(args.values['evidence-index-file'] || `${outDir}/rc009-drill-evidence-${timestamp}.json`));

mkdirSync(dirname(backupSummaryFile), { recursive: true });
mkdirSync(dirname(rollbackSummaryFile), { recursive: true });
mkdirSync(dirname(evidenceIndexFile), { recursive: true });

const databaseUrl = String(args.values['database-url'] || process.env.DATABASE_URL || '').trim();
if (!databaseUrl) {
  console.error('DATABASE_URL is required. Provide --database-url or set DATABASE_URL.');
  process.exit(1);
}

const sourceUrl = new URL(databaseUrl);
const sourceDbName = decodeURIComponent(sourceUrl.pathname.replace(/^\//, ''));
if (!sourceDbName) {
  console.error('DATABASE_URL must include a database name in the path.');
  process.exit(1);
}

const allowNonLocalDb = Boolean(args.values['allow-nonlocal-db']);
if (!allowNonLocalDb && !SAFE_NON_PROD_HOSTS.has(sourceUrl.hostname)) {
  console.error(
    `Refusing to run drill against non-local database host "${sourceUrl.hostname}" without --allow-nonlocal-db.`,
  );
  process.exit(1);
}

const toolDbUrl = normalizeToolDatabaseUrl(databaseUrl);
const adminDbName = String(args.values['admin-database'] || 'postgres').replace(/^\/+/, '');
const adminUrl = new URL(toolDbUrl);
adminUrl.pathname = `/${adminDbName}`;
adminUrl.searchParams.delete('schema');

const backupFile = resolve(String(args.values['backup-file'] || `${outDir}/db-backup-${timestamp}.dump`));
mkdirSync(dirname(backupFile), { recursive: true });

const tempDbName = buildTempDatabaseName(sourceDbName, timestamp);
const tempToolUrl = new URL(toolDbUrl);
tempToolUrl.pathname = `/${tempDbName}`;
tempToolUrl.searchParams.delete('schema');

const prismaTempUrl = new URL(databaseUrl);
prismaTempUrl.pathname = `/${tempDbName}`;

const commandLog = [];
const keepTempDb = Boolean(args.values['keep-temp-db']);
const dryRun = Boolean(args.values['dry-run']);

const backupEvidence = {
  drillType: 'backup_restore',
  requirementId: 'REQ-RC-009',
  linearIssue: 'KAR-95',
  generatedAt: startedAtIso,
  status: 'in_progress',
  executionMode: dryRun ? 'dry-run' : null,
  sourceDatabase: redactDatabaseUrl(databaseUrl),
  tempDatabaseName: tempDbName,
  backupFile,
  durationMs: 0,
  checkpoints: [],
  steps: {
    backupCreated: false,
    restoreApplied: false,
  },
  metrics: {
    migrationRowsSource: null,
    migrationRowsRestored: null,
  },
  commandLog,
};

const rollbackEvidence = {
  drillType: 'migration_rollback',
  requirementId: 'REQ-RC-009',
  linearIssue: 'KAR-95',
  generatedAt: startedAtIso,
  status: 'in_progress',
  executionMode: dryRun ? 'dry-run' : null,
  sourceDatabase: redactDatabaseUrl(databaseUrl),
  tempDatabaseName: tempDbName,
  durationMs: 0,
  checkpoints: [],
  steps: {
    faultInjected: false,
    rollbackRestoreApplied: false,
    prismaDeployValidated: false,
    schemaConsistencyVerified: false,
  },
  metrics: {
    migrationRowsBeforeFault: null,
    migrationRowsAfterRollbackRestore: null,
  },
  commandLog,
};

const indexEvidence = {
  requirementId: 'REQ-RC-009',
  linearIssue: 'KAR-95',
  generatedAt: startedAtIso,
  status: 'in_progress',
  durationMs: 0,
  drillArtifacts: {
    backupRestore: backupSummaryFile,
    migrationRollback: rollbackSummaryFile,
  },
  machineReadableEvidence: {
    backupDump: backupFile,
    backupRestoreSummary: backupSummaryFile,
    migrationRollbackSummary: rollbackSummaryFile,
    providerStatus: resolve(`${outDir}/provider-status-evidence.json`),
  },
};

let runner = null;

try {
  runner = dryRun
    ? createDryRunRunner({ commandLog, sourceDbName, backupFile })
    : createRunner({
        sourceUrl,
        sourceDbName,
        adminDbName,
        backupFile,
        tempDbName,
        toolDbUrl,
        tempToolUrl: tempToolUrl.toString(),
        adminUrl: adminUrl.toString(),
        commandLog,
      });

  backupEvidence.executionMode = runner.mode;
  rollbackEvidence.executionMode = runner.mode;

  ensureCheckpoint(backupEvidence, 'collect-source-migration-count', () => {
    backupEvidence.metrics.migrationRowsSource = runner.queryScalarInt(sourceDbName, 'SELECT count(*) FROM "_prisma_migrations";');
  });

  ensureCheckpoint(backupEvidence, 'create-backup', () => {
    runner.dumpBackup();
    backupEvidence.steps.backupCreated = true;
  });

  ensureCheckpoint(backupEvidence, 'create-temp-db', () => {
    runner.createDatabase(tempDbName);
  });

  ensureCheckpoint(backupEvidence, 'restore-backup', () => {
    runner.restoreBackup(tempDbName);
    backupEvidence.steps.restoreApplied = true;
  });

  ensureCheckpoint(backupEvidence, 'verify-restored-migration-count', () => {
    backupEvidence.metrics.migrationRowsRestored = runner.queryScalarInt(tempDbName, 'SELECT count(*) FROM "_prisma_migrations";');
    if (backupEvidence.metrics.migrationRowsRestored !== backupEvidence.metrics.migrationRowsSource) {
      throw new Error('Restored migration row count does not match source migration row count.');
    }
  });

  ensureCheckpoint(rollbackEvidence, 'capture-pre-fault-migration-count', () => {
    rollbackEvidence.metrics.migrationRowsBeforeFault = runner.queryScalarInt(tempDbName, 'SELECT count(*) FROM "_prisma_migrations";');
  });

  ensureCheckpoint(rollbackEvidence, 'inject-failed-migration-fault', () => {
    runner.runSql(tempDbName, 'DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;');
    rollbackEvidence.steps.faultInjected = true;
  });

  ensureCheckpoint(rollbackEvidence, 'restore-backup-after-fault', () => {
    runner.restoreBackup(tempDbName);
    rollbackEvidence.steps.rollbackRestoreApplied = true;
  });

  ensureCheckpoint(rollbackEvidence, 'verify-schema-consistency-after-rollback', () => {
    rollbackEvidence.metrics.migrationRowsAfterRollbackRestore = runner.queryScalarInt(
      tempDbName,
      'SELECT count(*) FROM "_prisma_migrations";',
    );
    if (rollbackEvidence.metrics.migrationRowsAfterRollbackRestore !== rollbackEvidence.metrics.migrationRowsBeforeFault) {
      throw new Error('Rollback restore did not recover expected migration metadata row count.');
    }
    rollbackEvidence.steps.schemaConsistencyVerified = true;
  });

  ensureCheckpoint(rollbackEvidence, 'validate-app-deploy-path', () => {
    if (dryRun) {
      commandLog.push({
        command: 'dry-run pnpm --filter api prisma:deploy',
        startedAt: new Date().toISOString(),
        durationMs: 1,
        exitCode: 0,
        stdout: 'dry-run skipped prisma deploy',
        stderr: '',
      });
    } else {
      run(
        'pnpm',
        ['--filter', 'api', 'prisma:deploy'],
        commandLog,
        {
          env: {
            ...process.env,
            DATABASE_URL: prismaTempUrl.toString(),
          },
        },
      );
    }
    rollbackEvidence.steps.prismaDeployValidated = true;
  });

  backupEvidence.status = 'passed';
  rollbackEvidence.status = 'passed';
  indexEvidence.status = 'passed';
} catch (error) {
  backupEvidence.status = backupEvidence.status === 'passed' ? 'passed' : 'failed';
  rollbackEvidence.status = rollbackEvidence.status === 'passed' ? 'passed' : 'failed';
  indexEvidence.status = 'failed';
  const message = error instanceof Error ? error.message : String(error);
  backupEvidence.error = message;
  rollbackEvidence.error = message;
  indexEvidence.error = message;
  console.error(`Backup/restore + rollback drill failed. Evidence written to ${evidenceIndexFile}`);
  process.exitCode = 1;
} finally {
  if (!keepTempDb && runner) {
    try {
      runner.dropDatabase(tempDbName);
    } catch (error) {
      const warning = error instanceof Error ? error.message : String(error);
      backupEvidence.cleanupWarning = warning;
      rollbackEvidence.cleanupWarning = warning;
      indexEvidence.cleanupWarning = warning;
    }
  }

  const completedAtIso = new Date().toISOString();
  backupEvidence.completedAt = completedAtIso;
  rollbackEvidence.completedAt = completedAtIso;
  indexEvidence.completedAt = completedAtIso;

  backupEvidence.durationMs = Math.max(0, Date.now() - startedMs);
  rollbackEvidence.durationMs = backupEvidence.durationMs;
  indexEvidence.durationMs = backupEvidence.durationMs;

  writeJson(backupSummaryFile, backupEvidence);
  writeJson(rollbackSummaryFile, rollbackEvidence);
  writeJson(evidenceIndexFile, indexEvidence);
}

if (indexEvidence.status === 'passed') {
  console.log(`Backup/restore + rollback drills passed (${runner.mode} mode). Evidence index: ${evidenceIndexFile}`);
}

function ensureCheckpoint(evidence, checkpointName, fn) {
  const started = Date.now();
  try {
    fn();
    evidence.checkpoints.push({
      checkpoint: checkpointName,
      status: 'passed',
      durationMs: Date.now() - started,
      completedAt: new Date().toISOString(),
    });
  } catch (error) {
    evidence.checkpoints.push({
      checkpoint: checkpointName,
      status: 'failed',
      durationMs: Date.now() - started,
      completedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

function createDryRunRunner(input) {
  const { commandLog, sourceDbName, backupFile } = input;
  const counters = new Map([
    [sourceDbName, 7],
  ]);

  const pushLog = (command, stdout = 'ok') => {
    commandLog.push({
      command,
      startedAt: new Date().toISOString(),
      durationMs: 1,
      exitCode: 0,
      stdout,
      stderr: '',
    });
  };

  return {
    mode: 'dry-run',
    dumpBackup() {
      writeFileSync(backupFile, 'dry-run-backup');
      pushLog('dry-run pg_dump --format=custom');
    },
    restoreBackup(dbName) {
      const sourceRows = counters.get(sourceDbName) ?? 0;
      counters.set(dbName, sourceRows);
      pushLog(`dry-run pg_restore --dbname ${dbName}`);
    },
    createDatabase(dbName) {
      counters.set(dbName, 0);
      pushLog(`dry-run create database ${dbName}`);
    },
    dropDatabase(dbName) {
      counters.delete(dbName);
      pushLog(`dry-run drop database ${dbName}`);
    },
    runSql(dbName, sql) {
      if (sql.includes('DROP TABLE IF EXISTS "_prisma_migrations"')) {
        counters.set(dbName, 0);
      }
      pushLog(`dry-run sql ${dbName} ${sql}`);
    },
    queryScalarInt(dbName) {
      pushLog(`dry-run query migrations ${dbName}`);
      return counters.get(dbName) ?? 0;
    },
  };
}

function createRunner(input) {
  const localTools = ['pg_dump', 'pg_restore', 'psql'].every((binary) => hasBinary(binary));
  if (localTools) {
    return createLocalRunner(input);
  }

  if (!hasBinary('docker') || !isDockerComposePostgresRunning()) {
    throw new Error(
      'PostgreSQL client tools (pg_dump/pg_restore/psql) are not available and docker-compose postgres fallback is not running.',
    );
  }

  return createDockerRunner(input);
}

function createLocalRunner(input) {
  const { backupFile, tempToolUrl, adminUrl, commandLog, toolDbUrl } = input;

  return {
    mode: 'local',
    dumpBackup() {
      run('pg_dump', ['--format=custom', '--file', backupFile, toolDbUrl], commandLog);
    },
    restoreBackup(dbName) {
      const dbUrl = new URL(tempToolUrl);
      dbUrl.pathname = `/${dbName}`;
      run('pg_restore', ['--clean', '--if-exists', '--no-owner', '--no-privileges', '--dbname', dbUrl.toString(), backupFile], commandLog);
    },
    createDatabase(dbName) {
      run('psql', [adminUrl, '-v', 'ON_ERROR_STOP=1', '-c', `CREATE DATABASE "${dbName}";`], commandLog);
    },
    dropDatabase(dbName) {
      run(
        'psql',
        [
          adminUrl,
          '-v',
          'ON_ERROR_STOP=1',
          '-c',
          `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName.replace(/'/g, "''")}' AND pid <> pg_backend_pid();`,
        ],
        commandLog,
      );
      run('psql', [adminUrl, '-v', 'ON_ERROR_STOP=1', '-c', `DROP DATABASE IF EXISTS "${dbName}";`], commandLog);
    },
    runSql(dbName, sql) {
      const dbUrl = new URL(tempToolUrl);
      dbUrl.pathname = `/${dbName}`;
      run('psql', [dbUrl.toString(), '-v', 'ON_ERROR_STOP=1', '-c', sql], commandLog);
    },
    queryScalarInt(dbName, sql) {
      const dbUrl = new URL(tempToolUrl);
      dbUrl.pathname = `/${dbName}`;
      const output = run('psql', [dbUrl.toString(), '-v', 'ON_ERROR_STOP=1', '-t', '-A', '-c', sql], commandLog).trim();
      const value = Number.parseInt(output, 10);
      if (!Number.isFinite(value)) {
        throw new Error(`Expected integer query result but received "${output}" for SQL: ${sql}`);
      }
      return value;
    },
  };
}

function createDockerRunner(input) {
  const { sourceUrl, sourceDbName, adminDbName, backupFile, commandLog } = input;
  const pgUser = decodeURIComponent(sourceUrl.username || 'postgres');
  const pgPassword = decodeURIComponent(sourceUrl.password || '');
  const containerBackupPath = `/tmp/${buildContainerBackupName(sourceDbName)}.dump`;

  const dockerRun = (tool, toolArgs) => {
    const dockerArgs = ['compose', 'exec', '-T', DOCKER_POSTGRES_SERVICE];
    if (pgPassword) {
      dockerArgs.push('env', `PGPASSWORD=${pgPassword}`);
    }
    dockerArgs.push(tool, ...toolArgs);
    return run('docker', dockerArgs, commandLog);
  };

  return {
    mode: 'docker-compose',
    dumpBackup() {
      dockerRun('pg_dump', ['-U', pgUser, '-d', sourceDbName, '-Fc', '-f', containerBackupPath]);
      run('docker', ['compose', 'cp', `${DOCKER_POSTGRES_SERVICE}:${containerBackupPath}`, backupFile], commandLog);
    },
    restoreBackup(dbName) {
      run('docker', ['compose', 'cp', backupFile, `${DOCKER_POSTGRES_SERVICE}:${containerBackupPath}`], commandLog);
      dockerRun('pg_restore', [
        '--clean',
        '--if-exists',
        '--no-owner',
        '--no-privileges',
        '-U',
        pgUser,
        '-d',
        dbName,
        containerBackupPath,
      ]);
    },
    createDatabase(dbName) {
      dockerRun('psql', ['-U', pgUser, '-d', adminDbName, '-v', 'ON_ERROR_STOP=1', '-c', `CREATE DATABASE "${dbName}";`]);
    },
    dropDatabase(dbName) {
      dockerRun('psql', [
        '-U',
        pgUser,
        '-d',
        adminDbName,
        '-v',
        'ON_ERROR_STOP=1',
        '-c',
        `SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${dbName.replace(/'/g, "''")}' AND pid <> pg_backend_pid();`,
      ]);
      dockerRun('psql', ['-U', pgUser, '-d', adminDbName, '-v', 'ON_ERROR_STOP=1', '-c', `DROP DATABASE IF EXISTS "${dbName}";`]);
    },
    runSql(dbName, sql) {
      dockerRun('psql', ['-U', pgUser, '-d', dbName, '-v', 'ON_ERROR_STOP=1', '-c', sql]);
    },
    queryScalarInt(dbName, sql) {
      const output = dockerRun('psql', ['-U', pgUser, '-d', dbName, '-v', 'ON_ERROR_STOP=1', '-t', '-A', '-c', sql]).trim();
      const value = Number.parseInt(output, 10);
      if (!Number.isFinite(value)) {
        throw new Error(`Expected integer query result but received "${output}" for SQL: ${sql}`);
      }
      return value;
    },
  };
}

function run(cmd, cmdArgs, log, options = {}) {
  const started = Date.now();
  const result = spawnSync(cmd, cmdArgs, {
    encoding: 'utf8',
    env: options.env || process.env,
    cwd: process.cwd(),
  });

  log.push({
    command: `${cmd} ${cmdArgs.join(' ')}`,
    startedAt: new Date(started).toISOString(),
    durationMs: Date.now() - started,
    exitCode: result.status,
    stdout: trimOutput(result.stdout),
    stderr: trimOutput(result.stderr),
  });

  if (result.error) {
    throw result.error;
  }
  if (result.status !== 0) {
    throw new Error(`${cmd} exited with code ${result.status}: ${trimOutput(result.stderr) || 'no stderr'}`);
  }

  return result.stdout || '';
}

function hasBinary(name) {
  const probe = spawnSync(name, ['--version'], { encoding: 'utf8' });
  return !probe.error && probe.status === 0;
}

function isDockerComposePostgresRunning() {
  const probe = spawnSync('docker', ['compose', 'ps', '--services', '--status', 'running'], {
    encoding: 'utf8',
    cwd: process.cwd(),
  });
  if (probe.error || probe.status !== 0) {
    return false;
  }

  const services = String(probe.stdout || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  return services.includes(DOCKER_POSTGRES_SERVICE);
}

function ensureBinary(name) {
  if (!hasBinary(name)) {
    throw new Error(`Required binary "${name}" not found. Install ${name} and ensure it is in PATH.`);
  }
}

function normalizeToolDatabaseUrl(input) {
  const url = new URL(input);
  url.searchParams.delete('schema');
  return url.toString();
}

function redactDatabaseUrl(input) {
  const url = new URL(input);
  if (url.password) {
    url.password = '***';
  }
  return url.toString();
}

function buildTempDatabaseName(baseName, timestampRaw) {
  const safeBase =
    String(baseName || 'db')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 24) || 'db';
  const suffix = timestampRaw.replace(/[^0-9A-Za-z]/g, '').slice(-10);
  return `${safeBase}_drill_${suffix}`.slice(0, 63);
}

function buildContainerBackupName(baseName) {
  return (
    String(baseName || 'database')
      .replace(/[^a-zA-Z0-9_]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '')
      .slice(0, 24) || 'database'
  );
}

function trimOutput(output) {
  const text = String(output || '').trim();
  if (text.length <= 4000) {
    return text;
  }
  return `${text.slice(0, 4000)}...<truncated>`;
}

function writeJson(path, payload) {
  writeFileSync(path, JSON.stringify(payload, null, 2));
}

#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const DOCKER_POSTGRES_SERVICE = 'postgres';

const args = parseArgs({
  allowPositionals: true,
  options: {
    'database-url': { type: 'string' },
    'admin-database': { type: 'string', default: 'postgres' },
    'out-dir': { type: 'string', default: 'artifacts/ops' },
    'backup-file': { type: 'string' },
    'summary-file': { type: 'string' },
    'keep-temp-db': { type: 'boolean', default: false },
  },
});

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

const toolDbUrl = normalizeToolDatabaseUrl(databaseUrl);
const adminDbName = String(args.values['admin-database'] || 'postgres').replace(/^\/+/, '');
const adminUrl = new URL(toolDbUrl);
adminUrl.pathname = `/${adminDbName}`;
adminUrl.searchParams.delete('schema');

const timestamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const outDir = resolve(String(args.values['out-dir']));
mkdirSync(outDir, { recursive: true });

const backupFile = resolve(String(args.values['backup-file'] || `${outDir}/db-backup-${timestamp}.dump`));
const summaryFile = resolve(String(args.values['summary-file'] || `${outDir}/backup-restore-drill-${timestamp}.json`));
mkdirSync(dirname(backupFile), { recursive: true });
mkdirSync(dirname(summaryFile), { recursive: true });

const tempDbName = buildTempDatabaseName(sourceDbName, timestamp);
const tempToolUrl = new URL(toolDbUrl);
tempToolUrl.pathname = `/${tempDbName}`;
tempToolUrl.searchParams.delete('schema');

const prismaTempUrl = new URL(databaseUrl);
prismaTempUrl.pathname = `/${tempDbName}`;

const startedAt = new Date().toISOString();
const commandLog = [];
const keepTempDb = Boolean(args.values['keep-temp-db']);

const evidence = {
  generatedAt: startedAt,
  status: 'in_progress',
  executionMode: null,
  sourceDatabase: redactDatabaseUrl(databaseUrl),
  tempDatabaseName: tempDbName,
  backupFile,
  steps: {
    backupCreated: false,
    restoreApplied: false,
    rollbackRestoreApplied: false,
    prismaDeployValidated: false,
  },
  metrics: {
    migrationRowsSource: null,
    migrationRowsRestored: null,
    migrationRowsAfterRollbackRestore: null,
  },
  commandLog,
};

let runner = null;

try {
  runner = createRunner({
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
  evidence.executionMode = runner.mode;

  ensureBinary('pnpm');

  evidence.metrics.migrationRowsSource = runner.queryScalarInt(sourceDbName, 'SELECT count(*) FROM "_prisma_migrations";');

  runner.dumpBackup();
  evidence.steps.backupCreated = true;

  runner.createDatabase(tempDbName);
  runner.restoreBackup(tempDbName);
  evidence.steps.restoreApplied = true;

  evidence.metrics.migrationRowsRestored = runner.queryScalarInt(
    tempDbName,
    'SELECT count(*) FROM "_prisma_migrations";',
  );

  runner.runSql(tempDbName, 'DROP TABLE IF EXISTS "_prisma_migrations" CASCADE;');
  runner.restoreBackup(tempDbName);
  evidence.steps.rollbackRestoreApplied = true;

  evidence.metrics.migrationRowsAfterRollbackRestore = runner.queryScalarInt(
    tempDbName,
    'SELECT count(*) FROM "_prisma_migrations";',
  );

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
  evidence.steps.prismaDeployValidated = true;

  evidence.status = 'passed';
  evidence.completedAt = new Date().toISOString();
} catch (error) {
  evidence.status = 'failed';
  evidence.completedAt = new Date().toISOString();
  evidence.error = error instanceof Error ? error.message : String(error);
  console.error(`Backup/restore drill failed. Evidence written to ${summaryFile}`);
  process.exitCode = 1;
} finally {
  if (!keepTempDb && runner) {
    try {
      runner.dropDatabase(tempDbName);
    } catch (error) {
      if (!evidence.cleanupWarning) {
        evidence.cleanupWarning = error instanceof Error ? error.message : String(error);
      }
    }
  }

  writeJson(summaryFile, evidence);
}

if (evidence.status === 'passed') {
  console.log(`Backup/restore rollback drill passed (${runner.mode} mode). Evidence: ${summaryFile}`);
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
    restoreBackup() {
      run(
        'pg_restore',
        ['--clean', '--if-exists', '--no-owner', '--no-privileges', '--dbname', tempToolUrl, backupFile],
        commandLog,
      );
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

  const dockerRun = (tool, args) => {
    const dockerArgs = ['compose', 'exec', '-T', DOCKER_POSTGRES_SERVICE];
    if (pgPassword) {
      dockerArgs.push('env', `PGPASSWORD=${pgPassword}`);
    }
    dockerArgs.push(tool, ...args);
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

function run(cmd, args, log, options = {}) {
  const started = Date.now();
  const result = spawnSync(cmd, args, {
    encoding: 'utf8',
    env: options.env || process.env,
    cwd: process.cwd(),
  });

  log.push({
    command: `${cmd} ${args.join(' ')}`,
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
  const safeBase = String(baseName || 'db')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24) || 'db';
  const suffix = timestampRaw.replace(/[^0-9A-Za-z]/g, '').slice(-10);
  return `${safeBase}_drill_${suffix}`.slice(0, 63);
}

function buildContainerBackupName(baseName) {
  return String(baseName || 'database')
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24) || 'database';
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

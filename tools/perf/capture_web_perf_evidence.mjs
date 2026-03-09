#!/usr/bin/env node

import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const cliArgs = process.argv.slice(2);
const normalizedCliArgs = cliArgs[0] === '--' ? cliArgs.slice(1) : cliArgs;

const args = parseArgs({
  args: normalizedCliArgs,
  allowPositionals: true,
  options: {
    'out-dir': { type: 'string', default: 'artifacts/perf' },
    'json-out': { type: 'string' },
    'md-out': { type: 'string' },
    'stability-runs': { type: 'string', default: '3' },
    'stability-command': { type: 'string', default: 'pnpm --filter web test:stability' },
    'build-command': { type: 'string', default: 'pnpm --filter web build' },
    'max-largest-chunk-kb': { type: 'string', default: '512' },
    'max-total-js-kb': { type: 'string', default: '2500' },
  },
});

const startedAt = new Date().toISOString();
const startedAtMs = Date.now();

const outDir = resolve(String(args.values['out-dir'] || 'artifacts/perf'));
const jsonOutPath = resolve(String(args.values['json-out'] || `${outDir}/web-perf-evidence.json`));
const mdOutPath = resolve(String(args.values['md-out'] || `${outDir}/web-perf-evidence.md`));
const stabilityRuns = parsePositiveInt(args.values['stability-runs'], '--stability-runs');
const maxLargestChunkKb = parsePositiveInt(args.values['max-largest-chunk-kb'], '--max-largest-chunk-kb');
const maxTotalJsKb = parsePositiveInt(args.values['max-total-js-kb'], '--max-total-js-kb');
const stabilityCommand = String(args.values['stability-command']);
const buildCommand = String(args.values['build-command']);
const nextFontGoogleMockedResponses = resolve(
  String(process.env.NEXT_FONT_GOOGLE_MOCKED_RESPONSES || 'tools/perf/next-font-google-mocked-responses.cjs'),
);

const evidence = {
  requirementId: 'PRD-07-PERF-B',
  startedAt,
  completedAt: null,
  outDir,
  commands: {
    stabilityCommand,
    buildCommand,
  },
  thresholds: {
    maxLargestChunkKb,
    maxTotalJsKb,
  },
  runtimeStability: {
    requestedRuns: stabilityRuns,
    completedRuns: 0,
    runs: [],
    allPassed: false,
  },
  build: {
    status: 'skipped',
    durationMs: 0,
    exitCode: null,
    stdoutTail: '',
    stderrTail: '',
  },
  bundleMetrics: {
    chunkCount: 0,
    totalJsBytes: 0,
    largestChunkBytes: 0,
    largestChunkPath: null,
    topChunks: [],
    manifestPath: null,
    missingChunkFiles: 0,
  },
  checks: {
    stability: 'fail',
    build: 'fail',
    largestChunk: 'fail',
    totalJs: 'fail',
  },
  status: 'failed',
  durationMs: 0,
};

for (let runIndex = 1; runIndex <= stabilityRuns; runIndex += 1) {
  const result = runShellCommand(stabilityCommand);
  evidence.runtimeStability.runs.push({
    run: runIndex,
    status: result.ok ? 'passed' : 'failed',
    durationMs: result.durationMs,
    exitCode: result.exitCode,
    stdoutTail: result.stdoutTail,
    stderrTail: result.stderrTail,
  });

  evidence.runtimeStability.completedRuns = runIndex;

  if (!result.ok) {
    break;
  }
}

evidence.runtimeStability.allPassed =
  evidence.runtimeStability.completedRuns === stabilityRuns &&
  evidence.runtimeStability.runs.every((run) => run.status === 'passed');
evidence.checks.stability = evidence.runtimeStability.allPassed ? 'pass' : 'fail';

if (evidence.runtimeStability.allPassed) {
  const buildResult = runShellCommand(buildCommand, {
    NEXT_FONT_GOOGLE_MOCKED_RESPONSES: nextFontGoogleMockedResponses,
  });
  evidence.build = {
    status: buildResult.ok ? 'passed' : 'failed',
    durationMs: buildResult.durationMs,
    exitCode: buildResult.exitCode,
    stdoutTail: buildResult.stdoutTail,
    stderrTail: buildResult.stderrTail,
  };
  evidence.checks.build = buildResult.ok ? 'pass' : 'fail';

  if (buildResult.ok) {
    const metrics = collectBundleMetrics(resolve('apps/web'));
    evidence.bundleMetrics = metrics;
    evidence.checks.largestChunk = kbFromBytes(metrics.largestChunkBytes) <= maxLargestChunkKb ? 'pass' : 'fail';
    evidence.checks.totalJs = kbFromBytes(metrics.totalJsBytes) <= maxTotalJsKb ? 'pass' : 'fail';
  }
}

if (evidence.checks.build === 'fail') {
  evidence.checks.largestChunk = 'fail';
  evidence.checks.totalJs = 'fail';
}

evidence.completedAt = new Date().toISOString();
evidence.durationMs = Math.max(0, Date.now() - startedAtMs);

evidence.status =
  evidence.checks.stability === 'pass' &&
  evidence.checks.build === 'pass' &&
  evidence.checks.largestChunk === 'pass' &&
  evidence.checks.totalJs === 'pass'
    ? 'passed'
    : 'failed';

writeOutput(jsonOutPath, JSON.stringify(evidence, null, 2));
writeOutput(mdOutPath, renderMarkdown(evidence));

console.log(`Web perf evidence JSON -> ${jsonOutPath}`);
console.log(`Web perf evidence Markdown -> ${mdOutPath}`);
console.log(`Status: ${evidence.status}`);

if (evidence.status !== 'passed') {
  process.exitCode = 1;
}

function runShellCommand(command, envOverrides = {}) {
  const runStartedMs = Date.now();
  const result = spawnSync(command, {
    shell: true,
    cwd: resolve('.'),
    env: {
      ...process.env,
      ...envOverrides,
    },
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 12,
  });

  const durationMs = Math.max(0, Date.now() - runStartedMs);
  const errorMessage = result.error ? String(result.error.message || result.error) : '';
  const exitCode = typeof result.status === 'number' ? result.status : 1;

  return {
    ok: !result.error && exitCode === 0,
    exitCode,
    durationMs,
    stdoutTail: clipTail(result.stdout),
    stderrTail: clipTail(errorMessage ? `${errorMessage}\n${result.stderr || ''}` : result.stderr),
  };
}

function collectBundleMetrics(webAppRoot) {
  const buildDir = resolve(webAppRoot, '.next');
  const manifestPath = resolve(buildDir, 'build-manifest.json');

  if (!existsSync(manifestPath)) {
    return {
      chunkCount: 0,
      totalJsBytes: 0,
      largestChunkBytes: 0,
      largestChunkPath: null,
      topChunks: [],
      manifestPath,
      missingChunkFiles: 0,
    };
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const files = new Set();

  for (const listName of ['polyfillFiles', 'devFiles', 'lowPriorityFiles', 'rootMainFiles']) {
    const list = manifest[listName];
    if (!Array.isArray(list)) {
      continue;
    }
    for (const file of list) {
      if (typeof file === 'string' && file.endsWith('.js')) {
        files.add(file);
      }
    }
  }

  if (manifest.pages && typeof manifest.pages === 'object') {
    for (const pageFiles of Object.values(manifest.pages)) {
      if (!Array.isArray(pageFiles)) {
        continue;
      }
      for (const file of pageFiles) {
        if (typeof file === 'string' && file.endsWith('.js')) {
          files.add(file);
        }
      }
    }
  }

  const chunks = [];
  let missingChunkFiles = 0;

  for (const chunkPath of files) {
    const absolutePath = resolve(buildDir, chunkPath);
    if (!existsSync(absolutePath)) {
      missingChunkFiles += 1;
      continue;
    }

    const bytes = statSync(absolutePath).size;
    chunks.push({
      path: chunkPath,
      bytes,
    });
  }

  chunks.sort((a, b) => b.bytes - a.bytes);
  const totalJsBytes = chunks.reduce((sum, chunk) => sum + chunk.bytes, 0);
  const largestChunk = chunks[0] || { path: null, bytes: 0 };

  return {
    chunkCount: chunks.length,
    totalJsBytes,
    largestChunkBytes: largestChunk.bytes,
    largestChunkPath: largestChunk.path,
    topChunks: chunks.slice(0, 8),
    manifestPath,
    missingChunkFiles,
  };
}

function writeOutput(path, content) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
}

function parsePositiveInt(value, flagName) {
  const parsed = Number.parseInt(String(value || ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid ${flagName} value: ${value}`);
  }
  return parsed;
}

function kbFromBytes(bytes) {
  return Number((bytes / 1024).toFixed(2));
}

function clipTail(value, maxChars = 6000) {
  const text = String(value || '').trim();
  if (!text) {
    return '';
  }
  if (text.length <= maxChars) {
    return text;
  }
  return `...${text.slice(-maxChars)}`;
}

function renderMarkdown(payload) {
  const stabilityRows = payload.runtimeStability.runs.length
    ? payload.runtimeStability.runs
        .map(
          (run) =>
            `| ${run.run} | ${run.status.toUpperCase()} | ${run.exitCode ?? 'n/a'} | ${run.durationMs} |`,
        )
        .join('\n')
    : '| _none_ | _n/a_ | _n/a_ | _n/a_ |';

  const topChunksRows = payload.bundleMetrics.topChunks.length
    ? payload.bundleMetrics.topChunks
        .map((chunk) => `| ${escapeTableCell(chunk.path)} | ${kbFromBytes(chunk.bytes)} | ${chunk.bytes} |`)
        .join('\n')
    : '| _none_ | 0 | 0 |';

  return `# Web Runtime Stability and Perf Evidence\n\n- Requirement: ${payload.requirementId}\n- Started at (UTC): ${payload.startedAt}\n- Completed at (UTC): ${payload.completedAt}\n- Duration (ms): ${payload.durationMs}\n- Status: ${payload.status.toUpperCase()}\n\n## Commands\n\n- Runtime stability command: \`${payload.commands.stabilityCommand}\`\n- Build command: \`${payload.commands.buildCommand}\`\n\n## Runtime stability runs\n\n| Run | Status | Exit code | Duration (ms) |\n| --- | --- | --- | --- |\n${stabilityRows}\n\n## Build\n\n- Status: ${String(payload.build.status).toUpperCase()}\n- Exit code: ${payload.build.exitCode ?? 'n/a'}\n- Duration (ms): ${payload.build.durationMs}\n\n## Bundle metrics\n\n- Manifest path: \`${payload.bundleMetrics.manifestPath || 'n/a'}\`\n- JS chunk count: ${payload.bundleMetrics.chunkCount}\n- Missing chunk files: ${payload.bundleMetrics.missingChunkFiles}\n- Largest JS chunk: ${payload.bundleMetrics.largestChunkPath || 'n/a'} (${kbFromBytes(payload.bundleMetrics.largestChunkBytes)} KB)\n- Total JS bytes: ${payload.bundleMetrics.totalJsBytes} (${kbFromBytes(payload.bundleMetrics.totalJsBytes)} KB)\n\n| Chunk path | KB | Bytes |\n| --- | --- | --- |\n${topChunksRows}\n\n## Guardrail checks\n\n- Runtime stability: ${payload.checks.stability.toUpperCase()}\n- Build: ${payload.checks.build.toUpperCase()}\n- Largest chunk <= ${payload.thresholds.maxLargestChunkKb} KB: ${payload.checks.largestChunk.toUpperCase()}\n- Total JS <= ${payload.thresholds.maxTotalJsKb} KB: ${payload.checks.totalJs.toUpperCase()}\n`;
}

function escapeTableCell(value) {
  return String(value ?? '').replace(/\|/g, '\\|');
}

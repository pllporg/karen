import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('web perf evidence automation guardrails', () => {
  const workflowPath = join(__dirname, '../../../.github/workflows/web-perf-evidence.yml');
  const rootPackagePath = join(__dirname, '../../../package.json');
  const webPackagePath = join(__dirname, '../package.json');
  const scriptPath = join(__dirname, '../../../tools/perf/capture_web_perf_evidence.mjs');

  it('defines a dedicated workflow that runs perf evidence automation and uploads artifacts', () => {
    const workflow = readFileSync(workflowPath, 'utf8');

    expect(workflow).toContain('name: Web Runtime Stability and Perf Evidence');
    expect(workflow).toContain('web-perf-evidence');
    expect(workflow).toContain('pnpm perf:web:evidence');
    expect(workflow).toContain('actions/upload-artifact@v4');
    expect(workflow).toContain('name: web-perf-evidence');
    expect(workflow).toContain('path: artifacts/perf');
  });

  it('keeps root and web scripts wired for runtime stability checks', () => {
    const rootPackage = JSON.parse(readFileSync(rootPackagePath, 'utf8'));
    const webPackage = JSON.parse(readFileSync(webPackagePath, 'utf8'));

    expect(rootPackage.scripts?.['perf:web:evidence']).toContain('tools/perf/capture_web_perf_evidence.mjs');
    expect(rootPackage.scripts?.['perf:web:stability']).toContain('pnpm --filter web test:stability');
    expect(webPackage.scripts?.['test:stability']).toContain('test/runtime-stability.spec.tsx');
  });

  it('captures requirement and threshold guardrail fields in the evidence script', () => {
    const script = readFileSync(scriptPath, 'utf8');

    expect(script).toContain("requirementId: 'PRD-07-PERF-B'");
    expect(script).toContain('maxLargestChunkKb');
    expect(script).toContain('maxTotalJsKb');
    expect(script).toContain('web-perf-evidence.json');
    expect(script).toContain('web-perf-evidence.md');
    expect(script).toContain('next-font-google-mocked-responses.cjs');
  });
});

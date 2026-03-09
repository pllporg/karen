# PRD-07-PERF-B Parity Evidence: Runtime Stability Tests + Perf Evidence Automation

Requirement: `PRD-07-PERF-B` (`KAR-129`)

## Scope

This lane adds deterministic runtime stability checks for web runtime behavior and a repeatable performance evidence export flow.

## Automation Commands

```bash
pnpm perf:web:evidence -- --out-dir artifacts/perf
```

Command behavior:
1. Runs `pnpm --filter web test:stability` for configurable repeated stability cycles (default: 3 runs).
2. Resolves `tools/perf/next-font-google-mocked-responses.cjs` to an absolute repo path and injects it as `NEXT_FONT_GOOGLE_MOCKED_RESPONSES` while running `pnpm --filter web build`.
3. Extracts JS chunk metrics from `apps/web/.next/build-manifest.json`.
4. Writes JSON + Markdown evidence outputs.

## Evidence Outputs

- `artifacts/perf/web-perf-evidence.json`
- `artifacts/perf/web-perf-evidence.md`

Recorded fields include:
1. Start/end timestamps and total duration.
2. Per-run stability status, exit code, and duration.
3. Build status, exit code, and duration.
4. Bundle guardrail metrics (`largestChunk`, `totalJs`) and threshold pass/fail.

## Default Guardrails

- Largest JS chunk: `<= 512 KB`
- Total JS across manifest chunks: `<= 2500 KB`

Thresholds can be overridden with:
- `--max-largest-chunk-kb`
- `--max-total-js-kb`

## CI Enforcement

Workflow: `.github/workflows/web-perf-evidence.yml`

On matching web/perf changes, CI runs perf evidence automation and uploads the `artifacts/perf` bundle as `web-perf-evidence`.

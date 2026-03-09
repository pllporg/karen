## Issue

- Linear Key: `KAR-129`
- Requirement IDs: `PRD-07-PERF-B`

## Branch

- `lin/KAR-129-perf-evidence-automation`

## Commit SHA

- `Pending branch commit at handoff time`

## PR URL

- `Pending operator push/PR creation from branch`

## Linear Evidence Comment

- `https://linear.app/karenap/issue/KAR-129/prd-07-perf-lane-b-runtime-stability-tests-and-perf-evidence#comment-c610074e`
- `https://linear.app/karenap/issue/KAR-129/prd-07-perf-lane-b-runtime-stability-tests-and-perf-evidence#comment-44bb5923`
- Initial Symphony run was blocked by sandbox git restrictions and missing `codex` in runtime `PATH`.
- Validation was rerun successfully after salvaging the workspace into a reviewable branch.

## Files Changed

- `apps/web/package.json`
- `package.json`
- `.github/workflows/web-perf-evidence.yml`
- `apps/web/test/runtime-stability.spec.tsx`
- `apps/web/test/perf-evidence-automation.spec.ts`
- `tools/perf/capture_web_perf_evidence.mjs`
- `tools/perf/next-font-google-mocked-responses.cjs`
- `docs/parity/prd-07-perf-b-runtime-stability-evidence.md`

## Validation Results

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm --filter web test` | `PASS` | 24 test files, 89 tests passed. |
| `pnpm --filter web build` | `PASS` | Build passed with one pre-existing lint warning in `app/auditor/page.tsx`. |
| `pnpm perf:web:evidence -- --out-dir artifacts/perf` | `PASS` | 3 stability runs passed; build passed; chunk guardrails passed. |

## Evidence Artifacts

- `artifacts/perf/web-perf-evidence.json`
- `artifacts/perf/web-perf-evidence.md`
- `artifacts/perf/kar-129-changed-files.txt`
- `artifacts/perf/kar-129-handoff-files.tgz`
- `artifacts/perf/kar-129-full.patch` (portable patch for commit/PR handoff)
- `artifacts/perf/kar-129-apply-instructions.md`

## Known Risks / Follow-ups

1. Web build emits an existing lint warning in `app/auditor/page.tsx` (`react-hooks/exhaustive-deps`) outside this issue scope.
2. Linear should move back to `In Progress` or remain there until a real PR URL exists; prior `In Review` state was premature.

## Ready-to-Merge Decision

- `READY FOR PR CREATION`
- Rationale: implementation and validations now pass in the salvaged Symphony workspace; remaining step is normal branch push/PR creation.

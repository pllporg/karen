# Release Smoke Runner Verification (REQ-RC-014 / KAR-100)

## Scope

- Deliver a single-command release smoke runner under `tools/ops/**`.
- Cover core operator workflows:
  - login
  - matter create
  - document upload
  - invoice create
  - portal message
  - AI job create
- Emit a machine-readable summary artifact for release evidence.
- Document prerequisites and failure interpretation in the deployment runbook.

## Implementation

- Added `tools/ops/run_release_smoke.mjs`.
- Added workspace command: `pnpm ops:release:smoke`.
- Updated deployment runbook with usage, prerequisites, and failure interpretation.

## Artifact Contract

Default artifact path: `artifacts/ops/release-smoke-summary.json`.

The artifact includes:

- `requirementId`, `startedAt`, `completedAt`, `apiBase`
- `healthy`
- `summary` counts (`passed`, `failed`, `skipped`)
- `steps[]` with per-step status and HTTP evidence
- `ids` for created entities (`matterId`, `documentId`, `invoiceId`, `portalMessageId`, `aiJobId`)

## Verification Commands

```bash
pnpm test
pnpm build
pnpm ops:release:smoke -- --api-base http://127.0.0.1:4000 --out artifacts/ops/release-smoke-summary.json
```

If the API is unavailable, the smoke command exits non-zero and writes a failed artifact with runner error context.

# Launch Candidate UAT + Go-Live Signoff Coverage

Requirement: `REQ-RC-011` (`KAR-97`)  
Scope: role-based UAT matrix, acceptance evidence checklist, migration/rollback criteria, and executable runbook flow for release owner + on-call.

## Artifacts

- `docs/DEPLOYMENT_RUNBOOK.md` (Section 11)
- `tools/ops/generate_launch_candidate_signoff.mjs`

## Coverage mapping

- Role-based UAT matrix with pass/fail/waiver states and mandatory evidence links.
- Explicit acceptance evidence checklist covering tests, build, provider readiness, migration rehearsal, and security final sweep.
- Objective rollback criteria tied to incident severity, API error budget breach, provider readiness, tenancy/security, and migration integrity.
- Signoff ownership model requiring engineering + operations approval before go-live.
- Executable artifact generation command for release owner/on-call:

```bash
node tools/ops/generate_launch_candidate_signoff.mjs --out artifacts/ops/launch-candidate-signoff.md
```

## Execution references

Release-candidate gate sequence in runbook:

```bash
pnpm test
pnpm build
pnpm test:provider-live
pnpm test:integrations-live
pnpm ops:drill:backup-restore -- --out-dir artifacts/ops --evidence-index-file artifacts/ops/rc011-drill-evidence.json
pnpm ops:evidence:capture -- --api-base http://127.0.0.1:4000 --out artifacts/ops/provider-status-evidence.json
node tools/ops/generate_launch_candidate_signoff.mjs --out artifacts/ops/launch-candidate-signoff.md
```

The output signoff package is intended to be attached to Linear (`KAR-97`) and release records as final go-live evidence.

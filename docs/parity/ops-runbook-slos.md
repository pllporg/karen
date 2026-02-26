# Ops Runbook + SLO Coverage

Requirement: `REQ-OPS-002`, `REQ-RC-009`  
Scope: deployment runbook, rollback + incident procedures, startup readiness guidance, and baseline SLO targets.

## Artifact

- `docs/DEPLOYMENT_RUNBOOK.md`

## Coverage Mapping

- Deploy/rollback/migration procedure:
  - pre-deploy checks
  - migration execution (`pnpm --filter api prisma:deploy`)
  - rollback and data-recovery considerations
- Startup readiness guidance:
  - API health check (`/health`)
  - web-route availability check
  - service dependency validation checklist
  - post-start smoke tests
- Incident response:
  - severity classification (`SEV-1/2/3`)
  - containment, recovery, communication, postmortem flow
- Operational SLOs:
  - availability, latency, queue success rate, webhook reliability
  - RPO/RTO targets
  - key monitoring metrics
- Evidence automation:
  - backup/restore + rollback drill command (`pnpm ops:drill:backup-restore`) with evidence index (`artifacts/ops/rc009-drill-evidence*.json`)
  - provider status evidence capture command (`pnpm ops:evidence:capture`)
  - CI artifact workflow (`.github/workflows/ops-readiness-evidence.yml`)

## README Linkage

- `README.md` includes an "Operations Runbook" section linking to `docs/DEPLOYMENT_RUNBOOK.md`.

## Test Evidence

- `apps/api/test/ops-runbook.spec.ts` verifies:
  - required deploy/readiness/rollback/incident/SLO section presence in `docs/DEPLOYMENT_RUNBOOK.md`
  - required baseline SLO target lines
  - README linkage to runbook + parity artifact
- `apps/api/test/ops-evidence-workflow.spec.ts` verifies:
  - ops evidence workflow exists and uploads artifact bundle
  - top-level ops evidence scripts remain available

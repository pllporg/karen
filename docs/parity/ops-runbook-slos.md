# Ops Runbook + SLO Coverage

Requirement: `REQ-OPS-002`  
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

## README Linkage

- `README.md` includes an "Operations Runbook" section linking to `docs/DEPLOYMENT_RUNBOOK.md`.

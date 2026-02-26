# Deployment Runbook + Operational SLOs

This runbook defines baseline production operations for LIC Legal Suite:

- deployment and migration flow
- startup readiness checks
- rollback procedure
- incident response process
- baseline SLOs and operational metrics

## 1) Scope and Environments

- Services:
  - `apps/api` (NestJS + Prisma + queues)
  - `apps/web` (Next.js)
  - Postgres (`pgvector`), Redis, MinIO, optional ClamAV
- Expected deployment tiers:
  - `staging` (pre-prod validation)
  - `production` (customer traffic)

## 2) Pre-Deployment Checklist

Run from clean branch/commit intended for release:

```bash
pnpm install
pnpm test
pnpm build
```

Validate env configuration:

- API secrets (`SESSION_SECRET`, provider keys, encryption keys) are present.
- `INTEGRATION_TOKEN_ENCRYPTION_KEYS` + `INTEGRATION_TOKEN_ACTIVE_KEY_ID` are set.
- Storage/database/cache endpoints resolve.
- Optional scanners/providers are configured per policy.
- For `staging` and `production`, run provider-live readiness matrix before deploy:

```bash
pnpm test:provider-live
pnpm test:integrations-live
pnpm ops:drill:backup-restore -- --out-dir artifacts/ops
```

## 3) Deployment Procedure

1. Deploy infrastructure changes (if any) first.
2. Deploy API + web artifact for target commit.
3. Run Prisma migration on API runtime:

```bash
pnpm --filter api prisma:deploy
```

4. If required for environment bootstrap only, run seed (never on live customer DB):

```bash
pnpm --filter api prisma:seed
```

5. Start/restart app services.
6. Run readiness checks (below) before opening traffic.

## 4) Startup Readiness Checks

Required checks after rollout:

```bash
curl -fsS http://<api-host>/health
curl -fsS http://<web-host>/login
```

Operational readiness checklist:

- API process is serving `/health` without error.
- web app serves core route(s) and can reach API base URL.
- migration status is current (`prisma:deploy` succeeded).
- queue workers and Redis connectivity are healthy.
- document storage read/write path works.
- provider readiness reports healthy (`/ops/provider-status`) with no missing critical env.
- connector staging validation rows (`connectors_clio_staging_validation`, `connectors_mycase_staging_validation`) show `mode=validated` before enabling traffic.
- verify incremental sync + webhook idempotency in staging (`pnpm --filter api test -- integrations.spec.ts provider-readiness.spec.ts provider-live-validation.spec.ts`).

Post-start smoke tests (minimum):

- Login as admin and client test user.
- Create a matter and verify dashboard visibility.
- Upload + download a document.
- Trigger one portal message.

## 5) Rollback Procedure

When release is unhealthy:

1. Freeze deploy pipeline and announce rollback in incident channel.
2. Route traffic back to previous stable app revision.
3. If migrations were non-breaking forward-compatible, keep DB at new version.
4. If a migration is breaking and rollback is required:
  - execute vetted restore/rollback plan from DB backup strategy
  - validate data integrity checks before re-opening writes
5. Re-run readiness + smoke checks on restored revision.

## 6) Incident Response

Severity baseline:

- `SEV-1`: data loss/exposure risk, multi-tenant isolation risk, or full outage.
- `SEV-2`: major workflow disruption for most users.
- `SEV-3`: degraded/non-critical functionality.

Response workflow:

1. Detect + triage (identify scope, impacted tenants, blast radius).
2. Contain (disable feature flag/integration path if needed).
3. Recover (rollback/hotfix/service restart as appropriate).
4. Communicate status updates on fixed cadence.
5. Complete postmortem with corrective actions and owner/due date.

## 7) Baseline SLOs and Metrics

Initial SLO targets:

- API availability: `99.9%` monthly
- Web availability: `99.9%` monthly
- P95 API latency (core CRUD): `< 500ms`
- P99 API latency (core CRUD): `< 1200ms`
- Queue job success rate (AI/import/export jobs): `>= 99%`
- Critical webhook delivery success (with retries): `>= 99%`
- RPO: `< 15 minutes` (database backup/replication policy dependent)
- RTO: `< 60 minutes`

Key metrics to track:

- HTTP error rate (`5xx`) by route and tenant
- DB connection pool saturation + query latency
- queue depth, retry counts, dead-letter volume
- storage operation failure rate
- auth failure/rate-limit spikes
- webhook delivery failures and retry behavior


## 7.1) Alerting Baseline (REQ-RC-010 / KAR-96)

Alert baseline endpoint: `GET /ops/alerts/baseline`.

Default lookback + thresholds (override with env vars when needed):

- `api_error_rate_spike` (critical): trigger when `5xx` request rate is `>= 5%` over the last `15m`.
- `queue_job_failures` (warning): trigger when failed async jobs are `>= 5` over the last `15m`.
- `webhook_delivery_failures` (warning): trigger when webhook failures are `>= 3` OR retrying deliveries are `>= 5` over the last `15m`.
- `provider_health_failures` (critical): trigger when unhealthy critical providers are `>= 1` from provider readiness checks.

Operational response paths:

1. API error rate spike
   - Validate request-level logs (`event=http.request.completed`) using `x-request-id`/`x-correlation-id`.
   - Triage top failing routes + impacted tenants.
   - Escalate to API on-call; declare incident if sustained for >10 minutes.
2. Queue/job failures
   - Inspect queue worker failure logs (`event=queue.job.failed`) and dead-letter/retry state.
   - Retry failed jobs if safe; escalate to owning subsystem (AI/import/export).
3. Webhook retries/failures
   - Inspect webhook delivery logs (`event=webhook.delivery.*`) for response codes and endpoint IDs.
   - Coordinate with partner endpoint owner; use scoped manual retry once endpoint is healthy.
4. Provider readiness failures
   - Check `GET /ops/provider-status` for missing critical credentials/modes.
   - Block deploy/traffic shift until provider status returns healthy.

## 8) Operational Ownership

- Release owner: runs deploy + readiness checklist.
- Incident commander: owns mitigation and communication during active incidents.
- Service owner: closes post-incident corrective actions.

## 9) Change Management Notes

- Every production release must map to a Linear issue/requirement.
- Verification evidence (tests + runbook references) must be attached before marking requirement complete.

## 10) Evidence Automation

Operational evidence commands:

```bash
pnpm ops:drill:backup-restore -- --out-dir artifacts/ops --evidence-index-file artifacts/ops/rc009-drill-evidence.json
pnpm ops:evidence:capture -- --api-base http://127.0.0.1:4000 --out artifacts/ops/provider-status-evidence.json
```

Prerequisites for backup drill command:

- local `pg_dump` / `pg_restore` / `psql` available in `PATH`, or
- running `docker compose` postgres service (the script can use container fallback).

Safety controls:

- Drill command refuses non-local database hosts unless `--allow-nonlocal-db` is explicitly provided.
- Use `--dry-run` to generate deterministic rehearsal artifacts without touching database services.

Generated artifacts:

- `artifacts/ops/backup-restore-drill-*.json`
- `artifacts/ops/migration-rollback-drill-*.json`
- `artifacts/ops/rc009-drill-evidence*.json`
- `artifacts/ops/provider-status-evidence.json`

CI evidence workflow:

- `.github/workflows/ops-readiness-evidence.yml`
- uploads artifact bundle `ops-readiness-evidence` for release records.

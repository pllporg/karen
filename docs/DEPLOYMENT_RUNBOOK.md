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

## 11) Launch-Candidate UAT Matrix + Go-Live Signoff (REQ-RC-011 / KAR-97)

Use this section for the final launch-candidate pass/fail gate. The release owner and on-call partner must be able to run this package start-to-finish using only this runbook.

### 11.1 Execution order (release owner / on-call)

Run from the release-candidate commit:

```bash
pnpm test
pnpm build
pnpm test:provider-live
pnpm test:integrations-live
pnpm ops:drill:backup-restore -- --out-dir artifacts/ops --evidence-index-file artifacts/ops/rc011-drill-evidence.json
pnpm ops:evidence:capture -- --api-base http://127.0.0.1:4000 --out artifacts/ops/provider-status-evidence.json
node tools/ops/generate_launch_candidate_signoff.mjs --out artifacts/ops/launch-candidate-signoff.md
```

The final command writes a prefilled signoff package with checklist placeholders and rollback criteria so evidence can be attached without editing this runbook.

### 11.2 Role-based UAT matrix (must be executed with evidence)

| Role | Scenario | Pass criteria | Evidence attachment |
| --- | --- | --- | --- |
| Release owner (engineering) | Smoke deploy in staging + readiness checks | `/health` and `/login` healthy, migrations current, queue/storage checks green | Deploy logs + health output + migration output |
| On-call engineer | Incident drill and rollback rehearsal | Backup/restore drill evidence captured, rollback path validated | `artifacts/ops/rc011-drill-evidence.json` |
| Security reviewer | Tenancy and access verification sweep | No cross-tenant data exposure and ABAC/ethical-wall checks pass | Test output + security checklist results |
| Product/UAT approver | Core workflow acceptance pass | Login, matter creation, doc upload/download, portal message pass with no blocker defects | UAT notes + screenshots + issue links |
| Ops owner | Provider readiness + alert baseline review | `/ops/provider-status` healthy and alerting baseline reviewed | `artifacts/ops/provider-status-evidence.json` + alert screenshot/export |

Rules:

- Every row must be marked `PASS`, `PASS WITH WAIVER`, or `FAIL` in the generated signoff package.
- `PASS WITH WAIVER` requires owner, mitigation, and due date before go-live.
- Any `FAIL` blocks release until resolved or explicitly waived by engineering + operations owners.

### 11.3 Explicit acceptance evidence checklist

Attach links/artifacts for each item:

1. Commit hash and release tag candidate.
2. `pnpm test` and `pnpm build` output.
3. Provider live/integration live test output (or approved exception in incident ticket).
4. Migration rehearsal evidence (forward and rollback-safe validation).
5. Backup/restore rollback drill artifact (`rc011-drill-evidence.json`).
6. Provider readiness artifact (`provider-status-evidence.json`).
7. Security final sweep notes (tenant isolation, access control, secrets/config sanity).
8. UAT execution matrix with owner signoff timestamps.
9. Go-live approval statement by engineering owner and operations/on-call owner.
10. Linear issue evidence links (`KAR-97`) and parity artifact update.

### 11.4 Go-live rollback criteria (objective release gates)

Rollback to the previous stable release if any of the following is true during launch window:

- Critical (`SEV-1`) incident occurs and mitigation is not complete within 15 minutes.
- API `5xx` error rate remains `>= 5%` for 10+ minutes.
- Provider health indicates critical dependency unhealthy at cutover.
- Cross-tenant isolation concern or security regression is detected.
- Migration integrity checks fail or data-loss risk is present.

Rollback execution must follow Section 5 and conclude with readiness + smoke checks on the restored revision before reopening traffic.

### 11.5 Signoff ownership and completion criteria

- Engineering release owner: confirms technical gate completion + migration safety.
- On-call / operations owner: confirms operational readiness + rollback readiness.
- Security reviewer: confirms final security sweep completion.

Go-live is approved only when all required evidence items are present and both engineering + operations owners mark `APPROVED` in the generated signoff file.

## 12) Release Smoke Runner (REQ-RC-014 / KAR-100)

Use a single command to execute the minimum release smoke path and generate a machine-readable artifact:

```bash
pnpm ops:release:smoke -- --api-base http://127.0.0.1:4000 --out artifacts/ops/release-smoke-summary.json
```

### 12.1 Workflow coverage

The smoke runner executes this exact sequence:

1. `login` (`POST /auth/login`) or validates a pre-supplied session token.
2. `matter create` (`POST /matters`).
3. `doc upload` (`POST /documents/upload`).
4. `invoice create` (`POST /billing/time-entries`, then `POST /billing/invoices`).
5. `portal message` (`POST /portal/messages`).
6. `AI job create` (`POST /ai/jobs`).

### 12.2 Prerequisites

- API service is reachable and healthy at `--api-base` (defaults to `http://127.0.0.1:4000`).
- A release smoke user exists with permissions for:
  - `matters:write`
  - `documents:write`
  - `billing:write`
  - `ai:write`
- Credentials are provided by one of:
  - `--email` and `--password`, or
  - `--token` / `OPS_SMOKE_SESSION_TOKEN`.
- The configured document storage, database, and queue dependencies are available so write flows can complete.

### 12.3 Artifact and failure interpretation

The command writes JSON to `artifacts/ops/release-smoke-summary.json` (or `--out`) with:

- `steps[]`: per-step status (`passed`, `failed`, `skipped`), status code, and details.
- `ids`: identifiers captured for created entities.
- `summary`: passed/failed/skipped totals.
- `healthy`: final release-smoke boolean.

Interpretation guidance:

- `healthy=true`: all required smoke actions completed.
- `failed > 0`: release is blocked until the failing step is triaged and re-run.
- `skipped > 0`: usually indicates an upstream failure (for example, matter creation failed so dependent steps were skipped).
- Common root causes:
  - `401/403`: session or permission misconfiguration.
  - `422/400`: invalid request payload due to API contract drift.
  - `5xx`: service dependency or deployment instability.

For incident handling and rollback criteria, continue with Sections 5, 6, and 11.4.

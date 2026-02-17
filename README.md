# Karen Legal Suite

Production-oriented monorepo scaffold for a multi-tenant legal practice management SaaS + legal AI case workforce, tailored to residential construction litigation.

## Monorepo Layout

- `apps/api`: NestJS API + Prisma + BullMQ + OpenAPI
- `apps/web`: Next.js App Router frontend
- `docker-compose.yml`: Postgres (`pgvector`), Redis, MinIO

## Core Capabilities Implemented

- Multi-tenant organization model with secure session auth
- RBAC + matter-level ethical wall/deny-list ABAC hooks
- Tamper-evident append-only audit events
- Contacts graph (person/org profiles, relationships, dedupe suggestions)
- Matters with participants, dashboard aggregation, intake wizard + construction domain profiles
- Tasks, calendar, ICS export, docket
- Communications threads/messages + full-text search query
- Documents upload/version/share/signed URLs + configurable malware scanning (stub/ClamAV) + DOCX/PDF generation flows
- Billing/time/expenses/invoices/payments + Stripe checkout link + trust ledger
- Client portal snapshot/messages/intake/e-sign stub
- Plugin import framework:
  - `mycase_backup_zip`
  - `clio_template` (CSV/XLSX)
  - `generic_csv`
- Full backup export ZIP (entity CSVs + document manifest)
- AI workspace:
  - RAG ingestion
  - queued jobs (BullMQ)
  - draft artifacts with provenance + citations
  - review workflow (approve/reject/edit)
  - deadline confirmation flow
- Public API surface with generated OpenAPI (`/openapi`)
- Webhooks endpoint registration + delivery tracking
- Integration connection framework with OAuth start/callback (Clio/MyCase), encrypted token storage, idempotent sync runs, and webhook subscription registry for Clio/MyCase/Filevine/PracticePanther/Gmail/Outlook/generic REST

## Security + Ethics Controls

- Tenant-scoped queries across modules
- Auth + AI endpoint rate limiting guards
- Matter access enforcement (`ethicalWallEnabled` + deny-list)
- Signed download URLs
- Malware scanning provider integration (`stub` and `clamav`) with fail-open/fail-closed controls
- AI output governance:
  - draft-only artifacts (`DRAFT` until reviewed)
  - attorney-review banner metadata
  - prompt/source/model provenance in `AiExecutionLog`
  - basic prompt-injection redaction for ingested document text

## Setup

1. Start infrastructure:

```bash
docker compose up -d
```

Optional: start local ClamAV sidecar for real malware scanning:

```bash
docker compose --profile security up -d clamav
```

2. Configure env:

```bash
cp .env.example .env
```

For production-like document upload security, configure:

- `MALWARE_SCANNER_PROVIDER=clamav`
- `MALWARE_SCANNER_FAIL_OPEN=false`
- `CLAMAV_HOST` / `CLAMAV_PORT` for your ClamAV daemon endpoint
- local sidecar default endpoint: `127.0.0.1:3310`

3. Install dependencies (Node 20+):

```bash
pnpm install
```

4. Generate Prisma client + migrate + seed:

```bash
pnpm --filter api prisma:generate
pnpm --filter api prisma:migrate
pnpm --filter api prisma:seed
```

5. Run both apps:

```bash
pnpm dev
```

- API: `http://localhost:4000`
- OpenAPI UI: `http://localhost:4000/openapi`
- Web: `http://localhost:3000`

## Demo Credentials

Seed script creates:

- `admin@karen-demo.local` / `ChangeMe123!`
- `attorney@karen-demo.local` / `ChangeMe123!`
- `paralegal@karen-demo.local` / `ChangeMe123!`
- `intake@karen-demo.local` / `ChangeMe123!`
- `billing@karen-demo.local` / `ChangeMe123!`
- `elena.client@karen-demo.local` / `ChangeMe123!`
- `sam.client@karen-demo.local` / `ChangeMe123!`
- `expert.vendor@karen-demo.local` / `ChangeMe123!`

## Import Usage

Endpoint: `POST /imports/run` (multipart)

Fields:

- `sourceSystem`: one of `mycase_backup_zip`, `clio_template`, `generic_csv`
- `file`: upload file
- optional `mappingProfileId`

Batch progress/result:

- `GET /imports/batches`
- `GET /imports/mapping-profiles`

Sample fixtures:

- `apps/api/test/fixtures/import-export/mycase-sample.zip`
- `apps/api/test/fixtures/import-export/clio-template.csv`
- `apps/api/test/fixtures/import-export/generic-contacts.csv`

## Export Usage

Trigger full backup:

- `POST /exports/full-backup`

List jobs:

- `GET /exports/jobs`

Data dictionary page:

- `GET http://localhost:3000/data-dictionary`

Export contract + conformance rules:

- `apps/api/src/exports/full-backup-contract.ts`
- `docs/parity/export-conformance.md`

## Tests

Run API tests:

```bash
pnpm --filter api test
```

Run web tests:

```bash
pnpm --filter web test
```

Included suites cover:

- auth/session behavior
- ethical wall access checks
- matter creation + participant role flow
- document upload flow
- import batch execution
- AI job queue creation
- import/export roundtrip fixture check
- web login/dashboard smoke, matters create/intake flow, and API client error handling

## Important Notes

- `apps/api/prisma/migrations/20260213180000_init/migration.sql` enables extension prerequisites and includes migration guidance. Generate complete SQL from Prisma schema in a Node-enabled environment via `pnpm --filter api prisma:migrate`.
- AI outputs are not legal advice and must be attorney-reviewed.
- OAuth provider handshake and external sync APIs are scaffolded for Phase 2 with persistent connection/sync/webhook records.
- Integration OAuth tokens are encrypted at rest. Configure `INTEGRATION_TOKEN_ENCRYPTION_KEYS` and `INTEGRATION_TOKEN_ACTIVE_KEY_ID` for non-stub environments.

### Integration Token Key Rotation

1. Add the new key to `INTEGRATION_TOKEN_ENCRYPTION_KEYS` while retaining old keys.
2. Switch `INTEGRATION_TOKEN_ACTIVE_KEY_ID` to the new key id.
3. Keep prior keys available until all legacy envelopes are re-written/expired.

### Integration OAuth + Sync Endpoints

- `POST /integrations/oauth/start`
  - starts provider OAuth handshake and returns authorization URL + state for callback correlation
- `POST /integrations/oauth/callback`
  - exchanges authorization code for tokens (live mode optional via env; stub by default)
- `POST /integrations/sync`
  - triggers connector sync with idempotency key; stores cursor/checkpoint on completion
- `POST /integrations/webhook-subscriptions`
  - registers webhook subscription and persists provider external subscription id

Live provider pull sync mode (optional, defaults to scaffold mode):

- set `INTEGRATION_SYNC_ENABLE_LIVE=true`
- configure provider API bases as needed:
  - `FILEVINE_API_BASE_URL`
  - `PRACTICEPANTHER_API_BASE_URL`
  - `CLIO_API_BASE_URL`
  - `MYCASE_API_BASE_URL`
- optional webhook registration endpoints:
  - `MYCASE_WEBHOOK_REGISTER_URL`
  - `CLIO_WEBHOOK_REGISTER_URL`

## Phase-2 Planned End-Goal Features

- Document retention policies (including legal hold and disposition controls)
- Advanced conflict rules (profile-based matching and conflict resolution workflow)
- Trust reconciliation workflows (run lifecycle, discrepancy queue, sign-off)
- LEDES/UTBMS export jobs (validation + standards-oriented outputs)
- Jurisdictional deadline rules packs (versioned by jurisdiction/court/procedure)

## New Chat Bootstrap

Use this protocol at the start of every new chat to avoid context-compaction drift:

```bash
git status --short --branch
pnpm backlog:verify
pnpm backlog:snapshot
```

Then read context in this order:

1. Active Linear issue(s) for current slice
2. Linear project state (`Prompt Parity - Karen Legal Suite`)
3. `tools/backlog-sync/requirements.matrix.json`
4. `README.md` (this section)
5. `Prompt-Context`

Handoff artifacts:

- `docs/SESSION_HANDOFF.md` (session state + operational handoff)
- `docs/WORKING_CONTRACT.md` (implementation protocol)
- `tools/backlog-sync/session.snapshot.json` (machine-readable status snapshot)
- `docs/parity/data-model-checklist.md` (prompt-entity to Prisma parity mapping and gap register)

Policy notes:

- Linear is canonical for parity task state and acceptance evidence.
- GitHub issues are mirror-only and not source-of-truth for parity state.
- Dirty working tree is allowed, but must be inspected and acknowledged at session start.
- Snapshot prioritization is phase-aware: `phase-1` requirements are ranked ahead of `phase-2` planned items.

## Prompt-Parity Backlog Operations (Linear + GitHub)

This repository includes automation to maintain a persistent parity backlog where:

- Linear is canonical.
- GitHub issues are a one-way mirror from Linear.

Artifacts live in `tools/backlog-sync`.

### 1) Bootstrap GitHub repo + protections

```bash
pnpm backlog:github:bootstrap
```

Required env:

- `GITHUB_TOKEN`
- `GITHUB_ORG`
- `GITHUB_REPO`

Optional:

- `GITHUB_REPO_VISIBILITY` (`private` default)
- `GITHUB_DEFAULT_BRANCH` (`main` default)
- `GITHUB_REQUIRED_CHECK` (`test` default)
- `GIT_USER_NAME`
- `GIT_USER_EMAIL`

### 2) Setup Linear project model

```bash
pnpm backlog:linear:setup
```

Required env:

- `LINEAR_API_TOKEN`

Optional:

- `LINEAR_TEAM_KEY` (`KAR` default)
- `LINEAR_PROJECT_NAME` (`Prompt Parity - Karen Legal Suite` default)

### 3) Seed parity backlog (epics + tasks)

```bash
pnpm backlog:seed
```

Uses `tools/backlog-sync/requirements.matrix.json` as the persistent, versioned source for parity tasks.

### 4) Mirror Linear issues to GitHub issues

```bash
pnpm backlog:sync
```

Required env:

- `LINEAR_API_TOKEN`
- `GITHUB_TOKEN`
- `GITHUB_OWNER`
- `GITHUB_REPO`

Optional:

- `LINEAR_SCOPE_LABEL` (`parity` default)
- `SYNC_LOOKBACK_MINUTES` (`120` default)
- `DRY_RUN` (`false` default)

### 5) Verify mirror integrity

```bash
pnpm backlog:verify
```

Checks:

- Linear issue count vs mirrored GitHub issue count.
- Missing mirrors.
- Orphan mirrors.
- Missing requirement IDs.

### 6) Generate machine-readable session snapshot

```bash
pnpm backlog:snapshot
```

Output:

- `tools/backlog-sync/session.snapshot.json`

Includes:

- unresolved requirement counts by phase/status/risk
- top priority requirement IDs
- recent Linear issue updates
- last successful `backlog:verify` timestamp

### 7) Local bootstrap check shortcut

```bash
pnpm backlog:bootstrap:check
```

Equivalent to:

```bash
pnpm backlog:verify && pnpm backlog:snapshot
```

Fallback rule:

- If snapshot and handoff timestamps drift, trust Linear state first, regenerate snapshot, and refresh `docs/SESSION_HANDOFF.md` before planning.

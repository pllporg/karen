# LIC Legal Suite

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
- Conflict rule profiles with weighted check scoring + attorney resolution/audit workflow
- Tasks, calendar, jurisdictional deadline rules packs (preview/apply + override reason capture), ICS export, docket
- Communications threads/messages + ranked full-text/fallback keyword search + configurable outbound providers (stub/Resend/Twilio) with persisted delivery metadata
- Documents upload/version/share/signed URLs + configurable malware scanning (stub/ClamAV) + retention policies/legal holds/disposition runs + DOCX/PDF generation flows with template provenance + strict merge validation
- Billing/time/expenses/invoices/payments + Stripe checkout link + trust ledger
- Client portal snapshot/messages/intake + provider-based e-sign workflow (stub/sandbox) + secure attachment upload/download
- Plugin import framework:
  - `mycase_backup_zip`
  - `clio_template` (CSV/XLSX)
  - `generic_csv`
- Full backup export ZIP (entity CSVs + document manifest)
- AI workspace:
  - RAG ingestion
  - pgvector similarity retrieval (matter-scoped) with recency fallback
  - queued jobs (BullMQ)
  - draft artifacts with provenance + citations
  - review workflow (approve/reject/edit)
  - deadline confirmation flow
  - style pack management + source-document governance + provenance
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

- `admin@lic-demo.local` / `ChangeMe123!`
- `attorney@lic-demo.local` / `ChangeMe123!`
- `paralegal@lic-demo.local` / `ChangeMe123!`
- `intake@lic-demo.local` / `ChangeMe123!`
- `billing@lic-demo.local` / `ChangeMe123!`
- `elena.client@lic-demo.local` / `ChangeMe123!`
- `sam.client@lic-demo.local` / `ChangeMe123!`
- `expert.vendor@lic-demo.local` / `ChangeMe123!`

Note: seeded demo accounts now use the LIC domain (`@lic-demo.local`) as part of the completed branding migration.

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

Portal attachment security workflow:

- `POST /portal/attachments/upload`
- `GET /portal/attachments/:versionId/download-url`
- `docs/parity/portal-attachments-security.md`

Communications provider workflow:

- `MESSAGE_EMAIL_PROVIDER=stub|resend`
- `MESSAGE_SMS_PROVIDER=stub|twilio`
- delivery metadata persisted in `CommunicationMessage.rawSourcePayload.delivery`

Webhook delivery hardening controls:

- `WEBHOOK_DELIVERY_MAX_ATTEMPTS` (default `3`)
- `WEBHOOK_DELIVERY_RETRY_BASE_DELAY_MS` (default `100`)
- outbound headers include `x-lic-signature-v1`, `x-lic-signature-timestamp`, `x-lic-delivery-id`, and `x-lic-idempotency-key` (legacy `x-karen-*` headers are still sent for compatibility)

Document template merge workflow:

- `POST /documents/template-merge`
  - accepts optional `mergeData` overrides
  - defaults to strict missing-placeholder validation (`strictValidation=true`)
- merge context includes matter/contact/custom-field graph for nested placeholders
- generated metadata persisted in `Document.rawSourcePayload` with template/source provenance
- parity evidence: `docs/parity/document-automation-coverage.md`

AI style pack governance workflow:

- `GET /ai/style-packs`
- `POST /ai/style-packs`
- `PATCH /ai/style-packs/:id`
- `POST /ai/style-packs/:id/source-docs`
- `DELETE /ai/style-packs/:id/source-docs/:documentVersionId`
- `docs/parity/style-pack-governance.md`

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

## Operations Runbook

- Deployment + rollback + incident + SLO guidance:
  - `docs/DEPLOYMENT_RUNBOOK.md`
- Parity evidence artifact:
  - `docs/parity/ops-runbook-slos.md`
- Recovery drill + provider evidence commands:
  - `pnpm ops:drill:backup-restore -- --out-dir artifacts/ops --evidence-index-file artifacts/ops/rc009-drill-evidence.json`
  - `pnpm ops:evidence:capture -- --api-base http://127.0.0.1:4000 --json-out artifacts/ops/provider-readiness-evidence.json --md-out artifacts/ops/provider-readiness-evidence.md`

## UI/UX Refactor Lane

- Canonical source and precedence:
  - `docs/UI_CANONICAL_PRECEDENCE.md` (source-of-truth precedence order)
  - Component states/patterns come from `lic-design-system/references/ui-kit.md`.
  - Product app work explicitly excludes `lic-design-system/references/marketing-site.md`.
  - The Brand Identity standards-manual app shell (`brand/Brand Identity Document*/src/app/components/Layout.tsx`) is designer documentation UX and is non-canonical for product route IA/copy.
- Planning artifact for LIC-aligned UI migration:
  - `docs/UI_REFACTOR_LANE_PLAN.md`
- PRD/screen coverage backlog:
  - `docs/UI_PRD_SCREEN_BACKLOG.md`
- PRD/screen templates:
  - `docs/templates/UI_PRD_TEMPLATE.md`
  - `docs/templates/UI_SCREEN_SPEC_TEMPLATE.md`
- Drafted route specs for current `REQ-UI-009` coverage are tracked in:
  - `docs/UI_PRD_SCREEN_BACKLOG.md` (all draft links)
  - `docs/prd/`
  - `docs/screens/`
- Token contract and baseline architecture:
  - `docs/UI_TOKEN_CONTRACT.md`
- Design + interaction compliance checklist:
  - `docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md`
- Regression + rollout gate runbook:
  - `docs/UI_REGRESSION_ROLLOUT_GATES.md`
- Backlog sequence:
  - `KAR-54` (lane plan), then `KAR-55` through `KAR-60` for tokens, shell, primitives, accessibility, responsive matrix, and regression rollout.
- Backlog normalization command for UI lane:
  - `pnpm backlog:ui:sync`
- Local UI regression gate command:
  - `pnpm test:ui-regression`
- Local LIC style guard command:
  - `pnpm ui:contract:check`

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

- Advanced conflict rules (profile-based matching and conflict resolution workflow)
- Trust reconciliation workflows (implemented; retained here as part of expanded end-goal scope)
- LEDES/UTBMS export jobs (implemented; retained here as part of expanded end-goal scope)
- Jurisdictional deadline rules packs (versioned by jurisdiction/court/procedure)

## New Chat Bootstrap

Canonical operations guidance now lives in:

1. `docs/OPERATIONS_PLAYBOOK.md` (canonical execution protocol)
2. `docs/ACTIVE_PHASES.md` (phase authority)
3. `docs/SESSION_HANDOFF.md` (current state and conflicts)
4. `docs/WORKING_CONTRACT.md` (invariants and decision rules)

Quick bootstrap command:

```bash
pnpm ops:preflight
```

## Prompt-Parity Backlog Operations (Linear + GitHub)

Backlog operations are canonicalized in:

- `docs/OPERATIONS_PLAYBOOK.md`
- `tools/backlog-sync/README.md`

General housekeeping command:

```bash
pnpm ops:housekeeping
```

## Symphony-Orchestrated Delivery

Execution model is now Symphony-first:

1. Repo-owned workflow contract: `WORKFLOW.md`
2. Operational governance: `docs/OPERATIONS_PLAYBOOK.md`
3. Backlog canonical model: Linear source of truth, GitHub mirror-only

Reference setup for Symphony runtime:
1. `docs/OPERATIONS_PLAYBOOK.md` (`Symphony Runtime` section)
2. `docs/SYMPHONY_ADOPTION.md`

Historical RC-1 Codex Cloud docs are archived references only.

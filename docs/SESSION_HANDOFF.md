# Karen Legal Suite Session Handoff

This document is the persistent handoff layer for new chats. Linear is canonical; this file provides the minimal runbook to reconstruct context quickly and consistently.

## Snapshot Metadata

- Snapshot File: `tools/backlog-sync/session.snapshot.json`
- Snapshot Timestamp: `2026-02-17T20:43:23.048Z`
- Snapshot Schema Version: `1.1.0`
- Last Successful Mirror Verify: `2026-02-17T20:28:52.482Z`

## Canonical Context Routing (Linear-First)

Use this order when reconstructing context:

1. Active Linear issue (`In Progress`/`In Review`)
2. Linear project status for parity scope
3. `tools/backlog-sync/requirements.matrix.json`
4. `README.md` -> `New Chat Bootstrap`
5. `Prompt-Context`

Rule: GitHub issues are mirror-only for parity scope and never source-of-truth for task status.

## Runtime Identity

- Monorepo: `apps/api` (NestJS + Prisma + BullMQ), `apps/web` (Next.js App Router), `docker-compose.yml` (Postgres pgvector, Redis, MinIO, optional ClamAV)
- Canonical backlog model: Linear project `Prompt Parity - Karen Legal Suite`
- Sync model: one-way Linear -> GitHub mirror via `tools/backlog-sync/linear_to_github.mjs`

## New Chat Bootstrap (Command-First)

Run these in order:

```bash
git status --short --branch
pnpm backlog:verify
pnpm backlog:snapshot
```

Then read:

1. `tools/backlog-sync/session.snapshot.json`
2. `docs/SESSION_HANDOFF.md`
3. Top priority Linear issues listed in snapshot (`priority.topRequirements`, `linearSummary.inProgressIssueKeys`)

## Priority Lane Policy

Selection policy:

1. `phase-1` requirements before `phase-2`
2. Within a phase: `Missing` requirements before `Partial`
3. Within same phase/status: `High` risk before `Medium` before `Low`
4. Security/data-integrity/portability before UX polish

## Dirty Tree Policy

Dirty working tree is allowed, but must be acknowledged at session start:

1. Record current branch and changed files from `git status --short --branch`.
2. Do not revert unrelated local changes.
3. If local edits conflict with planned slice, call out conflict before modifying files.

## Implementation Slice Protocol

For each requirement slice:

1. Implement code changes.
2. Validate (`pnpm test`, `pnpm build`, plus targeted suites).
3. Update Linear issue evidence/state.
4. Run `pnpm backlog:sync`.
5. Run `pnpm backlog:verify`.
6. Run `pnpm backlog:snapshot`.
7. Update this file’s `Snapshot Timestamp` and append delta note.

## Decision Tree: Choosing Next Task

1. Open snapshot `priority.topRequirements`.
2. Prioritize `phase-1` items before `phase-2`.
3. Within phase, if any requirement is `Missing`, pick highest-risk first.
4. If no `Missing`, pick highest-risk `Partial`.
5. If tie remains, pick requirement with greatest security/compliance impact.

## Delta Log

- 2026-02-17: Completed `REQ-BILL-004` by adding LEDES export profile/job schema, profile-driven UTBMS validation, billing endpoints for profile/job/list/download flow, checksum + artifact metadata persistence, billing-page LEDES workflow controls, and API/Web regression coverage (`docs/parity/ledes-export-workflows.md`).
- 2026-02-17: Completed `REQ-BILL-003` by adding trust reconciliation run/discrepancy schema, statement-period run lifecycle endpoints (`create/submit/resolve/complete`), sign-off gating requiring all discrepancies to be resolved/waived, billing UI reconciliation actions, and API/Web regression coverage (`docs/parity/trust-reconciliation-workflows.md`).
- 2026-02-17: Completed `REQ-MAT-005` by adding jurisdiction/court/procedure deadline rules packs with effective-date versioning, deadline preview/apply endpoints, business-day offset logic, required override-reason governance, matter-dashboard rules-pack preview/apply UI, and API/Web regression coverage (`docs/parity/deadline-rules-packs.md`).
- 2026-02-17: Completed `REQ-MAT-004` by adding advanced conflict rule profile configuration (weighted criteria + thresholds + scoped defaults), conflict check execution with recommendation scoring (`CLEAR/WARN/BLOCK`), and attorney resolution workflow with required rationale + auditable history, including admin UI/API coverage and tests (`docs/parity/conflict-rule-profiles.md`).
- 2026-02-17: Completed `REQ-OPS-002` with a production deployment runbook covering deploy/migrations/rollback/readiness/incident response plus baseline SLO targets and metrics, linked from `README.md`, with parity artifact `docs/parity/ops-runbook-slos.md`.
- 2026-02-17: Completed `REQ-PORTAL-002` by replacing stub-only e-sign with provider abstraction (`stub` fallback + `sandbox` provider), adding envelope list/refresh endpoints, signed provider webhook callback handling, persisted envelope status history/event tracking, and portal UI status surfacing with API/Web regression coverage (`docs/parity/esign-provider-abstraction.md`).
- 2026-02-17: Completed `REQ-MAT-002` with compound contact tag filters (`include/exclude + any/all`), relationship graph search/type filtering on API + web, and inline dedupe confidence indicators on contact rows, plus API/Web regression coverage (`docs/parity/contacts-graph-filtering.md`).
- 2026-02-17: Completed `REQ-DATA-003` by adding matter-scoped pgvector similarity retrieval for AI source chunks, vector-column persistence during ingestion, explicit recency fallback when embeddings/vector query are unavailable, and dedicated retrieval regression tests plus index migration (`docs/parity/pgvector-retrieval.md`).
- 2026-02-17: Completed `REQ-COMM-003` document automation coverage by adding nested DOCX merge context (matter/participants/custom fields), strict missing-placeholder validation before generation, and generated artifact provenance/audit events for template merges and generated PDFs (`docs/parity/document-automation-coverage.md`).
- 2026-02-17: Completed `REQ-COMM-002` communications search relevance/indexing with ranked `websearch_to_tsquery` full-text path, snippet generation, substring fallback, and a dedicated GIN FTS index migration plus regression coverage (`docs/parity/communications-search-indexing.md`).
- 2026-02-17: Completed `REQ-COMM-001` production communication adapters with configurable Resend (email) + Twilio (SMS) providers behind a dispatch interface, retry/fail-open policy, persisted outbound delivery/provider metadata on `CommunicationMessage.rawSourcePayload`, and new delivery-regression tests (`docs/parity/communications-provider-adapters.md`).
- 2026-02-17: Completed `REQ-AI-003` style-pack governance with admin CRUD/source-doc attachment endpoints, AI job `stylePackId` selection, style-pack provenance persisted in artifact + execution metadata, AI workspace style-pack management UI, and API/Web regression coverage (`docs/parity/style-pack-governance.md`).
- 2026-02-17: Implemented `REQ-PORTAL-001` secure portal attachment workflow: client-scoped attachment upload/download endpoints, portal message attachment linking, strict server-side matter + `sharedWithClient` checks in both portal and staff communications paths, and new API/Web regression coverage (`docs/parity/portal-attachments-security.md`).
- 2026-02-17: Completed `REQ-PORT-004` with a strict full-backup export contract (required files/columns + manifest schema/path checks), conformance-aware export job summaries, placeholder manifest-path integrity for missing document blobs, and new conformance/roundtrip regression coverage (`docs/parity/export-conformance.md`).
- 2026-02-17: Completed `REQ-PORT-003` with confirmed dedupe workflow (`merge/ignore/defer/reopen`), field-diff candidate UX, dedupe decision API endpoints with audit events, and merge referential-integrity tests plus UI action tests (`docs/parity/dedupe-merge-workflow.md`).
- 2026-02-17: Completed `REQ-PORT-002` with parity-level Clio CSV/XLSX mapping for contacts/matters/tasks/calendar/activities/notes/phone logs/emails, row-level unmapped-column diagnostics in `warningsJson`, and import batch summary breakdown (`warningCodeCounts`, `unmappedColumnsBySource`) plus coverage tests/artifact `docs/parity/clio-import-coverage.md`.
- 2026-02-17: Completed `REQ-PORT-001` with expanded MyCase ZIP entity coverage (contacts/companies/matters/tasks/calendar/invoices/payments/time/notes/messages), dependency-safe import ordering, row-level warning/error mapping context in `ImportItem`, and updated fixture/test coverage plus `docs/parity/mycase-import-coverage.md`.
- 2026-02-17: Completed `REQ-MAT-003` with full construction-intake domain capture (damages/liens/insurance/expert in wizard + API), draft save/resume endpoints and UI flow, and matter dashboard domain completeness indicators with API/Web regression tests.
- 2026-02-17: Completed `REQ-MAT-001` with org-configurable participant role definition endpoints, represented-by/law-firm semantic validation in matter participant creation, and matrix tests spanning all required participant categories.
- 2026-02-17: Completed `REQ-DATA-001` parity audit artifact at `docs/parity/data-model-checklist.md` with prompt-entity/model mapping and explicit gap linkage to active requirement IDs.
- 2026-02-16: Established new-chat continuity protocol, snapshot tooling, and freshness checks for context-compaction resilience.
- 2026-02-16: Added five end-goal features as `phase-2` planned scope (`REQ-COMM-004`, `REQ-MAT-004`, `REQ-MAT-005`, `REQ-BILL-003`, `REQ-BILL-004`) and enabled phase-aware snapshot prioritization.
- 2026-02-16: These additions are tracked as `phase-2` planned backlog items so they do not displace active `phase-1` delivery lanes.
- 2026-02-16: Implemented `REQ-AI-001` deadline-extraction confirmation UX with side-by-side source excerpt evidence and explicit per-row confirmation before task/event creation, plus parser/unit tests for structured deadline candidates.
- 2026-02-16: Implemented `REQ-AI-002` ingestion hardening with chunk-level prompt-injection filtering, metadata severity flags, blocked-chunk context exclusion, and adversarial test coverage.
- 2026-02-16: Implemented `REQ-BILL-001` Stripe lifecycle hardening with checkout metadata propagation, public webhook reconciliation endpoint, idempotent payment-intent handling, and webhook reconciliation tests.
- 2026-02-16: Implemented `REQ-BILL-002` trust ledger invariants (negative-balance guardrail), trust transfer workflow, account/matter summary reports, and reconciliation mismatch reporting with regression tests.

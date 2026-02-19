# Karen Legal Suite Session Handoff

This document is the persistent handoff layer for new chats. Linear is canonical; this file provides the minimal runbook to reconstruct context quickly and consistently.

## Snapshot Metadata

- Snapshot File: `tools/backlog-sync/session.snapshot.json`
- Snapshot Timestamp: `2026-02-19T15:40:55.480Z`
- Snapshot Schema Version: `1.1.0`
- Last Successful Mirror Verify: `2026-02-19T15:40:54.050Z`

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

UI refactor lane continuity:

1. Use `tools/backlog-sync/session.snapshot.json` -> `uiLaneSummary.openIssueKeys` for active UI queue.
2. Current UI queue is `KAR-56` through `KAR-60` with Brand Identity Document compliance criteria embedded in each issue.
3. UI primitives/state behavior should be checked against `brand/Brand Identity Document/src/app/components/sections/AppUIKit.tsx`.
4. `MarketingSite` section remains out-of-scope for product app parity.

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

- 2026-02-19: Implemented `KAR-58` / `REQ-UI-005` accessibility-interaction remediation slice with keyboard skip-link (`#karen-main-content`), focus-trapped/returning confirmation dialog replacing browser confirm flows for dedupe actions, structured toast + inline alert feedback hierarchy, and keyboard-safe communications thread selection (button semantics + live status updates), including new web regression coverage (`apps/web/test/confirm-dialog.spec.tsx`, `apps/web/test/communications-page.spec.tsx`, `apps/web/test/contacts-page.spec.tsx`, `docs/parity/ui-interaction-accessibility-verification.md`).
- 2026-02-19: Advanced `KAR-11` (REQ-DATA-002) to `In Review` after implementing a composable ABAC policy evaluation contract with explicit reason codes (`apps/api/src/access/access-policy.types.ts`, `apps/api/src/access/access-policy.engine.ts`, `apps/api/src/access/matter-access-policy.evaluator.ts`) and wiring `AccessService` through `evaluateMatterAccess(...)`; added policy/unit integration coverage in `apps/api/test/access-policy-evaluator.spec.ts` + expanded `apps/api/test/access-ethical-wall.spec.ts`, updated parity artifacts (`docs/parity/access-policy-abac-verification.md`, `docs/parity/data-model-checklist.md`, `docs/parity/data-model-conformance-verification.md`), and ran `pnpm --filter api test -- access-ethical-wall.spec.ts access-policy-evaluator.spec.ts`, `pnpm --filter api test`, `pnpm --filter api build`, `pnpm backlog:sync`, `pnpm backlog:verify`, `pnpm backlog:snapshot`.
- 2026-02-19: Updated UI lane documentation and web token/primitives to align with the latest Brand Identity `AppUIKit` component matrix (Marketing tab excluded), including canonical palette/token refresh, shared primitive state styling updates, and backlog sync-script metadata updates (`apps/web/app/lic-tokens.css`, `apps/web/app/globals.css`, `docs/UI_REFACTOR_LANE_PLAN.md`, `docs/UI_TOKEN_CONTRACT.md`, `docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md`, `tools/backlog-sync/sync_ui_refactor_backlog.mjs`).
- 2026-02-19: Advanced `KAR-56` (REQ-UI-003) to `In Review` after implementing Brand Identity shell/navigation refactor (desktop sidebar + mobile drawer toggle, procedural nav taxonomy with section codes, active-route semantics, and standardized header typography) with verification coverage in `apps/web/test/app-shell.spec.tsx`; validation commands passed: `pnpm --filter web test`, `pnpm --filter web build`, `pnpm test`, `pnpm build`.
- 2026-02-18: Canonicalized UI refactor backlog to the new `brand/Brand Identity Document` source by updating `KAR-54` through `KAR-60` with requirement IDs (`REQ-UI-001`..`REQ-UI-007`), explicit Brand Identity precedence, and checklist-based acceptance criteria; snapshot now publishes `uiLaneSummary` for new-chat continuity (`tools/backlog-sync/sync_ui_refactor_backlog.mjs`, `tools/backlog-sync/backlog_snapshot.mjs`, `docs/UI_REFACTOR_LANE_PLAN.md`, `docs/UI_TOKEN_CONTRACT.md`, `docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md`).
- 2026-02-18: Verified `REQ-MAT-005` by hardening rules-pack selection semantics (most-specific active effective pack wins; explicit inactive/out-of-window packs rejected), plus apply-selection guardrails rejecting unknown/duplicate rule IDs with dedicated regression coverage (`apps/api/test/deadline-rules-verification.spec.ts`, `docs/parity/deadline-rules-packs.md`).
- 2026-02-18: Verified `REQ-MAT-004` by hardening conflict profile update semantics (partial updates now preserve existing scope/weights/thresholds/default flags), adding deterministic default reassignment when a default profile is deactivated, and enforcing scoped-profile selection precedence so the most specific active match is selected for checks (`apps/api/test/admin-conflict-verification.spec.ts`, `docs/parity/conflict-rule-profiles.md`).
- 2026-02-18: Verified `REQ-COMM-004` by hardening disposition execution to re-check legal holds at execution time (disposing only eligible documents, skipping newly-held documents, reverting skipped docs to `ACTIVE`, and recording `skippedForLegalHoldAtExecution` audit metadata), with new regression coverage in `apps/api/test/document-retention-verification.spec.ts` and parity evidence in `docs/parity/document-retention-workflows.md`.
- 2026-02-18: Verified `REQ-BILL-004` by adding LEDES verification-hardening coverage for default-profile rotation (`isDefault` swap), explicit invoice-id export integrity (dedupe + missing-id rejection), and `includeExpenseLineItems=false` line filtering conformance, with parity evidence in `docs/parity/ledes-export-workflows.md` (`apps/api/test/billing-ledes-verification.spec.ts`).
- 2026-02-18: Verified `REQ-BILL-003` by hardening trust reconciliation service invariants (resolution status restricted to `RESOLVED|WAIVED`, non-open discrepancies cannot be re-resolved), plus regression coverage for negative-balance discrepancy reason codes, draft->in-review note append behavior, and resolution guardrails (`apps/api/test/billing-trust-reconciliation-verification.spec.ts`, `docs/parity/trust-reconciliation-workflows.md`).
- 2026-02-18: Verified `REQ-PORTAL-002` by adding explicit e-sign verification hardening coverage for client matter-scoped envelope listing, duplicate-webhook idempotency, refresh lifecycle history persistence, invalid-signature rejection, and portal envelope status refresh UX assertions (`apps/api/test/portal-esign-verification.spec.ts`, `apps/web/test/portal-page.spec.tsx`, `docs/parity/esign-provider-abstraction.md`).
- 2026-02-18: Verified `REQ-OPS-003` by adding executable governance checks for `.github/workflows/pr-linear-policy.yml` and `.github/pull_request_template.md`, including regex enforcement and required metadata section assertions (`apps/api/test/pr-linear-policy.spec.ts`, `docs/parity/pr-linear-policy-verification.md`).
- 2026-02-18: Verified `REQ-OPS-002` by adding executable runbook conformance coverage for required deployment/readiness/rollback/incident sections, baseline SLO targets, and README/parity linkage integrity (`apps/api/test/ops-runbook.spec.ts`, `docs/parity/ops-runbook-slos.md`).
- 2026-02-18: Verified `REQ-MAT-002` by hardening contacts filter/graph query parsing to support both CSV and repeated query params (`includeTags`, `excludeTags`, `relationshipTypes`), adding controller-level regression coverage for parsing and tag-mode fallback, and updating parity evidence (`docs/parity/contacts-graph-filtering.md`).
- 2026-02-18: Verified `REQ-INT-003` by hardening Filevine/PracticePanther connectors with live webhook registration URL support (env/config override), strict provider error surfacing, external subscription ID extraction, and expanded connector regression coverage (`docs/parity/filevine-practicepanther-connector-verification.md`).
- 2026-02-18: Finalized `REQ-AI-003` parity status to `Verified` in the requirements matrix and snapshot after reconfirming API/Web style-pack verification suites and provenance artifact coverage (`docs/parity/style-pack-verification.md`).
- 2026-02-18: Verified `REQ-PORT-004` by hardening full-backup manifest conformance checks with duplicate `documentVersionId`/path detection plus placeholder-flag/path-suffix consistency validation, and extending export conformance regression coverage (`docs/parity/export-conformance.md`).
- 2026-02-18: Verified `REQ-AI-003` by hardening style-pack source detach authorization (matter-access enforced), enriching detached-source audit provenance (`documentVersionId`, `documentId`, `matterId`), and retaining artifact/execution style-pack provenance checks (`docs/parity/style-pack-verification.md`).
- 2026-02-18: Verified `REQ-PORTAL-001` by hardening portal attachment auditability with explicit `portal.attachment.linked` and `portal.attachment.download_url_issued` events, while retaining portal upload/link/download security regression coverage (`docs/parity/portal-attachments-verification.md`).
- 2026-02-18: Verified `REQ-PORT-003` by hardening dedupe merge safeguards (self-merge rejection), expanding contact-reference reassignment coverage before duplicate deletion, and adding web confirmation-cancel behavior validation for merge actions (`docs/parity/dedupe-merge-verification.md`).
- 2026-02-18: Verified `REQ-PORT-002` by hardening Clio importer regression coverage for CSV/XLSX source-entity lineage, unresolved-reference row-context diagnostics, and communication external-reference payload integrity (`docs/parity/clio-import-verification.md`).
- 2026-02-18: Verified `REQ-PORT-001` by adding MyCase importer hardening coverage for dependency-order safety with unsorted ZIP entries, unlinked communication warning context integrity, and external-reference lineage/raw-payload assertions (`docs/parity/mycase-import-verification.md`).
- 2026-02-18: Verified `REQ-MAT-003` by expanding intake wizard regression coverage for required-domain validation gates, fallback contact resolution (lien/insurance/expert), full web payload composition, and draft resume field rehydration across construction sections (`docs/parity/intake-wizard-domain-verification.md`).
- 2026-02-18: Verified `REQ-MAT-001` by expanding participant-role regression coverage for missing role definitions, self-reference guards, explicit side/primary overrides, counsel-role label detection, and full category matrix enforcement (`docs/parity/matter-participant-role-verification.md`).
- 2026-02-18: Verified `REQ-INT-002` by adding MyCase OAuth refresh-grant support, validating connector refresh behavior (stub/live/error paths), and reusing integration-level callback/idempotency refresh orchestration coverage (`docs/parity/mycase-connector-verification.md`).
- 2026-02-18: Verified `REQ-INT-001` by hardening Clio connector OAuth refresh-grant support, adding refresh-before-sync orchestration for expired tokens, and expanding regression coverage for OAuth callback state validation, idempotent sync checkpointing, and webhook subscription flows (`docs/parity/clio-connector-verification.md`).
- 2026-02-18: Verified `REQ-DATA-001` with executable Prisma conformance coverage (`apps/api/test/schema-conformance.spec.ts`) enforcing required model presence, UUID id convention, and high-risk schema field semantics, with verification artifact `docs/parity/data-model-conformance-verification.md`.
- 2026-02-18: Verified `REQ-SEC-001` by expanding tenant-isolation coverage across newly added modules (document retention/disposition, trust reconciliation + LEDES entities, AI style packs) and keeping org-scope assertions enforced across core service query paths (`docs/parity/tenant-isolation-verification.md`).
- 2026-02-17: Verified `REQ-BILL-002` by hardening trust-transfer atomicity (paired transfer entries + ledger updates inside one DB transaction), adding transfer balance metadata to audit events, and fixing reconciliation transfer-delta logic to interpret `| out`/`| in` directions with expanded regression coverage (`docs/parity/billing-trust-ledger-verification.md`).
- 2026-02-17: Verified `REQ-BILL-001` by hardening Stripe reconciliation idempotency with event-level dedupe (`stripe_event:<eventId>`), preserving payment-intent dedupe, adding deterministic `payment_intent.succeeded` paid-transition coverage, and verifying signature-enforced webhook parsing when `STRIPE_WEBHOOK_SECRET` is configured (`docs/parity/billing-stripe-reconciliation-verification.md`).
- 2026-02-17: Verified `REQ-AI-002` by hardening ingestion/generation governance with explicit `quarantinedFromContext` metadata, citation-policy enforcement that appends trusted chunk citations when missing, `policyCompliance` artifact metadata, `ai.output.citation_policy_enforced` audit events, and expanded adversarial API coverage (`docs/parity/ai-ingestion-security-verification.md`).
- 2026-02-17: Verified `REQ-AI-001` by hardening deadline-confirmation server validation (non-empty selections, valid dates, at-least-one output), adding explicit `ai.deadlines.confirmed` audit events with selection/created-record metadata, and extending API/Web regression coverage (`docs/parity/ai-deadline-confirmation-verification.md`).
- 2026-02-17: Verified `REQ-OPS-001` with a new cross-module web smoke journey test (`login -> dashboard -> matter create -> portal message`) plus full-suite test/build validation, documented at `docs/parity/web-smoke-journey-coverage.md`.
- 2026-02-17: Added webhook delivery observability + manual retry controls with org-scoped delivery list/retry API endpoints, admin monitor/filter/retry UI, and regression coverage (`docs/parity/webhook-delivery-observability.md`).
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

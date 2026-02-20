# KAR-54 UI/UX Refactor Lane Plan (LIC Canonical)

## Canonical Source + Conflict Rule

- Canonical precedence: `docs/UI_CANONICAL_PRECEDENCE.md`.
- Product app scope uses LIC design-system references only; `lic-design-system/references/marketing-site.md` is excluded.
- If local legacy docs/components conflict, canonical precedence wins.

## Why This Lane Exists

UI work is currently split across legacy styling decisions and partially migrated LIC conventions. This lane standardizes the app as a procedural operations system and creates missing PRD/screen definitions required for existing and backlog functionality.

## Deliverables

1. Canonical token and interaction lock.
2. App shell + primitive compliance under LIC rules.
3. PRD and screen-spec coverage for existing routes.
4. Blocked PRD/screen placeholders for backlog features that are not yet designed.
5. Regression and rollout gates that prevent reintroduction of non-compliant styles.

## Phased Execution

### Phase 0: Canonical lock + guardrails

- Publish and ratify conflict-resolution contract.
- Add automated style guard checks (`pnpm ui:contract:check`).
- Wire guardrails into UI rollout CI workflow.
- Update token contract and checklist references.
- Enforce standards-manual boundary: extract standards from manual sections, but do not copy manual-app shell/nav/metadata UX into product routes.

### Phase 1: Product PRD + screen inventory (existing functionality)

Create PRD + screen specs for these routes:
- `apps/web/app/dashboard/page.tsx`
- `apps/web/app/matters/page.tsx`
- `apps/web/app/matters/[id]/page.tsx`
- `apps/web/app/contacts/page.tsx`
- `apps/web/app/communications/page.tsx`
- `apps/web/app/documents/page.tsx`
- `apps/web/app/billing/page.tsx`
- `apps/web/app/portal/page.tsx`
- `apps/web/app/ai/page.tsx`
- `apps/web/app/imports/page.tsx`
- `apps/web/app/exports/page.tsx`
- `apps/web/app/reporting/page.tsx`
- `apps/web/app/admin/page.tsx`
- `apps/web/app/login/page.tsx`
- `apps/web/app/shared-doc/[token]/page.tsx`

Each spec must define:
- states (default/loading/empty/error/success)
- review-gate transitions where applicable
- role/permission visibility
- accessibility expectations (keyboard/focus/labels)
- audit evidence requirements (timestamp, actor, action context)

### Phase 2: Backlog PRD + screen placeholders (future functionality)

Create blocked PRD/screen tickets for:
- advanced conflict rules expansion
- document retention/legal hold expansion
- trust reconciliation operations workspace
- LEDES/UTBMS export configuration and QA flows
- jurisdictional rules-pack management UX
- integration connector operations console (OAuth/sync/webhook observability)

Each placeholder includes:
- dependency marker: `Blocked by PRD/Screens`
- acceptance skeleton and data contracts
- target module and owning epic

### Phase 3: Foundation migration

- Align global tokens and typography roles to canonical values.
- Remove non-compliant palette drift and legacy aliases.
- Ensure shell structure and spacing grid are token-driven.

### Phase 4: Primitive migration

Normalize `Button/Input/Select/Textarea/Badge/Table/Card/Drawer/Modal/Toast`:
- explicit state behavior
- focus-visible and keyboard rules
- destructive confirmation patterns

### Phase 5: Route-by-route migration

Migrate in small PRs:
1. Shell + navigation
2. Queue/dashboard/matters list
3. Matter workspace tabs and workflow actions
4. Communications/documents/billing
5. Portal and AI surfaces
6. Admin/reporting/import/export

Shell + navigation acceptance gate:
- Header copy and nav taxonomy are product-operational (not documentation-taxonomy).
- No standards-manual copy markers in app shell or page headings.

### Phase 6: Regression + rollout hardening

- Enforce UI checklist evidence in PRs.
- Keep `pnpm test:ui-regression` green.
- Validate no console errors on touched routes.

## Ticket Strategy

- Preserve completed parity tickets as historical evidence.
- Add a new UI lane for PRD/screen coverage and canonical refactor execution.
- All new UI tickets include:
  - Requirement ID
  - canonical source references
  - checklist + screenshot evidence requirements

## Verification Standard per Slice

- `pnpm ui:contract:check`
- `pnpm --filter web test`
- `pnpm --filter web test:regression`
- `pnpm --filter web build`
- `pnpm test`
- `pnpm build`

## Non-Goals

- No backend API contract changes unless required for UI correctness.
- No large one-shot redesign PR.
- No bypass of review-gate/auditability requirements.

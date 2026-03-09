# PRD-06-A11Y-B Verification (KAR-127)

## Scope
- Form labels, ARIA wiring, and field error semantics.
- Table header scope attributes and table announcement semantics.

## Implementation Evidence
- Shared field semantics hardened in `apps/web/components/ui/form-field.tsx`:
  - `aria-required` for required fields.
  - `aria-errormessage` bound to field error node.
  - Field error node marked `role="alert"`.
- Shared table primitive fallback announcement in `apps/web/components/ui/table.tsx`:
  - Default `aria-label="Data table"` when no explicit label/labelledby is provided.
- Label wiring fixes in non-`FormField` label/control pairs:
  - `apps/web/app/auditor/page.tsx`
  - `apps/web/app/ai/artifact-review-card.tsx`
  - `apps/web/app/matters/[id]/participants-panel.tsx`
  - `apps/web/components/ui/toggle.tsx`
- Table sweep across `apps/web`:
  - Added `scope="col"` to all header cells missing scope.
  - Added `aria-label` to raw `<table className="table">` instances missing announcement attributes.
- Primitive coverage expanded in `apps/web/test/ui-primitives.spec.tsx` for:
  - `FormField` ARIA/error wiring.
  - Table role/name and header scope assertions.
  - `Toggle` label-to-switch semantics and checked-state callback behavior.
  - explicit table `aria-labelledby` preservation (no fallback override).
  - combined form-field hint + error `aria-describedby` semantics and hidden required marker.

## Static Verification Commands
- `rg -n "<label(?![^>]*htmlFor)" apps/web -g"*.tsx" -P | wc -l` -> `0`
- `rg -n "<table\\b(?![^>]*(aria-label|aria-labelledby))" apps/web -g"*.tsx" -P | rg -v "components/ui/table\\.tsx" | wc -l` -> `0`
- `rg -n "<th\\b(?![^>]*scope=)" apps/web -g"*.tsx" -P | rg -v "components/ui/table\\.tsx" | wc -l` -> `0`
- `pnpm ui:contract:check` -> `PASS`

## Validation Status
- Required web validation commands:
  - `pnpm --filter web test` -> `PASS` (22 files, 88 tests)
  - `pnpm --filter web build` -> `PASS` (clean rerun after auditor queue effect dependency stabilization)
- Additional verification runs:
  - `pnpm test:ui-regression` -> `PASS` (style guard + web regression suite + production build)
  - `pnpm --filter web test:regression` -> `PASS` (6 files, 33 tests)
  - `pnpm --filter web test -- test/auditor-page.spec.tsx` -> `PASS` (1 file, 4 tests)
  - `pnpm --filter web test -- test/intake-pages.spec.tsx` -> `PASS` (1 file, 11 tests)
  - `pnpm --filter web test -- test/intake-pages.spec.tsx` -> `PASS` across 3 consecutive reruns (non-repro of earlier transient miss)
  - `pnpm ui:contract:check` -> `PASS`
- Residual environment note:
  - `next/font/google` remains network-dependent on a cold cache; this run succeeded in the current workspace cache state.

## UI Evidence

### Screens/Routes Touched
- `/admin`
- `/ai`
- `/auditor`
- `/billing`
- `/data-dictionary`
- `/documents`
- `/exports`
- `/imports`
- `/intake`
- `/intake/[leadId]/convert`
- `/matters`
- `/matters/[id]`
- `/reporting`

### PRD + Screen Linkage
- `/ai` -> `REQ-UI-PRD-009`
  - PRD: `docs/prd/REQ-UI-009-ai.prd.md`
  - Screen spec: `docs/screens/REQ-UI-009-ai.screen-spec.md`
- `/matters` -> `REQ-UI-PRD-002`
  - PRD: `docs/prd/REQ-UI-009-matters-list.prd.md`
  - Screen spec: `docs/screens/REQ-UI-009-matters-list.screen-spec.md`
- `/matters/[id]` -> `REQ-UI-PRD-003`
  - PRD: `docs/prd/REQ-UI-009-matter-workspace.prd.md`
  - Screen spec: `docs/screens/REQ-UI-009-matter-workspace.screen-spec.md`
- `/billing` -> `REQ-UI-PRD-007`
  - PRD: `docs/prd/REQ-UI-009-billing.prd.md`
  - Screen spec: `docs/screens/REQ-UI-009-billing.screen-spec.md`
- `/documents` -> `REQ-UI-PRD-006`
  - PRD: `docs/prd/REQ-UI-009-documents.prd.md`
  - Screen spec: `docs/screens/REQ-UI-009-documents.screen-spec.md`
- `/imports` + `/exports` -> `REQ-UI-PRD-010`
  - PRD: `docs/prd/REQ-UI-009-imports-exports.prd.md`
  - Screen spec: `docs/screens/REQ-UI-009-imports-exports.screen-spec.md`
- `/reporting` + `/admin` + `/auditor` -> `REQ-UI-PRD-011`
  - PRD: `docs/prd/REQ-UI-009-reporting-admin.prd.md`
  - Screen spec: `docs/screens/REQ-UI-009-reporting-admin.screen-spec.md`

Routes `/intake`, `/intake/[leadId]/convert`, and `/data-dictionary` were semantic-only accessibility updates with no IA/content change in this issue; existing route baselines were preserved.

### Manual Checklist Outcomes (`docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md`)
- Accessibility semantics: PASS (`label`/`htmlFor`, `aria-errormessage`, alert-role errors, table header scope, table announcement naming).
- Keyboard behavior: PASS (no focus-order regression introduced; existing controls remain keyboard-reachable).
- Feedback hierarchy: PASS (error semantics strengthened with `role="alert"`; existing inline error UX preserved).
- Standards-manual boundary: PASS (no standards-manual shell/navigation copy added in product routes).

### Manual Walkthrough
1. Open `/auditor` and verify the queue filter labels are explicitly associated to controls and the queue table announces as a named table with scoped column headers.
2. Open `/ai` and verify review card controls keep explicit labels, and each validation/error message is announced as an alert when present.
3. Open `/matters/[id]` -> Participants panel and verify role controls are label-associated, required fields expose required semantics, and errors are announced with `aria-errormessage`.
4. Open `/imports`, `/exports`, `/billing`, `/documents`, and `/reporting`; confirm each operational data table exposes a table name and scoped column headers.

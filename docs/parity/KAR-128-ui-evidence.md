## KAR-128 UI Evidence

Date: 2026-03-09
Requirement: `PRD-07-PERF-A`
Linear Issue: `KAR-128`

## Before / After

- Before: `/admin`, `/ai`, `/matters/[id]`, and intake sub-routes mounted page-local panels, forms, and tables in the initial render path; dense shell and workflow links also kept speculative prefetch enabled; AI and matter dashboard derivations recalculated more often than needed.
- After: route-local heavy modules are deferred behind `next/dynamic`, dense workflow links opt out of speculative prefetch, repeated AI/matter dashboard derivations are memoized, and long card grids defer below-fold layout/paint with `content-visibility`.

## Touched Routes

- `/admin`
- `/ai`
- `/matters`
- `/matters/[id]`
- `/intake`
- `/intake/[leadId]/intake`
- `/intake/[leadId]/conflict`
- `/intake/[leadId]/engagement`
- `/intake/[leadId]/convert`

## PRD / Screen Spec Linkage

- `/admin` -> `docs/prd/REQ-UI-009-reporting-admin.prd.md`, `docs/screens/REQ-UI-009-reporting-admin.screen-spec.md`
- `/ai` -> `docs/prd/REQ-UI-009-ai.prd.md`, `docs/screens/REQ-UI-009-ai.screen-spec.md`
- `/matters` -> `docs/prd/REQ-UI-009-matters-list.prd.md`, `docs/screens/REQ-UI-009-matters-list.screen-spec.md`
- `/matters/[id]` -> `docs/prd/REQ-UI-009-matter-workspace.prd.md`, `docs/screens/REQ-UI-009-matter-workspace.screen-spec.md`
- `/intake` and `/intake/[leadId]/*` -> `docs/prd/REQ-UI-009-matters-list.prd.md`, `docs/screens/REQ-UI-009-matters-list.screen-spec.md`

## Async Chunk Evidence

From `apps/web/.next/react-loadable-manifest.json` after `pnpm --filter web build`:

- `app/admin/page.tsx -> ./admin-operations-panels`
- `app/ai/page.tsx -> ./job-creator-form`
- `app/ai/page.tsx -> ./jobs-table`
- `app/ai/page.tsx -> ./style-pack-manager`
- `app/matters/[id]/page.tsx -> ./overview-panel`
- `app/matters/[id]/page.tsx -> ./participants-panel`
- `app/matters/[id]/page.tsx -> ./tasks-panel`
- `app/matters/[id]/page.tsx -> ./calendar-panel`
- `app/matters/[id]/page.tsx -> ./timeline-docket-panel`
- `app/matters/[id]/page.tsx -> ./communications-panel`
- `app/matters/[id]/page.tsx -> ./documents-panel`
- `app/matters/[id]/page.tsx -> ./billing-panel`
- `app/matters/[id]/page.tsx -> ./ai-workspace-panel`
- `app/matters/[id]/page.tsx -> ./deadline-rules-panel`
- `app/intake/[leadId]/intake/page.tsx -> ../../../../components/intake/wizard-step-property`
- `app/intake/[leadId]/intake/page.tsx -> ../../../../components/intake/wizard-step-dispute`
- `app/intake/[leadId]/intake/page.tsx -> ../../../../components/intake/wizard-step-uploads`
- `app/intake/[leadId]/intake/page.tsx -> ../../../../components/intake/wizard-step-review`
- `app/intake/[leadId]/conflict/page.tsx -> ../../../../components/intake/conflict-results-table`
- `app/intake/[leadId]/conflict/page.tsx -> ../../../../components/intake/conflict-audit-trail`
- `app/intake/[leadId]/engagement/page.tsx -> ../../../../components/intake/template-picker`
- `app/intake/[leadId]/engagement/page.tsx -> ../../../../components/intake/fee-arrangement-form`

## Build Route Evidence

From `pnpm --filter web build`:

- `/admin` -> `4.98 kB`, First Load JS `143 kB`
- `/ai` -> `3.78 kB`, First Load JS `142 kB`
- `/matters/[id]` -> `8.39 kB`, First Load JS `147 kB`
- `/intake` -> `6.12 kB`, First Load JS `116 kB`
- `/intake/[leadId]/intake` -> `6.26 kB`, First Load JS `144 kB`
- `/intake/[leadId]/conflict` -> `5.96 kB`, First Load JS `144 kB`
- `/intake/[leadId]/engagement` -> `5.85 kB`, First Load JS `144 kB`
- Shared First Load JS -> `106 kB`

## Validation Evidence

- `pnpm --filter web lint` -> PASS with existing unrelated warning in `apps/web/app/auditor/page.tsx:170`
- `pnpm --filter web test` -> PASS (`22` files, `84` tests)
- `pnpm --filter web build` -> PASS
- `pnpm test:ui-regression` -> PASS

## UI Interaction Checklist

- `docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md` reviewed for the touched routes.
- Keyboard navigation and focus-visible behavior remain covered by the existing app-shell, confirm-dialog, and route workflow tests.
- No visual IA copy was introduced from standards-manual shell/navigation language.
- No console errors were emitted during the touched-route web test lane or production build; the only console signal in validation was the pre-existing lint warning on untouched `apps/web/app/auditor/page.tsx:170`.

## Screenshot Evidence

- No visible UI delta is expected from this lane. The change is limited to route chunking, prefetch suppression, memoized derivations, and deferred below-fold rendering.


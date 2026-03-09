## Issue

- Linear Key: `KAR-128`
- Requirement IDs: `PRD-07-PERF-A`

## Branch

- `lin/KAR-128-perf-lane-a-route-bundle-render-path-optimization`

## Commit SHA

- `ef10cab7f72bc9f1fe768eddab555231f9f27de2`

## PR URL

- `https://github.com/pllporg/karen/pull/309`

## Files Changed

- `apps/web/app/admin/page.tsx`
- `apps/web/app/ai/artifact-review-card.tsx`
- `apps/web/app/ai/jobs-table.tsx`
- `apps/web/app/ai/page.tsx`
- `apps/web/app/globals.css`
- `apps/web/app/intake/[leadId]/conflict/page.tsx`
- `apps/web/app/intake/[leadId]/convert/page.tsx`
- `apps/web/app/intake/[leadId]/engagement/page.tsx`
- `apps/web/app/intake/[leadId]/intake/page.tsx`
- `apps/web/app/intake/page.tsx`
- `apps/web/app/layout.tsx`
- `apps/web/app/lic-tokens.css`
- `apps/web/app/matters/[id]/page.tsx`
- `apps/web/app/matters/[id]/use-matter-dashboard.ts`
- `apps/web/app/matters/page.tsx`
- `apps/web/components/app-shell.tsx`
- `apps/web/components/intake/stage-nav.tsx`
- `apps/web/test/ai-page.spec.tsx`
- `apps/web/test/matter-dashboard-page.spec.tsx`
- `apps/web/test/setup.tsx`
- `docs/parity/KAR-128-ui-evidence.md`
- `docs/parity/KAR-128-run-report.md`

## Validation Results

| Command | Result | Notes |
| --- | --- | --- |
| `pnpm ops:preflight` | `FAIL` | Pre-existing operational drift only: dirty `docs/SESSION_HANDOFF.md` blocked a clean preflight, but `backlog:verify`, `backlog:matrix:check`, and `backlog:handoff:check` all passed. |
| `pnpm --filter web lint` | `PASS` | Existing unrelated warning remains in untouched `apps/web/app/auditor/page.tsx:170`. |
| `pnpm --filter web test` | `PASS` | `22` files and `84` tests passed, including the touched AI, matters, and intake workflows. |
| `pnpm --filter web build` | `PASS` | Production build passed with deferred-chunk evidence for `/admin`, `/ai`, `/matters/[id]`, and intake sub-routes. |
| `pnpm test:ui-regression` | `PASS` | LIC style guards, focused route regression suite, and a second production build all passed. |

## Known Risks / Follow-ups

1. `docs/SESSION_HANDOFF.md` is already dirty in this workspace, so `pnpm ops:preflight` is not green even though the issue-scoped validations passed.
2. `apps/web/app/auditor/page.tsx:170` still emits an existing `react-hooks/exhaustive-deps` warning during lint/build; KAR-128 does not touch that route.
3. Shared shell JS remains the dominant first-load cost at `106 kB`; this lane only trims route-local pressure and render-path work on the targeted pages.
4. Prefetch suppression on dense shell/workflow links reduces speculative network and bundle work, but it also removes background hover-prefetch behavior on those routes.

## Ready-to-Merge Decision

- `READY`
- Rationale: Issue-scoped code is committed, pushed, validated, and packaged in GitHub PR `#309`; remaining warnings/drift are pre-existing and outside KAR-128 scope.

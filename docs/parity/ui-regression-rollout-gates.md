# REQ-UI-007 Verification (KAR-60)

## Scope

- Enforce deterministic UI regression test gate for shell/matter/portal/AI surfaces.
- Enforce UI rollout evidence requirements in PRs for UI-touching changes.
- Document release criteria for UI compliance and no-console-error validation.

## Evidence

- `.github/workflows/ui-regression-rollout-gates.yml`
- `.github/pull_request_template.md`
- `apps/web/package.json`
- `package.json`
- `docs/UI_REGRESSION_ROLLOUT_GATES.md`
- `docs/UI_REFACTOR_LANE_PLAN.md`

## Validation Commands

- `pnpm --filter web test:regression`
- `pnpm --filter web build`
- `pnpm test`
- `pnpm build`

## Expected Gate Behavior

1. PRs touching `apps/web/**`, `brand/**`, or `docs/UI_*` fail if:
   - `## UI Interaction Checklist` section is missing.
   - `## Screenshot Evidence` section is missing.
   - checklist does not include `No console errors`.
2. PRs pass only when:
   - UI evidence check succeeds.
   - regression suite succeeds.
   - web build succeeds.

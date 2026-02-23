# REQ-UI-008 Verification (KAR-83)

Requirement: `REQ-UI-008`  
Scope: canonical LIC precedence and style-guardrail enforcement.

## Evidence

- Canonical precedence source:
  - `docs/UI_CANONICAL_PRECEDENCE.md`
- Guardrail implementation:
  - `tools/ui/check_lic_style_guards.mjs`
- CI rollout enforcement:
  - `.github/workflows/ui-regression-rollout-gates.yml`
- Executable policy test coverage:
  - `apps/api/test/ui-regression-rollout-gates.spec.ts`
- Script wiring:
  - `package.json`

## Verification Commands

- `pnpm ui:contract:check`
- `pnpm --filter api test -- ui-regression-rollout-gates.spec.ts`

## Latest Verification Run (KAR-83)

- LIC style guard passed with no prohibited patterns detected.
- Policy test passed and explicitly verifies:
  - workflow checks for `pnpm ui:contract:check`,
  - UI rollout evidence requirements (`UI Interaction Checklist`, `Screenshot Evidence`, `No console errors`),
  - regression/build gate commands in workflow and package scripts.

## Outcome

`REQ-UI-008` is verified with canonical precedence documentation, executable style-guard checks, and CI workflow policy assertions.

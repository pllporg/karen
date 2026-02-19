# UI Regression + Rollout Gates

Requirement: `REQ-UI-007` (`KAR-60`)

This runbook defines the mandatory release gates for UI-affecting pull requests.

## Canonical Standards

- Brand source: `brand/Brand Identity Document/`
- Component matrix: `brand/Brand Identity Document/src/app/components/sections/AppUIKit.tsx`
- Checklist: `docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md`
- Marketing scope exclusion: `MarketingSite` section is out-of-scope for product app parity.

## Automated Gates

1. `PR Linear Policy` must pass:
   - branch/title/linkage policy
   - required `Linear Issue` + `Requirement ID` sections
2. `UI Regression and Rollout Gates` must pass:
   - PR evidence validation for UI file changes (`UI Interaction Checklist` + `Screenshot Evidence`)
   - deterministic UI regression suite (`pnpm --filter web test:regression`)
   - production build check (`pnpm --filter web build`)
3. `CI` must pass:
   - full API + web test suites
   - full API + web builds

## Required Manual Evidence for UI PRs

UI-affecting PR bodies must include:

- `## UI Interaction Checklist`
- `## Screenshot Evidence`
- Explicit note that no console errors were observed on touched routes.

At minimum include before/after screenshots for:

- app shell/navigation context
- highest-risk changed workflow route(s)

## Regression Surface Coverage

`pnpm --filter web test:regression` covers:

- shell/navigation: `apps/web/test/app-shell.spec.tsx`
- matter workflows: `apps/web/test/matters-page.spec.tsx`
- matter dashboard workflows: `apps/web/test/matter-dashboard-page.spec.tsx`
- portal workflows: `apps/web/test/portal-page.spec.tsx`
- AI workflows: `apps/web/test/ai-page.spec.tsx`

## Local Verification Command

```bash
pnpm test:ui-regression
```

Expected result:

- regression suite passes
- web build passes
- no console errors found during manual route walkthrough

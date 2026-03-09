# PRD-06-A11Y-A Verification (KAR-126)

## Scope
- Harden keyboard flow and tab sequencing in high-traffic intake navigation controls.
- Harden shared tablet shell navigation so off-canvas controls are removed from keyboard order until the drawer is open.
- Enforce drawer focus management (focus trap, focus return, escape close) for review workflows.
- Remove click-only sortable header behavior in the shared table primitive.

## Before / After Summary
- Before: intake stage tabs were click-forward and lacked roving-tabindex arrow-key semantics; the shared tablet shell left visually hidden navigation controls reachable by keyboard; drawer focus handling allowed hidden/off-canvas interaction risks; sortable table headers were not exposed as native keyboard controls.
- After: intake tabs implement roving tabindex + Arrow/Home/End behavior; the tablet shell drawer now removes hidden navigation from the tab order and returns focus to the menu trigger on close; drawers use modal semantics with focus trap/focus return and closed-state non-rendering; sortable table headers use native `<button>` controls with keyboard focus support.

## Canonical References
- `docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md`
- `docs/UI_REGRESSION_ROLLOUT_GATES.md`
- `docs/UI_PRD_SCREEN_BACKLOG.md`

## Evidence
- `apps/web/app/auditor/page.tsx`
- `apps/web/components/app-shell.tsx`
- `apps/web/components/ui/drawer.tsx`
- `apps/web/components/intake/intake-queue-filters.tsx`
- `apps/web/app/intake/page.tsx`
- `apps/web/components/ui/table.tsx`
- `apps/web/app/globals.css`
- `apps/web/test/app-shell-responsive.spec.tsx`
- `apps/web/test/ui-primitives.spec.tsx`
- `apps/web/test/intake-pages.spec.tsx`
- `apps/web/test/auditor-page.spec.tsx`
- `artifacts/screenshots/KAR-126/intake-after.png`
- `artifacts/screenshots/KAR-126/auditor-drawer-after.png`
- `artifacts/screenshots/KAR-126/tablet-nav-drawer-after.png`
- `artifacts/ops/logs/KAR-126-ui-contract-check.log`
- `artifacts/ops/logs/KAR-126-web-lint.log`
- `artifacts/ops/logs/KAR-126-web-test.log`
- `artifacts/ops/logs/KAR-126-web-test-focused.log`
- `artifacts/ops/logs/KAR-126-web-build.log`
- `artifacts/ops/logs/KAR-126-ui-regression.log`
- `artifacts/ops/logs/KAR-126-web-dev-bind-attempt.log`

## UI Interaction Checklist Sign-off
- Visual system: Pass (no token palette or style-system regressions introduced in touched UI).
- Typography/copy: Pass (no shell/nav copy import; procedural copy retained).
- Layout/density: Pass (table-first queue layout preserved on touched routes).
- Interaction behavior: Pass (keyboard flow and focus behaviors hardened for tabs/drawer/sort controls).
- Shell/navigation exception check: Pass (product shell behavior updated without importing standards-manual shell copy or taxonomy).
- Feedback hierarchy: Pass (existing inline/drawer action feedback behavior preserved).
- Accessibility: Pass (keyboard navigation, focus-visible, modal focus trap/focus return behavior covered by tests).
- AI-specific interaction: N/A (no AI route behavior changes in this lane).

## PRD/Screen Linkage
- Requirement linkage: `PRD-06-A11Y-A` (Linear issue `KAR-126`).
- Touched routes: `/intake`, `/auditor`, shared shell navigation.
- Route-level PRD/screen artifacts remain incomplete for `/intake` and `/auditor` in `docs/UI_PRD_SCREEN_BACKLOG.md`; shell behavior aligns to the responsive matrix in `docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md`.
- Exception documented for this lane: accessibility hardening proceeded under `PRD-06-A11Y-A`; route-level PRD/screen mapping follow-up is required by backlog governance policy.

## Validation Commands
- `pnpm ops:preflight`
- `pnpm --filter web test`
- `pnpm --filter web build`
- `pnpm --filter web lint`
- `pnpm ui:contract:check`
- `pnpm --filter web test -- test/app-shell-responsive.spec.tsx`
- `pnpm --filter web test -- test/auditor-page.spec.tsx`
- `pnpm --filter web test -- test/intake-pages.spec.tsx test/auditor-page.spec.tsx test/ui-primitives.spec.tsx test/app-shell-responsive.spec.tsx`
- `cd apps/web && NEXT_FONT_GOOGLE_MOCKED_RESPONSES=/tmp/next-font-mocks.js pnpm exec next dev -H 127.0.0.1 -p 3000`
- `pnpm test:ui-regression`

## Latest Verification Run
- `pnpm ops:preflight`: rerun for the final workspace state and still failed because `docs/SESSION_HANDOFF.md` remains dirty and backlog verification/handoff checks fail on `fetch`; issue work proceeded without changing canonical control files.
- Shared tablet shell drawer now hides off-canvas navigation from keyboard traversal until opened, traps focus when open, closes on `Escape`, and restores focus to the menu trigger.
- Auditor queue reload effect now uses a stable callback/ref path, removing the stale-hook lint warning without changing queue behavior.
- Drawer now renders only when open and is exposed as a modal dialog (`role="dialog"` + `aria-modal="true"`).
- Drawer keyboard behavior is covered for initial focus, tab loop, escape close, and focus return.
- Intake stage tabs now implement roving tabindex and arrow/Home/End keyboard navigation.
- Sortable table headers now use a native button control for keyboard-safe sorting.
- `pnpm ui:contract:check`: passed (`LIC style guard check passed`).
- `pnpm --filter web test -- test/auditor-page.spec.tsx`: passed (`1` file / `4` tests).
- `pnpm --filter web lint`: passed with no warnings.
- `pnpm --filter web test -- test/app-shell-responsive.spec.tsx`: passed (`1` file / `5` tests).
- `pnpm --filter web test`: passed (`22` files / `88` tests).
- `pnpm --filter web test -- test/intake-pages.spec.tsx test/auditor-page.spec.tsx test/ui-primitives.spec.tsx test/app-shell-responsive.spec.tsx`: passed (`4` files / `29` tests).
- Touched-route tests now enforce a no-console-error contract for `/intake` and `/auditor`; assertions passed.
- `pnpm --filter web build`: passed.
- `pnpm test:ui-regression`: passed.
- Local production route capture succeeded via `next start` on port `3100` with Playwright-backed API stubs for touched routes.
- Validation logs captured:
  - `artifacts/ops/logs/KAR-126-ui-contract-check.log`
  - `artifacts/ops/logs/KAR-126-web-lint.log`
  - `artifacts/ops/logs/KAR-126-web-test.log`
  - `artifacts/ops/logs/KAR-126-web-test-focused.log`
  - `artifacts/ops/logs/KAR-126-web-build.log`
  - `artifacts/ops/logs/KAR-126-ui-regression.log`
- `artifacts/ops/operator-preflight.json`

## UI Evidence
- Automated evidence: accessibility and interaction behavior locked by `app-shell-responsive`, `ui-primitives`, `intake-pages`, and `auditor-page` test coverage.
- Manual evidence: walkthrough steps below verify keyboard-only shell, tab, and drawer flows on touched routes.
- Screenshot evidence:
  - `artifacts/screenshots/KAR-126/intake-after.png`
  - `artifacts/screenshots/KAR-126/auditor-drawer-after.png`
  - `artifacts/screenshots/KAR-126/tablet-nav-drawer-after.png`
- Console errors: no-console-errors are now enforced by automated assertions in touched-route tests (`intake-pages.spec.tsx`, `auditor-page.spec.tsx`); browser-console confirmation on live route screenshots remains an operator follow-up outside this sandbox.

## Manual Walkthrough
1. Open the tablet shell navigation drawer from any product route and verify hidden navigation links are not tabbable until the drawer is opened.
2. Press `Tab` / `Shift+Tab` inside the open drawer and confirm focus loops within the drawer controls.
3. Close the drawer (`Escape`, overlay, or `Close`) and verify focus returns to the `Menu` trigger.
4. Open `/auditor`, activate `Review` on any row, and verify focus lands inside the drawer and returns to the row's `Review` button when closed.
5. Open `/intake` and use arrow keys on stage tabs (`All`, `New`, `In Review`, `Conflict Hold`, `Ready`) to switch stages without using a mouse.
6. Verify only the active stage tab is in tab sequence and the results panel updates for the selected stage.

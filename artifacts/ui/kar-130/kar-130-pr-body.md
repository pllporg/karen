## Linear Issue
- Key: `KAR-130`
- URL: `https://linear.app/karenap/issue/KAR-130`

## Requirement ID
- `PRD-06-A11Y-C`

## Summary
- Normalize shared drawer and modal focus trap behavior, initial focus placement, escape-close handling, and focus restoration.
- Add explicit review confirmation before auditor queue mutations and align touched routes with the feedback hierarchy: inline state, toast, alert, confirmation dialog.
- Remove the authenticated-route hydration mismatch in `AppShell` so stored-session loads do not throw React hydration errors during drawer/modal workflows.

## Acceptance Criteria Checklist
- [x] Acceptance criteria from Linear issue are implemented.
- [x] API/data/UI impact reviewed.
- [x] Security/privacy implications reviewed.
- [x] Verification evidence attached.

## Test Evidence
- Commands run:
  - `pnpm ops:preflight`
  - `pnpm --filter web lint`
  - `pnpm --filter web test`
  - `pnpm --filter web build`
  - `pnpm test:ui-regression`
  - `pnpm dlx playwright test -c artifacts/ui/kar-130 capture-kar-130.spec.ts --workers=1`
- Output summary:
  - `ops:preflight`: PASS
  - `web lint`: PASS
  - `web test`: PASS (24 files, 90 tests)
  - `web build`: PASS
  - `test:ui-regression`: PASS
  - `playwright KAR-130 evidence harness`: PASS (3 scenarios, 0 console errors, 0 page errors)

## UI Interaction Checklist
- [x] `docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md` reviewed for touched routes.
- [x] Keyboard navigation + focus-visible behavior verified.
- [x] Feedback hierarchy verified (inline state -> toast -> alert -> confirmation dialog).
- [x] No console errors observed on touched routes.

## Screenshot Evidence
- Route(s):
  - `/auditor`
  - `/portal`
  - `/contacts`
- Before screenshot(s):
  - Not captured from the baseline branch in this dirty issue workspace.
- After screenshot(s):
  - `artifacts/ui/kar-130/screenshots/auditor-drawer-open.png`
  - `artifacts/ui/kar-130/screenshots/auditor-confirm-dialog.png`
  - `artifacts/ui/kar-130/screenshots/auditor-success-feedback.png`
  - `artifacts/ui/kar-130/screenshots/portal-message-confirm.png`
  - `artifacts/ui/kar-130/screenshots/portal-message-toast.png`
  - `artifacts/ui/kar-130/screenshots/portal-esign-confirm.png`
  - `artifacts/ui/kar-130/screenshots/portal-esign-toast.png`
  - `artifacts/ui/kar-130/screenshots/contacts-merge-confirm.png`
  - `artifacts/ui/kar-130/screenshots/contacts-merge-toast.png`
  - `artifacts/ui/kar-130/screenshots/contacts-decision-confirm.png`
  - `artifacts/ui/kar-130/screenshots/contacts-decision-toast.png`
  - `artifacts/ui/kar-130/screenshots/kar-130-console-summary.md`

## Notes
- Screenshot and console evidence were captured with a Playwright harness that seeds an authenticated session token and serves mock route data on `http://127.0.0.1:4000` for deterministic UI-state capture.
- Existing unrelated workspace edits in `apps/web/app/layout.tsx`, `apps/web/app/lic-tokens.css`, and `docs/parity/kar-130-symphony-run-report.md` were left out of this PR to keep KAR-130 scoped.

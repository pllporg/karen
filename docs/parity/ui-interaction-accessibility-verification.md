# REQ-UI-005 Verification (KAR-58, KAR-81)

## Scope
- Add deterministic confirmation dialog with focus trap and focus return.
- Remove pointer-only thread selection interactions.
- Add keyboard-first skip-link and explicit feedback hierarchy elements.

## Evidence
- `apps/web/components/confirm-dialog.tsx`
- `apps/web/components/toast-stack.tsx`
- `apps/web/components/app-shell.tsx`
- `apps/web/app/contacts/page.tsx`
- `apps/web/app/communications/page.tsx`
- `apps/web/app/globals.css`
- `apps/web/test/confirm-dialog.spec.tsx`
- `apps/web/test/communications-page.spec.tsx`
- `apps/web/test/contacts-page.spec.tsx`

## Validation Commands
- `pnpm --filter web test -- contacts-page.spec.tsx confirm-dialog.spec.tsx communications-page.spec.tsx app-shell.spec.tsx`
- `pnpm --filter web build`
- `pnpm ui:contract:check`

## Latest Verification Run (KAR-81)
- Focus trap and focus return behavior passed in `confirm-dialog.spec.tsx`.
- Keyboard-first thread selection and live status feedback passed in `communications-page.spec.tsx`.
- Confirmation and inline feedback hierarchy passed in `contacts-page.spec.tsx`.
- App shell navigation semantics and active-route accessibility passed in `app-shell.spec.tsx`.
- LIC style guard check passed with no prohibited styling regressions.
- `next build` completed successfully (non-blocking existing `react-hooks/exhaustive-deps` warnings remain outside this requirement scope).

## Manual Walkthrough
1. Open `/contacts`; trigger `Merge` or `Ignore` from dedupe suggestions.
2. Verify confirmation dialog opens with keyboard focus on `Return to Review`.
3. Use `Tab`/`Shift+Tab` to cycle focus inside dialog; press `Escape` to close and confirm focus returns to original trigger.
4. Execute action and confirm:
   - inline processing state appears,
   - success/error toast appears with timestamp,
   - inline error persists when backend call fails.
5. Open `/communications`; verify thread entries are keyboard-focusable buttons, selected state is announced via `aria-pressed`, and live status updates when selection/search changes.
6. Use `Tab` from page top and verify `Skip to main content` is reachable and functional.

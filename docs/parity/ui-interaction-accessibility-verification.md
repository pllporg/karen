# REQ-UI-005 Verification (KAR-58)

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

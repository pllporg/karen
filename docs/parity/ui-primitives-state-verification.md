# REQ-UI-004 Verification (KAR-57)

## Scope

- Normalize core UI primitives to canonical LIC states:
  - `Button`, `Input`, `Select`, `Badge`, `Table`, `Card`, `Drawer`, `Modal`, `Toast`
- Apply primitives to representative workflow screens (`Contacts`, `Communications`) and review-gate dialog surfaces.
- Add regression coverage for primitive state behavior and representative page flows.

## Evidence

- `apps/web/components/ui/button.tsx`
- `apps/web/components/ui/input.tsx`
- `apps/web/components/ui/select.tsx`
- `apps/web/components/ui/badge.tsx`
- `apps/web/components/ui/table.tsx`
- `apps/web/components/ui/card.tsx`
- `apps/web/components/ui/drawer.tsx`
- `apps/web/components/ui/modal.tsx`
- `apps/web/components/ui/toast.tsx`
- `apps/web/components/confirm-dialog.tsx`
- `apps/web/components/toast-stack.tsx`
- `apps/web/app/contacts/page.tsx`
- `apps/web/app/communications/page.tsx`
- `apps/web/app/globals.css`
- `apps/web/test/ui-primitives.spec.tsx`

## Validation Commands

- `pnpm --filter web test -- ui-primitives.spec.tsx contacts-page.spec.tsx communications-page.spec.tsx confirm-dialog.spec.tsx app-shell.spec.tsx`
- `pnpm --filter web test:regression`
- `pnpm --filter web build`
- `pnpm test`
- `pnpm build`

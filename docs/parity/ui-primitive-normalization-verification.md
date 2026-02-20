# REQ-UI-012 Verification: Primitive State + Accessibility Normalization

## Scope

- Issue: `KAR-74`
- Requirement: `REQ-UI-012`
- Canonical references:
  - `docs/UI_TOKEN_CONTRACT.md`
  - `docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md`
  - `brand/Brand Identity Document/src/app/components/sections/AppUIKit.tsx`

## Implementation Summary

- Added missing shared `Textarea` primitive with canonical invalid/disabled/default state semantics.
- Normalized primitive state metadata:
  - `Button`: `data-tone`, `data-state`
  - `Input`, `Select`, `Textarea`: `data-state` and normalized `aria-invalid`
  - `Badge`: `data-tone`
  - `Drawer`: `data-state`
  - `Modal`: `aria-busy`, `data-state`
  - `Toast`: `data-tone`
- Expanded primitive regression coverage to assert:
  - state metadata on button/input/select/textarea/badge/toast/drawer
  - modal busy-mode escape-blocking behavior
  - focus-visible keyboard style contract presence in global styles

## Verification Commands

```bash
pnpm ui:contract:check
pnpm --filter web test -- test/ui-primitives.spec.tsx test/confirm-dialog.spec.tsx
pnpm --filter web build
```

## Notes

- Primitive normalization is additive and does not change API contracts.
- Confirmation workflow patterns remain enforced via route-level confirm-dialog usage.

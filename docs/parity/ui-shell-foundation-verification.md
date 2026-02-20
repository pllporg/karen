# REQ-UI-011 Verification: Shell Foundation Token Alignment

## Scope

- Issue: `KAR-73`
- Requirement: `REQ-UI-011`
- Canonical references:
  - `docs/UI_TOKEN_CONTRACT.md`
  - `brand/Brand Identity Document/src/app/components/sections/AppUIKit.tsx`
  - `brand/Brand Identity Document/src/app/components/sections/InteractionDesign.tsx`

## Implementation Summary

- Migrated shell grid sizing to canonical token variables:
  - `--lic-shell-sidebar-width`
  - `--lic-shell-sidebar-compact-width`
- Added explicit shell content-width contract in the main workspace panel:
  - `--lic-content-max-width`
  - token-driven centered `main-panel-content` wrapper
- Normalized tablet drawer width to token-derived calculation from sidebar and spacing tokens.
- Added regression coverage to assert shell content is rendered through the canonical `main-panel-content` wrapper.

## Verification Commands

```bash
pnpm ui:contract:check
pnpm --filter web test -- test/app-shell.spec.tsx test/app-shell-responsive.spec.tsx
pnpm --filter web build
```

## Notes

- Changes are foundation-only and preserve route behavior.
- No API contracts changed.

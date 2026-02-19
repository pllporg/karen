# REQ-UI-006 Verification: Responsive Behavior Matrix

## Scope

- Issue: `KAR-59`
- Requirement: `REQ-UI-006`
- Canonical source: `brand/Brand Identity Document/src/app/components/sections/InteractionDesign.tsx` (Responsive Interaction table)

## Implementation Summary

- Added deterministic viewport-mode routing in `AppShell` with four modes:
  - `desktop` (`>=1280px`)
  - `compact` (`1024-1279px`)
  - `tablet` (`768-1023px`)
  - `unsupported` (`<768px`)
- Enforced responsive shell behaviors in `apps/web/app/globals.css`:
  - compact desktop rail semantics and dense-data preservation.
  - tablet drawer navigation, single-column panel grid, and 48px touch targets.
  - unsupported viewport fallback notice with explicit message.
- Added regression coverage for mode transitions and unsupported fallback in `apps/web/test/app-shell-responsive.spec.tsx`.
- Included responsive shell coverage in the web regression script.

## Verification Commands

```bash
pnpm --filter web test -- test/app-shell.spec.tsx test/app-shell-responsive.spec.tsx
pnpm --filter web test:regression
pnpm --filter web build
pnpm test
pnpm build
```

## Notes

- Unsupported viewport copy intentionally matches Brand Identity guidance:
  - `LIC is designed for desktop use. For the best experience, use a device with a screen width of 768px or greater.`

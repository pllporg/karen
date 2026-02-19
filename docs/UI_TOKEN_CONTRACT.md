# KAR-55 UI Token Contract (Canonicalized to Brand Identity Document)

## Canonical Source

All UI tokens and interaction constants derive from `brand/Brand Identity Document`.
Canonical component state behavior derives from `brand/Brand Identity Document/src/app/components/sections/AppUIKit.tsx`.
If any existing implementation differs, implementation must migrate to this contract.
If this contract conflicts with legacy docs or AGENTS token guidance, this contract (and Brand Identity source files) prevails.
Product app parity excludes `MarketingSite` tab visuals and interactions.

## Color Tokens (Fixed Palette)

### Primary
- `--lic-ink`: `#0B0D0F`
- `--lic-paper`: `#F2EFE6`

### Neutrals
- `--lic-graphite`: `#2A2D31`
- `--lic-slate`: `#5C6066`
- `--lic-silver`: `#8B857A`
- `--lic-fog`: `#D9D5CC`
- `--lic-parchment`: `#ECE8DE`

### Functional
- `--lic-institutional`: `#0B3D91` (links, active, focus)
- `--lic-filing-red`: `#B23A2B` (destructive, errors)
- `--lic-ledger`: `#2D5F3A` (success/approval)

Rule: do not introduce additional ad hoc color values for core UI.

## Typography Tokens

- `--lic-font-condensed`: IBM Plex Sans Condensed (primary headings, uppercase + 0.06em tracking)
- `--lic-font-sans`: IBM Plex Sans (body and long-form text)
- `--lic-font-mono`: IBM Plex Mono (labels/metadata/codes/status)

### Role Mapping
- Heading/module labels/nav section titles -> Condensed
- Body/descriptions/form help -> Sans
- Labels/codes/audit metadata/status chips -> Mono

## Spacing + Grid Tokens

### Base scale
- 8px base: `4, 8, 16, 24, 32, 48, 64, 96`

### Layout doctrine
- 12-column grid for desktop layouts.
- Max content width 960px.
- Horizontal margins never below 32px.

## Geometry + Rule Tokens

- `--lic-radius`: `0px`
- Border/rule hierarchy:
  - `--lic-rule-1`: `1px` (default containment)
  - `--lic-rule-2`: `2px` (section separators, table headers)
  - `--lic-rule-3`: `4px` (left-rule emphasis only)

Rule: no rounded corners, no drop shadows, no decorative gradients.

## Motion + Interaction Tokens

Allowed motion is functional and linear only.

- `--lic-motion-instant`: `0ms`
- `--lic-motion-fast`: `80ms`
- `--lic-motion-toast`: `100ms`
- `--lic-motion-panel`: `120ms`
- `--lic-motion-easing`: `linear`

Prohibited: spring/bounce, parallax, staggered reveals, page transitions, skeleton shimmer.

## Accessibility Tokens/Contracts

- Focus ring: 2px Institutional Blue, offset 2px, visible on light/dark contexts.
- Must support reduced motion (`prefers-reduced-motion`) by disabling non-essential transitions.
- Status/error communication cannot rely on color alone.

## Primitive Class Contract (Target)

Required primitive set for migration:
- `Button`
- `Input`
- `Textarea`
- `Select`
- `Badge` / status marker
- `Table`
- `Card`
- `Drawer`
- `Modal`
- `Toast`

Current primitive implementation path:
- `apps/web/components/ui/`

All primitives must consume token variables directly or via shared utility wrappers.
State matrices for these primitives must align with `AppUIKit` (default/hover/focus/active/disabled/loading where applicable).

## Compliance Rule

A UI change is non-compliant if it introduces any of:
- non-canonical colors,
- rounded corners,
- shadow/gradient decoration,
- non-linear decorative animation,
- inconsistent typography role usage,
- hidden/unlabeled state transitions.
- missing references to `docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md` in issue/PR verification evidence.

# KAR-55 UI Token Contract (Canonicalized to Brand Identity Document)

## Canonical Source

All UI tokens and interaction constants derive from `brand/Brand Identity Document`.
If any existing implementation differs, implementation must migrate to this contract.
If this contract conflicts with legacy docs or AGENTS token guidance, this contract (and Brand Identity source files) prevails.

## Color Tokens (Fixed Palette)

### Primary
- `--lic-ink`: `#0B0B0B`
- `--lic-paper`: `#F7F5F0`

### Neutrals
- `--lic-graphite`: `#3A3A3A`
- `--lic-slate`: `#6B6B6B`
- `--lic-silver`: `#A8A8A8`
- `--lic-fog`: `#D4D2CD`
- `--lic-parchment`: `#ECEAE4`

### Functional
- `--lic-institutional`: `#2B4C7E` (links, active, focus)
- `--lic-filing-red`: `#8B2500` (destructive, errors)
- `--lic-ledger`: `#2D5F3A` (success/approval)

Rule: do not introduce additional ad hoc color values for core UI.

## Typography Tokens

- `--lic-font-mono`: IBM Plex Mono (primary UI headings/labels/metadata)
- `--lic-font-sans`: IBM Plex Sans (body and long-form text)
- `--lic-font-serif`: IBM Plex Serif (limited quotes/emphasis only)

### Role Mapping
- Heading/module labels/nav labels/status metadata -> Mono
- Body/descriptions/form help -> Sans
- Pull quotes/formal statements -> Serif

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
  - `--lic-rule-1`: `1px`
  - `--lic-rule-2`: `2px`
  - `--lic-rule-4`: `4px` (left-rule emphasis only)

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

All primitives must consume token variables directly or via shared utility wrappers.

## Compliance Rule

A UI change is non-compliant if it introduces any of:
- non-canonical colors,
- rounded corners,
- shadow/gradient decoration,
- non-linear decorative animation,
- inconsistent typography role usage,
- hidden/unlabeled state transitions.
- missing references to `docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md` in issue/PR verification evidence.

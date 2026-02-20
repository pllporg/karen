# KAR-55 UI Token Contract

## Canonical Source and Precedence

- Canonical precedence is defined in `docs/UI_CANONICAL_PRECEDENCE.md`.
- Product UI tokens and interaction constants must follow:
  1. `lic-design-system/references/interaction-and-ai.md`
  2. `lic-design-system/references/ui-kit.md`
  3. `lic-design-system/references/design-tokens.md`
  4. `brand/Brand Identity Document/src/app/components/sections/**` and `src/styles/tailwind.css`
- Product app scope excludes `MarketingSite` visuals/interactions.

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

Rule: do not introduce ad hoc colors outside the token set.

## Typography Tokens

- `--lic-font-condensed`: IBM Plex Sans Condensed (page/module headings, uppercase + 0.06em tracking)
- `--lic-font-sans`: IBM Plex Sans (body/help/prose)
- `--lic-font-mono`: IBM Plex Mono (labels/metadata/codes/status/table headings)

### Role Mapping
- Route/page headings and section titles -> Condensed
- Body/descriptions/form help -> Sans
- Labels/codes/audit metadata/status/table headers -> Mono

## Spacing + Grid Tokens

### Base scale
- 8px base: `4, 8, 16, 24, 32, 48, 64, 96`

### Layout doctrine
- 12-column desktop layout.
- Max content width `960px` for dense procedural surfaces.
- Horizontal margins never below `32px`.

### Responsive behavior doctrine
- `>=1280px`: full desktop shell, persistent sidebar, dense table-first layouts.
- `1024-1279px`: compact desktop shell; maintain dense-data readability.
- `768-1023px`: tablet drawer navigation, single-column content, `48px` touch targets.
- `<768px`: unsupported viewport notice for operator workflows.

## Geometry + Rule Tokens

- `--lic-radius`: `0px`
- Rule hierarchy:
  - `--lic-rule-1`: `1px`
  - `--lic-rule-2`: `2px`
  - `--lic-rule-3`: `4px`

Rule: no rounded corners, no decorative shadows, no gradients.

## Motion + Interaction Tokens

- `--lic-motion-instant`: `0ms`
- `--lic-motion-fast`: `80ms`
- `--lic-motion-toast`: `100ms`
- `--lic-motion-panel`: `120ms`
- `--lic-motion-easing`: `linear`

Prohibited: spring/bounce/parallax/staggered entrance animation and shimmer placeholders.

## Accessibility Tokens/Contracts

- Focus ring: `2px` Institutional Blue with `2px` offset.
- Reduced motion required via `prefers-reduced-motion`.
- State/error semantics must never rely on color alone.

## Primitive Contract

Required primitives:
- `Button`
- `Input`
- `Textarea`
- `Select`
- `Badge`
- `Table`
- `Card`
- `Drawer`
- `Modal`
- `Toast`

Implementation path:
- `apps/web/components/ui/`

State model must align with `AppUIKit` and interaction doctrine.

## Compliance Gate

UI changes are non-compliant if they introduce:
- non-canonical token values,
- rounded corners,
- shadow/gradient decoration,
- non-linear decorative animation,
- inconsistent typography role usage,
- hidden/unlabeled state transitions,
- missing checklist evidence from `docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md`.

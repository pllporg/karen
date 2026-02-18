# KAR-55 UI Token Contract

## Scope
Defines the LIC token contract and baseline UI architecture used by `apps/web`.

## Token Source of Truth
- File: `apps/web/app/lic-tokens.css`
- Imported globally by: `apps/web/app/globals.css`

## Token Families
- Color: `--lic-paper`, `--lic-ink`, `--lic-warm-gray`, `--lic-blue`, `--lic-red`
- Surface/Text: `--lic-surface-*`, `--lic-text-*`
- Rules/Geometry: `--lic-rule-*`, `--lic-radius`
- Spacing grid: `--lic-1` through `--lic-8` (8pt progression)
- Typography: `--lic-font-sans`, `--lic-font-condensed`, `--lic-font-mono`
- Focus: `--lic-focus`

## Base UI Architecture
- Global shell classes: `.page-shell`, `.sidebar`, `.main-panel`, `.topbar`
- Primitive class contract: `.button`, `.input`, `.select`, `.textarea`, `.badge`, `.table`, `.card`
- Accessibility baseline: standardized `:focus-visible` ring across interactive controls

## LIC Enforcement Rules
- No shadows.
- No gradients.
- No rounded corners.
- Border-first hierarchy (`--lic-rule-*`) instead of visual elevation.
- Table-first dense data presentation.

## Migration Guidance
- New UI changes must consume token variables directly or via existing primitive class contract.
- New one-off inline styling for colors/radius/shadows is out of scope unless explicitly approved.
- Page-level refactors should prioritize replacing ad hoc styles with primitive class usage before introducing new layout variants.

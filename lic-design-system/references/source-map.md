# Source Map (Manual -> Skill References)

This file maps the original manual source files to this packaged skill.

## Foundational Sections

- `src/app/components/sections/BrandFoundation.tsx` -> `references/brand-foundation.md`
- `src/app/components/sections/LogoMarks.tsx` -> `references/design-tokens.md`, `references/brand-foundation.md`
- `src/app/components/sections/ColorSystem.tsx` -> `references/design-tokens.md`
- `src/app/components/sections/TypographySection.tsx` -> `references/design-tokens.md`
- `src/app/components/sections/NamingSystem.tsx` -> `references/brand-foundation.md`
- `src/app/components/sections/MessagingVoice.tsx` -> `references/brand-foundation.md`

## System and Interaction Sections

- `src/app/components/sections/GridComponents.tsx` -> `references/design-tokens.md`, `references/ui-kit.md`
- `src/app/components/sections/InteractionDesign.tsx` -> `references/interaction-and-ai.md`
- `src/app/components/sections/AIInteraction.tsx` -> `references/interaction-and-ai.md`
- `src/app/components/sections/AppUIKit.tsx` -> `references/ui-kit.md`

## Marketing and Flow Sections

- `src/app/components/sections/MarketingSite.tsx` -> `references/marketing-site.md`
- `src/app/components/sections/GP01Screens.tsx` -> `references/gp01-flow.md`
- `src/app/components/sections/GP01Design.tsx` -> `references/gp01-flow.md`

## Theme and Token Sources

- `src/styles/tailwind.css` -> `references/design-tokens.md`
- `src/styles/theme.css` -> `references/design-tokens.md`
- `src/styles/fonts.css` -> `references/design-tokens.md`

## Boundary Rules (Do Not Copy As Product UX)

- `src/app/components/Layout.tsx` (standards-manual app shell/navigation)
- `src/app/routes.ts` (standards-manual site IA)

These files define designer-documentation navigation for the standards manual app and are not canonical product UX for `apps/web/**`.

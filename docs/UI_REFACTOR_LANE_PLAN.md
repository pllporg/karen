# KAR-54 UI/UX Refactor Lane Plan (Brand Identity Document Canonical)

## Canonical Source + Precedence

1. Canonical source of truth: `brand/Brand Identity Document/`.
2. If conflicts exist between prior UI docs or current implementation and the Brand Identity Document, **Brand Identity Document wins**.
3. If AGENTS guidance, legacy UI tokens, or in-product styles conflict with Brand Identity standards, resolve to Brand Identity and record the delta in the ticket verification evidence.
4. Affected references:
- `brand/Brand Identity Document/src/app/components/sections/ColorSystem.tsx`
- `brand/Brand Identity Document/src/app/components/sections/TypographySection.tsx`
- `brand/Brand Identity Document/src/app/components/sections/GridComponents.tsx`
- `brand/Brand Identity Document/src/app/components/sections/InteractionDesign.tsx`
- `brand/Brand Identity Document/src/app/components/sections/AIInteraction.tsx`
- `brand/Brand Identity Document/src/app/components/sections/MessagingVoice.tsx`
- `brand/Brand Identity Document/src/app/components/sections/NamingSystem.tsx`

## Objective

Refactor the app UI into a standards-manual style system: controlled, procedural, auditable, and interaction-safe for litigation workflows.

## Enforceable Standards (Extracted)

### Visual + Layout
- Color palette is fixed: Ink `#0B0B0B`, Paper `#F7F5F0`, Graphite `#3A3A3A`, Slate `#6B6B6B`, Silver `#A8A8A8`, Fog `#D4D2CD`, Parchment `#ECEAE4`, Institutional Blue `#2B4C7E`, Filing Red `#8B2500`, Ledger Green `#2D5F3A`.
- No gradients, no shadows, no decorative transparency effects.
- No rounded corners (rectilinear geometry only).
- 12-column grid, max content width 960px, margins never below 32px.
- 8px spacing base (4, 8, 16, 24, 32, 48, 64, 96).
- Tables/lists are first-class for dense operations.

### Typography + Voice
- IBM Plex Mono is primary for headings/labels/codes/UI metadata.
- IBM Plex Sans for body/prose.
- IBM Plex Serif is limited to pull quotes/emphasis.
- Tone: procedural, terse, declarative, action-oriented.
- Ban hype/friendly filler language.

### Interaction + Accessibility
- State always visible; actions reversible; system never interrupts first.
- Motion only when functional; linear timing only (`0ms`, `80ms`, `100ms`, `120ms`).
- Prohibited patterns include: infinite scroll, optimistic UI for critical operations, skeleton shimmer, hover-only disclosure, stacked modals, toast-only error handling.
- Feedback hierarchy: inline state -> toast -> inline alert -> confirmation dialog.
- Destructive actions require explicit confirmation and consequence text.
- Keyboard-first: visible focus, correct tab order, modal focus trap/return.
- WCAG 2.1 AA and reduced-motion support required.

### AI Interaction Standards
- AI is workforce, not chat persona.
- Universal Interface is command surface: natural-language input, structured output.
- Every output requires provenance + review gate before external use.
- No anthropomorphic language, no confidence percentages, no conversational filler.

## Current Delta (Must Be Corrected in Lane)

- Existing `apps/web/app/globals.css` and token implementation are transitional and not fully aligned to canonical color/typography/interaction definitions.
- Prior token choices and spacing/type role assumptions must be reconciled to Brand Identity Document values and role mapping.

## Refactor Sequence (Updated)

### Phase 0 - Canonical Lock + Delta Audit
- Freeze standards: publish canonical compliance checklist.
- Document implementation deltas route-by-route and primitive-by-primitive.
- Add PR checklist gate for standards compliance.

### Phase 1 - Foundation Realignment
- Realign color tokens exactly to canonical palette.
- Realign typography role mapping (Mono-first heading/label system).
- Align spacing/grid constants to 8px base and 12-column rules.

### Phase 2 - Shell + Navigation
- Apply canonical shell structure and hierarchy.
- Ensure nav semantics, keyboard traversal, and status visibility.
- Eliminate conflicting decorative patterns.

### Phase 3 - Primitive System Uplift
- Standardize Button/Input/Select/Textarea/Badge/Table/Card/Drawer/Modal/Toast.
- Encode explicit state models and focus behavior.
- Enforce destructive-action confirmation standards.

### Phase 4 - Workflow Interaction Compliance
- Apply feedback hierarchy and review gate workflow standards.
- Normalize AI interaction presentation to command/provenance model.
- Replace anti-patterns (optimistic flow, hidden state, non-explicit approvals).

### Phase 5 - Accessibility + Responsive + Regression
- Enforce WCAG/keyboard/reduced-motion requirements.
- Apply desktop-first responsive doctrine and unsupported-mobile behavior.
- Expand regression and smoke coverage across high-risk workflows.

## Ticket Mapping

- `KAR-55`: foundation/token architecture and canonical token contract.
- `KAR-56`: shell/navigation architecture compliance.
- `KAR-57`: primitives + interaction state standardization.
- `KAR-58`: accessibility compliance lane.
- `KAR-59`: responsive behavior matrix + breakpoints doctrine.
- `KAR-60`: regression + rollout gate enforcement.
- Canonical token/global reconciliation is enforced as acceptance criteria within `KAR-56` and `KAR-57` execution.

## Verification Standard per Slice

- `pnpm --filter web test`
- `pnpm --filter web build`
- `pnpm test`
- `pnpm build`
- Manual: keyboard/focus-visible, review-gate behavior, confirmation patterns, no console errors, and checklist sign-off in PR.

## Non-Goals

- No backend contract changes in this lane unless UI correctness explicitly requires it.
- No large single-PR visual rewrite.
- No bypass of review-gate/auditability standards for speed.

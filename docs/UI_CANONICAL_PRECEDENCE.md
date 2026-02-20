# UI Canonical Precedence (Phase-0 Lock)

This document resolves conflicting UI guidance across legacy repo docs, AGENTS guidance, and LIC references.

## Scope

- Applies to product application UI under `apps/web/**`.
- Excludes marketing-site visuals and interactions.
- Treat the Brand Identity "standards manual app" as a documentation container, not as product UX to clone.

## Canonical Source Order

1. `lic-design-system/references/interaction-and-ai.md`
2. `lic-design-system/references/ui-kit.md`
3. `lic-design-system/references/design-tokens.md`
4. `lic-design-system/references/source-map.md`
5. Legacy local docs (`brand/**`, `uirefactorprompt.md`, prior superseded `docs/UI_*.md`) are archive-only and non-canonical.
6. `AGENTS.md` / `agents.md` remain execution constraints and must stay aligned with this precedence contract for UI values.

If a rule conflicts, higher-order source wins.

## Conflict Decisions

### Color profile

- Canonical product palette uses the LIC reference profile:
  - Paper `#F7F5F0`
  - Ink `#0B0B0B`
  - Institutional `#2B4C7E`
  - Filing Red `#8B2500`
  - Ledger `#2D5F3A`
- Legacy palette values are treated as transitional and must not be reintroduced.

### Typography

- Body copy: IBM Plex Sans.
- Labels, metadata, status, table headers: IBM Plex Mono (uppercase where applicable).
- Page/module headings: IBM Plex Sans Condensed uppercase with tracked letter spacing.
- This split preserves procedural readability and resolves mono-vs-condensed conflict without adding new font families.

### Branding transition compatibility (Decision 1A)

- Keep compatibility naming identifiers until `KAR-76` is completed and verified.
- Transitional identifiers may remain in non-UI/runtime compatibility surfaces:
  - package/repo identifiers (for example `karen-legal-suite`)
  - demo seed domains (for example `@karen-demo.local`)
  - legacy integration headers (`x-karen-*`) where backward compatibility is required
- New UI copy and new user-facing branding must use LIC naming immediately.

### Standards-manual boundary (Design Source Rule)

- The standards-manual shell/navigation in `brand/Brand Identity Document*/src/app/components/Layout.tsx` is documentation UX for designers.
- Product UX must not reuse standards-manual copy markers in operator-facing surfaces (for example: `Standards Manual`, `LIC / IDENTITY`, revision/confidential banners, or section-number nav motifs).
- Canonical product behavior comes from standards sections (tokens, primitives, interaction, GP-01 screens/flow), not from the manual app's site IA.
- Route labels, headings, and metadata in `apps/web/**` must reflect live product operations (matters, billing, portal, AI workflows), not documentation taxonomy.

### Motion and geometry

- No gradients, no decorative shadows, no rounded corners.
- Allowed transitions are linear and functional only (`0ms`, `80ms`, `100ms`, `120ms`).

### Workflow interaction rules

- Mandatory review gate sequence for generated outputs:
  - `PROPOSED -> IN REVIEW -> APPROVED -> EXECUTED -> RETURNED`
- No auto-send to clients; explicit approval required.
- Every state-changing action must show timestamped feedback and produce audit trail context.

## Adoption-Prompt Requirements (Operationalized)

From `lic-design-system/references/adoption-prompt.md`, the following are mandatory for this lane:

- Backlog normalization for LIC impact categories.
- Issue creation for remaining LIC migration work.
- Blocked placeholder tickets for TBD PRD/screen-driven flow redesigns.
- Traceable mapping from existing backlog items to new LIC-aligned execution items.

## Phase-0 Deliverables

- Canonical precedence lock in this document.
- Guardrail script: `pnpm ui:contract:check`.
- CI gate integration in `.github/workflows/ui-regression-rollout-gates.yml`.
- PRD/screen backlog planning docs and task scaffolding.

## Temporary Exceptions

None. New UI code must follow this precedence contract immediately.

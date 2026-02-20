# Prompt Canonical Sources

This file defines prompt/instruction precedence for this repository.

## Canonical Order

1. `Prompt-Context`
2. `docs/WORKING_CONTRACT.md`
3. `docs/SESSION_HANDOFF.md`
4. `docs/UI_CANONICAL_PRECEDENCE.md` (UI/interaction conflict resolver)
5. `lic-design-system/references/` for UI/interaction work:
   - `interaction-and-ai.md`
   - `ui-kit.md`
   - `design-tokens.md`
   - `source-map.md` (traceability only)
6. `AGENTS.md` / `agents.md` (must remain identical and aligned with items 4-5 for UI values)
7. `README.md` (New Chat Bootstrap + backlog operations)

## Non-Canonical / Archive Inputs

These files are historical references and must not override canonical sources:

- `brand/Brandguide.md`
- `brand/Brandguideprompt.md`
- `uirefactorprompt.md`
- `brand/Brand Identity Document*/src/app/components/Layout.tsx` and manual-app routing shell files (designer-documentation UX only)

Use them only for legacy context or migration notes.

## Conflict Rule

If guidance conflicts, follow the highest item in the canonical order above and capture the decision in `docs/SESSION_HANDOFF.md`.
For UI token/interaction conflicts specifically, `docs/UI_CANONICAL_PRECEDENCE.md` and `lic-design-system/references/*` take precedence and `AGENTS.md` / `agents.md` must be updated to match.

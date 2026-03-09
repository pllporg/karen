# Prompt Canonical Sources

This file defines prompt/instruction precedence for this repository.

## Canonical Order

1. `Prompt-Context`
2. `WORKFLOW.md` (Symphony runtime policy and agent execution contract)
3. `docs/OPERATIONS_PLAYBOOK.md` (operational execution authority)
4. `docs/WORKING_CONTRACT.md`
5. `docs/SESSION_HANDOFF.md`
6. `docs/UI_CANONICAL_PRECEDENCE.md` (UI/interaction conflict resolver)
7. `lic-design-system/references/` for UI/interaction work:
   - `interaction-and-ai.md`
   - `ui-kit.md`
   - `design-tokens.md`
   - `source-map.md` (traceability only)
8. `AGENTS.md` / `agents.md` (must remain aligned with items 6-7 for UI values)
9. `README.md` (setup + quick command index)

## Non-Canonical / Archive Inputs

These files are historical references and must not override canonical sources:

- `brand/Brandguide.md`
- `brand/Brandguideprompt.md`
- `uirefactorprompt.md`
- `brand/Brand Identity Document*/src/app/components/Layout.tsx` and manual-app routing shell files (designer-documentation UX only)
- `docs/RC1_PARALLEL_DELIVERY_PLAYBOOK.md` (archived)
- `docs/codex-cloud/*` (archived lane packets)

Use them only for legacy context or migration notes.

## Conflict Rule

If guidance conflicts, follow the highest item in the canonical order above and capture the decision in `docs/SESSION_HANDOFF.md`.
For UI token/interaction conflicts specifically, `docs/UI_CANONICAL_PRECEDENCE.md` and `lic-design-system/references/*` take precedence.

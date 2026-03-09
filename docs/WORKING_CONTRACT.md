# LIC Legal Suite Working Contract

This document defines invariants and decision rules.
Operational procedures live in `docs/OPERATIONS_PLAYBOOK.md`.

## Canonical Sources

1. Linear is canonical for backlog status and verification evidence.
2. GitHub issues are mirrors only.
3. `tools/backlog-sync/requirements.matrix.json` is the in-repo parity baseline.
4. UI conflict precedence is defined in `docs/UI_CANONICAL_PRECEDENCE.md`.
5. Prompt/instruction precedence is defined in `docs/PROMPT_CANONICAL_SOURCES.md`.

## Collaboration Rules

1. One local orchestrator chat owns Linear status changes at a time.
2. Symphony runs implement code/tests against issue-scoped workspaces defined by `WORKFLOW.md`.
3. If multiple local chats are active, only one chat runs `pnpm ops:housekeeping`.
4. Symphony execution does not replace backlog governance; Linear status/evidence updates remain an operator responsibility.

## Phase/Queue Rules

1. Phase status authority is `docs/ACTIVE_PHASES.md`.
2. If matrix differs from Linear, Linear is canonical unless phase is explicitly marked `draft-local`.
3. EVE-2 is currently an active mirrored queue; implementation can proceed by requirement priority.

## Required Evidence Discipline

Any issue moved to `In Progress` or later must include:
1. Requirement ID.
2. Acceptance criteria reference.
3. Verification evidence.
4. Validation command results.

UI-affecting issues must also include:
1. `docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md` sign-off.
2. PRD/screen-spec linkage from `docs/UI_PRD_SCREEN_BACKLOG.md`.
3. Regression evidence (`pnpm test:ui-regression`).

## Conflict Recording Rule

If operational conflicts cannot be immediately resolved, record them in `docs/SESSION_HANDOFF.md` under `Open Operational Conflicts`.

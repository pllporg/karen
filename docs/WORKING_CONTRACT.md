# LIC Legal Suite Working Contract

This contract defines how implementation sessions are executed to preserve parity progress and context continuity.

## Canonical Source of Truth

1. Linear is canonical for task status, acceptance criteria, and verification evidence.
2. GitHub issues are a mirror for visibility and code linkage only.
3. `tools/backlog-sync/requirements.matrix.json` is the versioned parity baseline in-repo.
4. For UI/interaction work, `docs/UI_CANONICAL_PRECEDENCE.md` defines canonical precedence and overrides conflicting legacy UI setup/docs.
5. UI component/state behavior must map to `lic-design-system/references/ui-kit.md`.
6. `lic-design-system/references/marketing-site.md` is excluded from product app parity work.
7. Prompt/instruction precedence is defined in `docs/PROMPT_CANONICAL_SOURCES.md`.
8. Decision lock (2026-02-20): keep transitional compatibility identifiers until `KAR-76` completes; keep typography split (`Sans Condensed` headings, `Mono` metadata/tables, `Sans` body).
9. Standards-manual boundary: `brand/Brand Identity Document*/src/app/components/Layout.tsx` and manual routing shell are designer documentation UX and must not be copied into product route IA/copy.

## Iterative Slice Protocol

For every requirement slice:

1. Select next item by phase/status/risk policy (`phase-1` before `phase-2`, then `Missing` before `Partial`, then `High` risk first).
2. Implement minimal complete change set for that slice.
3. Validate with required checks:
   - targeted tests
   - `pnpm test`
   - `pnpm build`
4. Update Linear issue:
   - state (`In Progress`/`In Review`/`Done`)
   - verification evidence block
   - requirement traceability
5. Sync and verify mirrors:
   - `pnpm backlog:sync`
   - `pnpm backlog:verify`
6. Refresh machine snapshot:
   - `pnpm backlog:snapshot`
7. Update `docs/SESSION_HANDOFF.md` snapshot timestamp + delta note.

## Dirty Working Tree Policy

Dirty tree is permitted, but every session must:

1. Inspect and log current status first:
   - `git status --short --branch`
2. Avoid reverting unrelated existing edits.
3. Explicitly call out if current slice intersects unknown local changes.

## Required Evidence Discipline

Any issue moved to `In Progress` or later must contain:

1. Requirement ID
2. Acceptance criteria reference
3. Verification evidence (`## Verification Evidence`)
4. Test/build command results

UI-affecting issues must also include:

1. Explicit checklist sign-off against `docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md`
2. Any LIC reference exceptions plus follow-up ticket
3. Regression gate evidence (`pnpm test:ui-regression`) and screenshot references in PR template UI sections.
4. PRD/screen-spec linkage from `docs/UI_PRD_SCREEN_BACKLOG.md` (or explicit `Blocked by PRD/Screens` notation).

## Bootstrap Check Command

Use this before planning or coding in a new chat:

```bash
pnpm backlog:bootstrap:check
```

This runs:

- `pnpm backlog:verify`
- `pnpm backlog:matrix:check`
- `pnpm backlog:snapshot`

## Stale Snapshot Fallback

If handoff timestamp does not match snapshot timestamp:

1. Trust Linear state first.
2. Regenerate snapshot (`pnpm backlog:snapshot`).
3. Update `docs/SESSION_HANDOFF.md` timestamp and delta note.
4. Continue planning/implementation only after consistency is restored.

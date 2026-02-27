# Operations Playbook

This is the canonical operations manual for LIC Legal Suite collaboration.

If any procedural guidance conflicts with other docs, this file wins.

## 1) Collaboration Model

### Local Orchestrator

Owns operational control and backlog state.

Responsibilities:
1. Select active requirement slices.
2. Maintain Linear status/evidence.
3. Run housekeeping/sync commands.
4. Resolve cross-lane conflicts and merge sequence.

### Codex Cloud Lanes

Own implementation execution only.

Responsibilities:
1. Implement scoped changes on assigned branch.
2. Run lane validations.
3. Open PR with required evidence.
4. Return standardized cloud report.

Restrictions:
1. Cloud lanes do not update Linear directly.
2. Cloud lanes do not run backlog mirror/snapshot commands.

## 2) Start-of-Session Preflight

Run before planning/coding in any chat:

```bash
pnpm ops:preflight
```

`ops:preflight` checks:
1. Branch + dirty tree summary.
2. Canonical control file drift:
   - `tools/backlog-sync/requirements.matrix.json`
   - `tools/backlog-sync/session.snapshot.json`
   - `docs/SESSION_HANDOFF.md`
   - `docs/WORKING_CONTRACT.md`
   - `README.md`
3. Required token presence (names only, never values).
4. `pnpm backlog:verify` pass/fail.
5. `pnpm backlog:matrix:check` (only if verify succeeds).
6. `pnpm backlog:handoff:check` pass/fail.
7. Artifact output to `artifacts/ops/operator-preflight.json`.

Preflight pass criteria:
1. No canonical-control-file drift.
2. `backlog:verify` succeeds.
3. `backlog:matrix:check` succeeds.
4. `backlog:handoff:check` succeeds.

## 3) In-Session Housekeeping Cadence

Run after major state changes and before handoff:

```bash
pnpm ops:housekeeping
```

Alias expands to:

```bash
pnpm backlog:sync && pnpm backlog:verify && pnpm backlog:matrix:check && pnpm backlog:snapshot && pnpm backlog:handoff:refresh && pnpm backlog:handoff:check
```

Notes:
1. `pnpm rc1:orchestrator:post-merge` is retained as a legacy alias for RC-1 history.
2. Use `ops:housekeeping` for current/general operations.

## 4) Merge/Post-Merge Housekeeping

After every merged PR:
1. Pull latest `main`.
2. Run `pnpm ops:housekeeping`.
3. Confirm `git status --short --branch` is clean.
4. Record any operational conflicts in `docs/SESSION_HANDOFF.md` under `Open Operational Conflicts`.

## 5) Failure Mode Handling

### Linear token invalid (`Entity not found: ApiKey`)
1. Rotate/fix `LINEAR_API_TOKEN` in `tools/backlog-sync/config.env` or shell.
2. Re-run `pnpm backlog:verify`.
3. Only after verify passes, run full `pnpm ops:housekeeping`.

### Mirror drift (`missing/orphan`)
1. Run `pnpm backlog:sync`.
2. Re-run `pnpm backlog:verify`.
3. If still failing, treat Linear as canonical and open an ops incident ticket.

### Dirty tree collisions
1. Do not revert unknown edits.
2. Isolate branch owner and file-owner scope.
3. Rebase lane branches and resolve only owned conflict paths.

### Actions unavailable
1. Use local gate fallback:
   - `pnpm ops:preflight`
   - `pnpm test`
   - `pnpm build`
2. Record failure reason in PR and handoff.

## 6) Required Cloud Report Contract

Each cloud lane must return:
1. Branch.
2. Commit SHA.
3. PR URL.
4. Requirement IDs.
5. Files changed.
6. Validation commands and pass/fail.
7. Known risks/follow-ups.
8. Ready-to-merge decision.

Template: `docs/templates/CODEX_CLOUD_REPORT_TEMPLATE.md`

## 7) Operator Lock + Concurrency Policy

1. One orchestrator chat owns Linear state updates at a time.
2. Cloud lanes never mutate Linear.
3. If multiple local chats exist, only one chat runs `ops:housekeeping`.

Conflict resolution:
1. If snapshots diverge, latest successful `pnpm backlog:verify` wins.
2. If matrix differs from Linear, Linear is canonical except explicitly documented queued-local mode.
3. Unresolved conflicts must be logged in `docs/SESSION_HANDOFF.md`.

## 8) Do Not List

1. Do not edit GitHub mirror issue status as source-of-truth.
2. Do not skip `ops:preflight` before starting work.
3. Do not force-merge silently.
4. Do not run destructive git commands to clean drift.
5. Do not print tokens/secrets in logs, comments, or docs.

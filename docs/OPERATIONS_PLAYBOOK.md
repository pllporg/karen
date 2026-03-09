# Operations Playbook

This is the canonical operations manual for LIC Legal Suite collaboration.

If any procedural guidance conflicts with other docs, this file wins.

## 1) Collaboration Model

### Symphony Service

Owns issue polling and execution orchestration.

Responsibilities:
1. Poll Linear and select eligible issues from configured active states.
2. Create isolated per-issue workspaces.
3. Run coding-agent sessions using repository `WORKFLOW.md`.
4. Produce run outputs and structured run reports for review.

Restrictions:
1. Symphony is execution orchestration, not backlog governance.
2. Linear canonical status/evidence discipline is still enforced by local operators.

### Local Operator

Responsibilities:
1. Maintain `WORKFLOW.md` policy and environment wiring.
2. Review Symphony outputs, open/merge PRs, and resolve conflicts.
3. Maintain Linear state/evidence as source of truth.
4. Run housekeeping/sync commands after merges.

Restrictions:
1. Do not bypass Symphony workflow policy for issue execution unless incident response requires manual override.
2. Do not treat GitHub mirror state as canonical backlog state.

## 2) Start-of-Session Preflight

Run before planning/coding in any chat or starting Symphony:

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
8. (Manual) confirm Symphony runtime env vars are set:
   - `LINEAR_API_KEY`
   - `LINEAR_PROJECT_SLUG`
   - `SOURCE_REPO_URL`
   - `SYMPHONY_WORKSPACE_ROOT`

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

## 4) Symphony Runtime

Symphony reference implementation:

1. `git clone https://github.com/openai/symphony`
2. `cd symphony/elixir`
3. `mise trust && mise install`
4. `mise exec -- mix setup && mise exec -- mix build`
5. Start service with this repo's workflow file:

```bash
LINEAR_API_KEY=... \
LINEAR_PROJECT_SLUG=... \
SOURCE_REPO_URL=https://github.com/pllporg/karen.git \
SYMPHONY_WORKSPACE_ROOT=~/symphony-workspaces/lic-legal-suite \
mise exec -- ./bin/symphony /Users/chrispodlaski/Downloads/Karen/WORKFLOW.md
```

Notes:
1. `WORKFLOW.md` is the repo-owned policy contract for Symphony.
2. Symphony writes and issue-state transitions can be agent-driven; local operator still verifies evidence and merge readiness.

## 5) Merge/Post-Merge Housekeeping

After every merged PR:
1. Pull latest `main`.
2. Run `pnpm ops:housekeeping`.
3. Confirm `git status --short --branch` is clean.
4. Record any operational conflicts in `docs/SESSION_HANDOFF.md` under `Open Operational Conflicts`.

## 6) Failure Mode Handling

### Linear token invalid (`Entity not found: ApiKey`)
1. Rotate/fix `LINEAR_API_TOKEN` in `tools/backlog-sync/config.env` or shell.
2. Re-run `pnpm backlog:verify`.
3. Only after verify passes, run full `pnpm ops:housekeeping`.

### Symphony tracker token invalid (`401` / `forbidden`)
1. Rotate/fix `LINEAR_API_KEY` in your Symphony runtime environment.
2. Confirm `LINEAR_PROJECT_SLUG` is correct for this workspace.
3. Restart Symphony with `/Users/chrispodlaski/Downloads/Karen/WORKFLOW.md`.

### Mirror drift (`missing/orphan`)
1. Run `pnpm backlog:sync`.
2. Re-run `pnpm backlog:verify`.
3. If still failing, treat Linear as canonical and open an ops incident ticket.

### Dirty tree collisions
1. Do not revert unknown edits.
2. Isolate issue owner and file-owner scope.
3. Rebase issue branches and resolve only owned conflict paths.

### Actions unavailable
1. Use local gate fallback:
   - `pnpm ops:preflight`
   - `pnpm test`
   - `pnpm build`
2. Record failure reason in PR and handoff.

## 7) Required Symphony Run Report Contract

Each Symphony issue run must return:
1. Branch.
2. Commit SHA.
3. PR URL.
4. Requirement IDs.
5. Files changed.
6. Validation commands and pass/fail.
7. Known risks/follow-ups.
8. Ready-to-merge decision.

Template: `docs/templates/SYMPHONY_RUN_REPORT_TEMPLATE.md`

## 8) Operator Lock + Concurrency Policy

1. One orchestrator chat owns Linear state updates at a time.
2. Symphony execution does not supersede Linear canonical governance.
3. If multiple local chats exist, only one chat runs `ops:housekeeping`.

Conflict resolution:
1. If snapshots diverge, latest successful `pnpm backlog:verify` wins.
2. If matrix differs from Linear, Linear is canonical except explicitly documented queued-local mode.
3. Unresolved conflicts must be logged in `docs/SESSION_HANDOFF.md`.

## 9) Do Not List

1. Do not edit GitHub mirror issue status as source-of-truth.
2. Do not skip `ops:preflight` before starting work.
3. Do not force-merge silently.
4. Do not run destructive git commands to clean drift.
5. Do not print tokens/secrets in logs, comments, or docs.

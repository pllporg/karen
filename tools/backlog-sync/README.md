# Backlog Sync Toolkit (Linear -> GitHub)

This toolkit sets up and operates a persistent parity backlog where:

- Linear is canonical.
- GitHub Issues are an automated mirror.

## Scripts

- `bootstrap_github_repo.mjs`
  - Initializes local git (if needed), creates org repo, pushes `main`, and applies branch protection.
- `setup_linear_workspace.mjs`
  - Ensures parity project/labels/workflow states in Linear.
- `seed_parity_backlog.mjs`
  - Seeds epics/tasks from `requirements.matrix.json`.
- `linear_to_github.mjs`
  - Mirrors scoped Linear issues into GitHub issues (idempotent by `Linear-ID` marker).
- `verify_backlog_sync.mjs`
  - Verifies mirror counts, traceability markers, and requirement IDs.
  - Writes `tools/backlog-sync/state/verify.last.json` on successful verification.
- `backlog_snapshot.mjs`
  - Generates `session.snapshot.json` with priority, status, and continuity metadata.
- `check_handoff_freshness.mjs`
  - Validates handoff freshness against snapshot timestamp and Linear evidence discipline.

## Required Environment Variables

### Linear

- `LINEAR_API_TOKEN`
- `LINEAR_TEAM_KEY` (default: `KAR`)
- `LINEAR_PROJECT_NAME` (default: `Prompt Parity - Karen Legal Suite`)
- `LINEAR_SCOPE_LABEL` (default: `parity`)
- `SNAPSHOT_TOP_N` (default: `10`)
- `SNAPSHOT_RECENT_ISSUES` (default: `10`)

### GitHub

- `GITHUB_TOKEN`
- `GITHUB_OWNER`
- `GITHUB_REPO`

### Bootstrap-only

- `GITHUB_ORG`
- `GITHUB_REPO`
- Optional:
  - `GITHUB_REPO_VISIBILITY` (`private`/`public`)
  - `GITHUB_DEFAULT_BRANCH` (default `main`)
  - `GIT_USER_NAME`
  - `GIT_USER_EMAIL`
  - `PUSH_ON_BOOTSTRAP` (`true`/`false`)

## Typical Run Order

1. `pnpm backlog:linear:setup`
2. `pnpm backlog:seed`
3. `pnpm backlog:sync`
4. `pnpm backlog:verify`
5. `pnpm backlog:snapshot`

Bootstrap check shortcut:

- `pnpm backlog:bootstrap:check`
  - Runs `pnpm backlog:verify && pnpm backlog:snapshot`

## GitHub Repository Variables/Secrets

Set these before enabling workflows:

- GitHub Secret: `LINEAR_API_TOKEN`
- GitHub Variable: `LINEAR_TEAM_KEY` (example: `KAR`)
- GitHub Variable: `LINEAR_PROJECT_NAME` (example: `Prompt Parity - Karen Legal Suite`)
- GitHub Variable: `LINEAR_SCOPE_LABEL` (example: `parity`)

## Dry Run

For scripts that support dry-run:

```bash
DRY_RUN=true node tools/backlog-sync/seed_parity_backlog.mjs
DRY_RUN=true node tools/backlog-sync/linear_to_github.mjs
```

## Notes

- Mirror matching is idempotent using `Linear-ID` in GitHub issue body.
- GitHub issue comments are preserved (the script only updates issue metadata/body).
- `requirements.matrix.json` is the persistent, versioned baseline of parity work.
- `linear_issue_template.md` defines required fields/sections for manual parity issues.
- `session.snapshot.json` is generated and intended to be read first in new chats.

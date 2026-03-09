# Backlog Sync Toolkit (Linear -> GitHub)

This toolkit operates a persistent parity backlog where:

- Linear is canonical.
- GitHub issues are automated mirrors.

## Scripts

- `bootstrap_github_repo.mjs`
  - Initializes local git (if needed), creates org repo, pushes `main`, and applies branch protection.
- `setup_linear_workspace.mjs`
  - Ensures parity project/labels/workflow states in Linear.
- `seed_parity_backlog.mjs`
  - Seeds epics/tasks from `requirements.matrix.json`.
- `linear_to_github.mjs`
  - Mirrors scoped Linear issues into GitHub issues (idempotent by `Linear-ID` marker).
- `sync_ui_refactor_backlog.mjs`
  - Normalizes UI refactor issues (`KAR-54`..`KAR-60`) to the LIC canonical contract.
- `verify_backlog_sync.mjs`
  - Verifies mirror counts, traceability markers, and requirement IDs.
  - Writes `tools/backlog-sync/state/verify.last.json` on successful verification.
- `check_matrix_linear_alignment.mjs`
  - Verifies matrix <-> open Linear requirement alignment.
- `backlog_snapshot.mjs`
  - Generates `session.snapshot.json` with priority/status/continuity metadata.
- `check_handoff_freshness.mjs`
  - Validates handoff freshness against snapshot + evidence discipline.
- `refresh_handoff_from_snapshot.mjs`
  - Updates `docs/SESSION_HANDOFF.md` timestamps from `session.snapshot.json`.

## Environment Loading Precedence

Backlog scripts preload env files in this order:

1. `tools/backlog-sync/config.env` (preferred, local-only, gitignored)
2. `.env` (repo root)
3. Existing shell env vars always take precedence if already set

Recommended setup:

```bash
cp tools/backlog-sync/config.example.env tools/backlog-sync/config.env
```

## Required Environment Variables

### Linear

- `LINEAR_API_TOKEN`
- `LINEAR_TEAM_KEY` (default: `KAR`)
- `LINEAR_PROJECT_NAME` (default: `Prompt Parity - LIC Legal Suite`)
- `LINEAR_SCOPE_LABEL` (default: `parity`)

### GitHub

- `GITHUB_TOKEN`
- `GITHUB_OWNER`
- `GITHUB_REPO`

### Symphony (execution orchestration)

- `LINEAR_API_KEY` (Symphony tracker API auth)
- `SOURCE_REPO_URL` (repo clone URL used by `WORKFLOW.md` hooks)
- `SYMPHONY_WORKSPACE_ROOT` (root directory for issue workspaces)

Note:
- `WORKFLOW.md` currently stores `tracker.project_slug` directly as the Linear project `slugId`.

## Typical Run Order

1. `pnpm backlog:linear:setup`
2. `pnpm backlog:seed`
3. `pnpm backlog:sync`
4. `pnpm backlog:verify`
5. `pnpm backlog:matrix:check`
6. `pnpm backlog:snapshot`
7. `pnpm backlog:handoff:refresh`
8. `pnpm backlog:handoff:check`

Shortcuts:

- `pnpm backlog:bootstrap:check`
- `pnpm ops:housekeeping`

## Linear Auth Troubleshooting

If commands fail with:

- `Entity not found: ApiKey`

Do this:

1. Rotate/reissue Linear API token in Linear settings.
2. Update `LINEAR_API_TOKEN` in `tools/backlog-sync/config.env`.
3. Re-run:

```bash
pnpm backlog:verify
```

4. Only after verify succeeds, run full housekeeping:

```bash
pnpm ops:housekeeping
```

## Notes

- Mirror matching is idempotent using `Linear-ID` marker in issue body.
- GitHub issue comments are preserved.
- `requirements.matrix.json` is the versioned parity baseline.
- `session.snapshot.json` is intended to be read first in new chats.
- UI-affecting items must follow LIC canonical references and checklist evidence.

# Symphony Adoption Guide

This repository now uses a Symphony-first execution model.

Canonical governance remains:
1. Linear is source of truth.
2. GitHub issues are mirrors.
3. Backlog housekeeping stays local (`pnpm ops:housekeeping`).

## 1) Required Environment

For Symphony runtime:
1. `LINEAR_API_KEY`
2. `SOURCE_REPO_URL`
3. `SYMPHONY_WORKSPACE_ROOT`

Note:
1. `tracker.project_slug` is set directly in `WORKFLOW.md` (Linear `slugId`).
2. Current Symphony Elixir runtime does not resolve env vars for `project_slug`.

For backlog governance scripts:
1. `LINEAR_API_TOKEN`
2. `GITHUB_TOKEN`
3. `GITHUB_OWNER`
4. `GITHUB_REPO`

## 2) Workflow Contract

Symphony reads repository `WORKFLOW.md`.

This file defines:
1. Tracker config and active/terminal states.
2. Workspace lifecycle hooks.
3. Agent runtime settings.
4. Prompt contract for issue execution and report output.

## 3) Start Symphony (Elixir Reference)

```bash
git clone https://github.com/openai/symphony
cd symphony/elixir
mise trust
mise install
mise exec -- mix setup
mise exec -- mix build

LINEAR_API_KEY=... \
SOURCE_REPO_URL=https://github.com/pllporg/karen.git \
SYMPHONY_WORKSPACE_ROOT=~/symphony-workspaces/lic-legal-suite \
mise exec -- ./bin/symphony --i-understand-that-this-will-be-running-without-the-usual-guardrails /Users/chrispodlaski/Downloads/Karen/WORKFLOW.md
```

## 4) Operator Workflow

1. Run `pnpm ops:preflight`.
2. Start Symphony.
3. Review run reports and PRs.
4. Merge as green.
5. Run `pnpm ops:housekeeping`.

## 5) Run Report Contract

Use:
`docs/templates/SYMPHONY_RUN_REPORT_TEMPLATE.md`

## 6) Legacy Artifacts

`docs/codex-cloud/*` and `docs/templates/CODEX_CLOUD_REPORT_TEMPLATE.md` are retained as historical references only.

---
tracker:
  kind: linear
  api_key: $LINEAR_API_KEY
  project_slug: "8e8ac869bf3c"
  active_states:
    - Backlog
    - Ready
    - In Progress
    - Blocked
    - In Review
    - Rework
    - Human Review
    - Merging
  terminal_states:
    - Done
    - Closed
    - Cancelled
    - Canceled
    - Duplicate
workspace:
  root: $SYMPHONY_WORKSPACE_ROOT
hooks:
  after_create: |
    git clone "$SOURCE_REPO_URL" .
    pnpm install --frozen-lockfile
agent:
  max_concurrent_agents: 4
  max_turns: 20
codex:
  command: codex app-server
  thread_sandbox: workspace-write
---

You are implementing one Linear issue for LIC Legal Suite.

Issue:
- Identifier: {{ issue.identifier }}
- Title: {{ issue.title }}
- Description: {{ issue.description }}

Execution contract:
1. Follow repository instructions in `AGENTS.md`.
2. Follow operations guidance in `docs/OPERATIONS_PLAYBOOK.md` and invariants in `docs/WORKING_CONTRACT.md`.
3. Keep Linear canonical and GitHub mirror-only. Do not treat mirrored GitHub issue state as source of truth.
4. Keep changes scoped to this issue. Do not include unrelated refactors.
5. Use small, reviewable commits and preserve existing behavior unless the issue requires behavior changes.
6. Run applicable validations before handoff:
   - API lanes: `pnpm --filter api test`
   - Web lanes: `pnpm --filter web test && pnpm --filter web build`
   - Full lane fallback: `pnpm test && pnpm build`
7. Return a structured run report using `docs/templates/SYMPHONY_RUN_REPORT_TEMPLATE.md`.

UI constraints:
1. Follow LIC design system constraints in `AGENTS.md`.
2. Preserve existing product IA and do not copy standards-manual shell/nav language.

Completion criteria:
1. Code compiles and tests pass for touched scope.
2. Files changed are listed explicitly in the run report.
3. Known risks are called out explicitly.

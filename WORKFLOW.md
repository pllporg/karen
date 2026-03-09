---
tracker:
  kind: linear
  api_key: $LINEAR_API_KEY
  project_slug: "8e8ac869bf3c"
  assignee: "christopher.podlaski@gmail.com"
  active_states:
    - Ready
    - In Progress
    - Rework
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
    gh auth status -h github.com >/dev/null 2>&1
    git config user.name >/dev/null 2>&1 || git config user.name "Symphony Agent"
    git config user.email >/dev/null 2>&1 || git config user.email "symphony@local.invalid"
    pnpm install --frozen-lockfile
agent:
  max_concurrent_agents: 10
  max_turns: 20
codex:
  command: codex app-server
  approval_policy: never
  thread_sandbox: danger-full-access
  turn_sandbox_policy:
    type: dangerFullAccess
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
7. Handoff is not complete until source-control packaging is done in the issue workspace:
   - create a branch named `lin/<LINEAR_KEY>-<slug>`
   - commit scoped changes
   - push the branch to `origin`
   - open a GitHub PR targeting `main`
8. PR metadata must satisfy repo policy:
   - PR title format: `[<LINEAR_KEY>] <concise title>`
   - PR body must include the sections required by `.github/pull_request_template.md`
   - UI-touching PRs must include `## UI Interaction Checklist`, `## Screenshot Evidence`, and explicit `No console errors` evidence
9. Return a structured run report using `docs/templates/SYMPHONY_RUN_REPORT_TEMPLATE.md` and include the real PR URL.
10. If branch creation, commit, push, or PR creation fails, do not present the issue as review-ready. Return a blocked handoff report with the exact failing step and keep the lane in a non-review-ready state.

UI constraints:
1. Follow LIC design system constraints in `AGENTS.md`.
2. Preserve existing product IA and do not copy standards-manual shell/nav language.

Completion criteria:
1. Code compiles and tests pass for touched scope.
2. Files changed are listed explicitly in the run report.
3. Known risks are called out explicitly.
4. A real GitHub PR exists for operator review.
5. Do not merge or land the PR; operator review/merge remains human-controlled.
6. Artifact bundles, patch files, or local workspace changes alone are not sufficient for review-ready handoff.

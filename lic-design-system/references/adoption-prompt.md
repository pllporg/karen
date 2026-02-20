# Codex Adoption Prompt Templates

Use these prompts in the target repository after copying this skill folder.

## One-Shot Adoption Prompt

```text
Use the lic-design-system skill in this repo.

Goal: retrofit the entire product to the LIC design system, align the base UI to GP-01 patterns, and operationalize the redesign work through backlog updates and issue tracking.

Do this:
1. Audit the current UI stack and shared component layer.
2. Install LIC design tokens (color, typography, spacing, borders) and wire them into global styles/theme.
3. Refactor base primitives (button, input, select, textarea, badge, card, table, modal, alert, toast, tabs, pagination) to match the LIC UI kit rules.
4. Apply LIC interaction doctrine (focus, loading, validation, confirmation, accessibility, anti-pattern removal).
5. For AI surfaces, apply LIC command-surface + provenance rules.
6. Update the app identity everywhere to LIC:
   - App/product name
   - Title/meta/app-shell labels
   - Primary logo/wordmark references (replace with LIC logo/mark usage)
7. Update the base application UI to mirror GP-01 standards and patterns:
   - Layout shell
   - Navigation
   - Table/list density and hierarchy
   - Form and workflow scaffolding
8. Review the existing backlog (repo docs/issues/todos/project boards) and update backlog items to be LIC-design-system aligned.
9. Create issue tickets for remaining work:
   - GitHub issues and Linear issues for additional required changes not completed in this pass
   - Include scope, acceptance criteria, dependencies, and priority
10. Create issue tickets for redesign of all user flows tied to TBD PRDs and screen designs that will be provided later:
    - Create one umbrella epic + child tickets per flow
    - Mark as blocked by PRD/screens where applicable
11. Return:
    - Files changed
    - Backlog items updated
    - Issues/tickets created (with links or IDs)
    - Remaining gaps and recommended sequencing

Constraints:
- Keep corners square by default.
- Do not introduce colors outside LIC tokens.
- Avoid decorative motion and startup-style visual language.
- Preserve or improve accessibility while refactoring.
- Do not silently skip backlog/issue work; if direct API/CLI access is unavailable, generate ready-to-paste issue drafts in markdown.
```

## Incremental Adoption Prompt

```text
Use the lic-design-system skill.

Phase 1 only:
1. Set up global LIC tokens, typography, and layout primitives.
2. Rename app identity and logo references to LIC.
3. Propose a GP-01 baseline migration plan for base UI.
4. Audit and annotate the existing backlog with LIC alignment tags.
5. Draft GitHub + Linear tickets for phase 2 and phase 3.

Then output:
- exact component files to tackle in phase 2
- backlog items updated
- ticket drafts/links for remaining work
```

## Compliance Review Prompt

```text
Use the lic-design-system skill to run a compliance review only.
Do not redesign yet.
Identify violations against tokens, component rules, interaction doctrine, and AI interaction standards.
Prioritize findings by severity and include file references.
Also:
1. Review existing backlog items and flag which violate LIC standards.
2. Create GitHub/Linear remediation tickets (or markdown-ready drafts) for all non-trivial gaps.
3. Create blocked redesign tickets for upcoming user flows tied to TBD PRDs/screen designs.
```

## Backlog + Ticketing Prompt

```text
Use the lic-design-system skill.

Task: backlog normalization and issue creation only (minimal code changes).

Do this:
1. Audit all existing backlog sources (GitHub issues/projects, Linear, TODO/FIXME, planning docs).
2. Reclassify items by LIC design-system impact:
   - Tokens/theme
   - Base UI/GP-01 alignment
   - Interaction + accessibility
   - AI interface doctrine
   - Marketing standards
3. Update backlog item titles/descriptions/acceptance criteria to LIC standards language.
4. Create missing issues in GitHub and Linear for:
   - app rename + logo to LIC
   - base UI migration to GP-01
   - remaining design-system violations
   - redesign of all user flows for TBD PRDs/screens (blocked placeholders)
5. Return a traceable mapping table:
   - original backlog item
   - updated item
   - new issue IDs/links
   - status and owner recommendation
```

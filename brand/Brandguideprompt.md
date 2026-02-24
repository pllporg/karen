> Legacy prompt artifact. Not canonical. Use `docs/PROMPT_CANONICAL_SOURCES.md`.

You are acting as a Senior Product Designer + Design Systems Lead + Frontend Engineer.

PRIMARY INPUT (source of truth):
- LIC Brand Guide / Design System: <PATH_IN_REPO_TO_BRAND_GUIDE_MD>
  (Example: ./Brandguide.md or ./docs/Brandguide.md)

Goal:
Audit this repo’s current UI/UX and produce a detailed, actionable plan to refactor the UX and migrate the UI to the LIC brand + design system described in the brand guide.

Hard constraints (non-negotiable; from the brand guide):
- Tone: procedural, matte, conservative, reductive. “Quiet confidence.”
- Principles: systems/documentation/rules/auditability over decoration/delight.
- Visual rules: NO shadows, NO gradients, NO rounded corners (radius = 0), NO glassmorphism.
- Layout: 8pt grid everywhere; structure comes from borders/rules.
- Tables and lists are first-class UI (prefer tables over “card grids” for density).
- Color ratio: Paper ~70% / Ink ~25% / Accent blue ~5%. Red is rare.
- Typography: IBM Plex Sans (UI/body), IBM Plex Sans Condensed (uppercase + 0.06em tracking for headlines), IBM Plex Mono (metadata/audit trails; often uppercase).
- Interaction/workflow rules:
  - Review gates: PROPOSED -> IN REVIEW -> APPROVED -> EXECUTED -> RETURNED
  - No hidden auto-send. Any client-facing send/file/export requires explicit approval.
  - Audit trail everywhere (who/what/when + link to version/diff/log).
  - Prefer right-side drawers for reviews; modals only for destructive confirmations/critical approvals.
  - Microcopy: verbs; dry/logged tone; avoid “AI hype” words (“magic”, “autofix”, “AI suggests”, etc).

Operating rules for THIS TASK:
1) Do NOT implement the refactor yet. Do not modify or create any source files.
2) You MAY read files and run safe commands to understand the app (typecheck, lint, tests, start dev server).
3) If you run any commands, list them and summarize outputs you relied on.
4) If something is missing (tokens integration method, breakpoints, a11y targets, analytics/traffic), make reasonable assumptions but clearly label them and list questions at the end.

What to do (do this in order):

A) Repo discovery & UI architecture
- Identify the tech stack (framework, routing, state mgmt, styling system: Tailwind/CSS modules/CSS-in-JS/etc).
- Locate routes/pages/screens and list them.
- Inventory current UI building blocks: buttons, inputs, selects, tables, badges/status chips, modals/drawers, toasts, nav, layout grid, typography usage.
- Identify where theming/tokens currently live (CSS variables, Tailwind config, theme provider, global styles).

B) UX audit (current state)
Pick the top flows you infer from the app OR (if unclear) the top 8 screens/routes by centrality.
For each flow/screen:
- Describe the user intent (what they’re trying to accomplish).
- List friction points and inconsistencies (layout density, hierarchy, forms, error states, navigation, copy).
- Identify accessibility issues (keyboard nav, focus-visible, labels, error messaging clarity, contrast).
- Identify responsiveness issues.
- Identify auditability gaps: where a user cannot tell status, owner, timestamps, what changed, or where logs/diffs should exist.

C) LIC alignment analysis (compare to the brand guide)
Read the brand guide carefully and summarize the key implementable rules in your own words.
Then produce:
- A gap analysis: where the current app violates LIC visual rules (radius/shadows/gradients), typography rules, spacing grid, tone/microcopy.
- A “system mapping” table: Current UI pattern/component -> LIC target primitive/component/pattern -> approach (replace / wrap / build) -> effort -> risk.
- Navigation alignment: evaluate if current IA matches the suggested module shell (Queue / Matters / Intake / Evaluation / Drafting / Discovery / Docket / Client Updates / Logs). If different, recommend a low-risk path.

D) Refactor plan (phased, shippable, low-risk)
Propose a phased migration plan that keeps the app usable throughout. Include:
- Phase 0: Prep & guardrails
  - where tokens should live (e.g., styles/lic-tokens.css) and how to apply globally
  - base typography & focus-visible standard
  - lint rules / conventions to prevent reintroducing shadows/radius/gradients
  - optional: Storybook/preview and/or visual regression approach
- Phase 1: Foundations
  - global shell layout + grid + paper background + rule system
  - typography scale usage rules; heading/label conventions
- Phase 2: Primitives
  - Button (primary/secondary/tertiary/danger), Input/Textarea, Select, Badge (statuses), Table, Card (paper blocks), Drawer, Modal, Toast
  - a11y requirements for each
- Phase 3: Workflow patterns
  - Review gate UI standardization (status badges, owners, timestamps, delta summaries)
  - “Next step” engine component requirements
  - Client updates as versioned artifacts with explicit approval + log links
  - Audit trail surfaces (logs, diffs, version history)
- Phase 4: Page-by-page migration
  - prioritize by user impact and dependency order
  - propose a PR sequence (small PRs) with “definition of done” per PR

For EACH phase include:
- Concrete tasks
- Likely file areas impacted (paths)
- Risks + mitigations
- Definition of done + verification steps (manual + automated)
- Rollback strategy (how to minimize risk)

E) Output format (single Markdown report)
Output ONE Markdown document with these sections:

1) Executive summary (what’s broken + what improves under LIC system)
2) Repo stack & UI architecture (with key file paths)
3) Screen/route inventory (table)
4) UX audit findings (group by severity: critical/high/medium/low)
5) LIC brand/design-system rules checklist (as enforceable bullets)
6) Gap analysis vs LIC (visual + interaction + copy)
7) Component/pattern mapping table:
   Columns: Current component/pattern | Where used (routes) | Problem | LIC target | Approach (replace/wrap/build) | Effort (S/M/L) | Risk
8) Phased migration plan (Phase 0–4) + recommended PR sequence
9) Accessibility checklist (tied to specific components/pages)
10) Testing/verification plan (what exists + what to add; unit/integration/e2e/visual)
11) Open questions / missing inputs

Important:
- Start by scanning the repo and listing routes/components BEFORE making recommendations.
- If you can’t run the app, do static analysis and clearly state limitations.
- Use the LIC brand guide as the source of truth and reference its sections/headings when justifying recommendations.

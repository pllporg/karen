TASK: Refactor the web app UI/UX to match the LIC design system (mid-century corporate, procedural, matte, reductive).
You must follow AGENTS.md.

GOALS
1) Introduce a consistent design token layer (colors, type, spacing, borders, focus) and apply it across the app.
2) Replace ad-hoc UI styling with a small set of reusable primitives (Button/Input/Badge/Table/Card/Drawer/Modal/Toast).
3) Normalize interaction patterns for our agentic workflow:
   - review gates: PROPOSED -> IN REVIEW -> APPROVED -> EXECUTED -> RETURNED
   - explicit approvals before any client-facing send
   - audit trail visibility for actions and output versions
4) Reduce "AI-y" copy and replace with procedural corporate microcopy.

SCOPE / CONSTRAINTS
- Do not change backend APIs unless needed for UI correctness.
- No visual fluff: no shadows, gradients, rounded corners.
- Use 8pt spacing grid.
- Tables are preferred for dense lists.
- Keep changes incremental and verifiable.

PROCESS (DO THIS IN ORDER)
A) Repo discovery
   - Identify stack (React/Next/etc), styling method (Tailwind/CSS-in-JS/CSS modules), component libs, routing, and existing UI primitives.
   - Inventory main pages: dashboard, matter view, queue, drafting/review, discovery, client updates, logs.
   - List inconsistencies: colors, spacing, button styles, typography, form patterns, table patterns.

B) Add tokens + global styles
   - Create a single token source (CSS variables preferred).
   - Add base typography, background, rule styles, focus-visible ring.
   - Ensure dark mode does NOT appear unless already present; keep a single "Paper" theme.

C) Build primitives (in /components/ui or existing equivalent)
   - Button (primary/secondary/tertiary/danger)
   - Input/Textarea
   - Select
   - Badge (statuses)
   - Table (header rules, sticky header optional)
   - Card (paper block)
   - Drawer (right-side review)
   - Modal (confirmations)
   - Toast (logged tone)
   Each must be accessible (labels, aria where needed, keyboard navigation, focus-visible).

D) Refactor pages in priority order (one PR-sized step at a time)
   1) Global shell/nav/header
   2) Queue (tables, row actions)
   3) Matter dashboard (next step + timeline + packages)
   4) Draft review (drawer pattern + statuses + approve/return)
   5) Discovery (table inventory + export)
   6) Client updates (versioned artifact + explicit send approval)
   7) Logs (audit table)

E) Interaction + copy updates
   - Replace casual AI copy with procedural text.
   - Add/normalize status badges + timestamps + version IDs.
   - Make "approve" and "send" actions explicit and confirm when client-facing.

VERIFICATION
- Run the repo’s lint, typecheck, and tests (detect scripts in package.json).
- Add minimal tests only where patterns already exist (e.g., component snapshot, RTL, Playwright).
- Ensure no console errors.

OUTPUT FORMAT
1) A short plan (bulleted) and the first batch of changes you will implement.
2) Then implement the changes with code edits.
3) End with: files changed, commands run, and a concise before/after summary.

START WITH STEP A and show me your repo discovery notes before editing files.

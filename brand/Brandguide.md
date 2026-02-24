> Legacy brand guide artifact. Not canonical for active implementation. Use `lic-design-system/references/` and `docs/PROMPT_CANONICAL_SOURCES.md`.

LIC Brand Guide
Identity summary
Legal Intelligence Corporation (LIC)
Agentic litigation operations for firms: intake → evaluation → drafting → discovery → matter movement → client updates.
Tone: procedural, matte, conservative, reductive.
Brand principles
Systems over slogans
Documentation over decoration
Rules over gradients
Auditability over delight
Quiet confidence
Logo
Official mark: Panelized LIC
Meaning: modular workforce, controlled process, “standards manual” clarity.
Non-negotiable: the three-panel structure prevents “LICE” reads.
Primary SVG (transparent background, for web/app)

Implementation note: using currentColor makes the mark automatically follow your CSS (ink or inverse).
Logo variants
1) App icon (small sizes)
At ≤24px, borders can collapse. Use filled panels + knocked-out letters:

2) Wordmark lockup
Use a strict separator and corporate casing:
LIC (condensed, tracked)
LEGAL INTELLIGENCE CORPORATION (mono or small caps)
Recommended lockup text (UI): LIC / LEGAL INTELLIGENCE CORPORATION
Clear space and minimum size
Clear space: at least one panel stroke width (6 units in the SVG) around the mark.
Minimum size (primary mark):
Web: ≥120px wide
Print: ≥22mm wide
Minimum size (icon variant):
Favicons: 16px (use the filled-panel icon)
Incorrect use
Do not add ticks/stripes to the right of the C.
Do not round corners.
Do not apply shadows, glows, gradients.
Do not skew or compress panels unevenly.
Color
Matte paper + ink + one institutional accent.
Core
Paper: #F2EFE6
Ink: #0B0D0F
Warm Gray: #8B857A
Accent (primary)
Process Blue: #0B3D91
Alert (rare)
Oxide Red: #B23A2B
Usage ratio
Paper 70% / Ink 25% / Accent 5%
Typography
Primary: IBM Plex family (Sans + Sans Condensed + Mono). IBM Plex is available under the SIL Open Font License (OFL).
Headlines: IBM Plex Sans Condensed (uppercase, tracked)
Body/UI: IBM Plex Sans
Metadata / codes / audit trails: IBM Plex Mono
Type behavior
Headlines: uppercase + letter-spacing: 0.06em
Labels: mono + uppercase + tight line length
Prefer numbers, dates, IDs in interface copy
Layout rules
8pt grid everywhere (spacing + sizing)
No shadows (structure comes from borders/rules)
Square corners (radius = 0)
Tables and lists are first-class UI
Web App Design System
This is the implementable system: tokens → primitives → components → patterns.
1) Design tokens
CSS variables (drop-in)
Create styles/lic-tokens.css:
:root {
  /* Color */
  --lic-paper: #F2EFE6;
  --lic-ink: #0B0D0F;
  --lic-warm-gray: #8B857A;
  --lic-blue: #0B3D91;
  --lic-red: #B23A2B;

  /* Surfaces */
  --lic-surface-0: var(--lic-paper);
  --lic-surface-1: #ffffff; /* use sparingly (cards, inputs) */
  --lic-surface-ink: var(--lic-ink);

  /* Text */
  --lic-text-0: var(--lic-ink);
  --lic-text-1: #2a2d31; /* subdued ink */
  --lic-text-muted: #5c6066;

  /* Borders / rules */
  --lic-rule-1: 1px;
  --lic-rule-2: 2px;
  --lic-rule-3: 6px;

  /* Radius */
  --lic-radius: 0px;

  /* Spacing (8pt grid) */
  --lic-1: 4px;
  --lic-2: 8px;
  --lic-3: 12px;
  --lic-4: 16px;
  --lic-5: 24px;
  --lic-6: 32px;
  --lic-7: 48px;
  --lic-8: 64px;

  /* Typography */
  --lic-font-sans: "IBM Plex Sans", ui-sans-serif, system-ui, -apple-system, Segoe UI, Arial, sans-serif;
  --lic-font-condensed: "IBM Plex Sans Condensed", "IBM Plex Sans", ui-sans-serif, system-ui, sans-serif;
  --lic-font-mono: "IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;

  /* Focus */
  --lic-focus: 0 0 0 2px var(--lic-paper), 0 0 0 4px var(--lic-blue);

  /* Motion */
  --lic-ease: cubic-bezier(.2, .0, .0, 1);
  --lic-fast: 120ms;
  --lic-med: 180ms;
}
Fonts (practical web import)
/* example only; pin versions in your build if needed */
@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Condensed:wght@400;600&family=IBM+Plex+Sans:wght@400;600&family=IBM+Plex+Mono:wght@400;600&display=swap");
2) Primitives
Surfaces
App background: --lic-surface-0 (Paper)
Cards/inputs: --lic-surface-1
Dense pages should feel like forms on paper, not “cards floating in space.”
Rules (borders)
Default component border: --lic-rule-2 solid var(--lic-ink)
Hairline dividers: --lic-rule-1 solid var(--lic-warm-gray)
Heavy separators: --lic-rule-3 solid var(--lic-ink) (rare: page header, module boundaries)
Radius and shadow
Radius: 0
Shadow: none
Depth is created by spacing + rule weight, not blur.
Focus / accessibility
Use --lic-focus on :focus-visible for all interactive elements.
Never rely on color alone for state; pair with label + icon + shape.
3) Component library
These are the core components LIC needs (and what they should look/feel like).
Buttons
Button types
Primary: Ink background, Paper text
Secondary: Transparent, Ink border
Tertiary: Text-only, underlined on hover
Danger: Red border + red text (no filled red by default)
Microcopy rules
Prefer verbs: “Approve”, “Return”, “Send update”, “Generate draft”
Avoid “Magic”, “Autofix”, “AI”
CSS skeleton
.lic-btn {
  font: 600 14px/1 var(--lic-font-sans);
  padding: var(--lic-3) var(--lic-4);
  border-radius: var(--lic-radius);
  border: var(--lic-rule-2) solid var(--lic-ink);
  background: transparent;
  color: var(--lic-ink);
  transition: background var(--lic-fast) var(--lic-ease), color var(--lic-fast) var(--lic-ease);
}
.lic-btn:focus-visible { box-shadow: var(--lic-focus); outline: none; }
.lic-btn--primary { background: var(--lic-ink); color: var(--lic-paper); }
.lic-btn--primary:hover { background: #15181c; }
.lic-btn--secondary:hover { background: rgba(11,13,15,.06); }
.lic-btn[aria-disabled="true"], .lic-btn:disabled { opacity: .55; cursor: not-allowed; }
Inputs
Background: white
Border: ink
Placeholder: muted ink
Errors: red rule + error label in mono
Rule: show validation inline and specific, e.g. FIELD REQUIRED / INVALID EMAIL.
Badges and statuses
Use mono, uppercase, framed:
PROPOSED
IN REVIEW
APPROVED
FILED
BLOCKED
WAITING ON CLIENT
Badge spec:
Border 2px
Padding 4/8
Font: Mono 12px
Tables (first-class)
LIC should lean heavily into tables:
Matter list
Task queue
Discovery inventory
Draft review history
Audit logs
Table rules:
Thick header rule
Sticky header
Row hover is subtle (paper tint)
Row actions live at the right edge, always aligned
Cards (but not “cardy”)
Cards are paper blocks with rules. No elevation.
Use for: “Matter summary”, “Next steps”, “Draft package”
Avoid for: everything (tables are better for density)
Modal / drawer pattern
Default to right-side drawer for reviews (keeps context)
Modals only for destructive confirmations or critical approvals
Every modal/drawer must have:
Title
Status badge
Definition of action (“This will send to client”)
Audit note field (optional)
Toasts / notifications
Tone: dry and logged
“Draft approved.”
“Client update sent.”
“Discovery set exported.”
Include a VIEW LOG link when possible.
4) Page templates
Global shell
Left navigation (module system; looks like an internal tool)
Queue
Matters
Intake
Evaluation
Drafting
Discovery
Docket
Client Updates
Logs
Top bar
Matter picker
Search (matters, docs, tasks)
“Create” button (rare; most work is workflow-driven)
Matter dashboard (recommended layout)
Header: Matter name + ID + status + next deadline
Body (2 columns):
Left: Timeline + next steps + risk flags
Right: Work packages (Drafts, Discovery sets, Client updates)
Always show
“Next step issued” timestamp
“Awaiting review” queue count
Last client update date
5) Interaction patterns
These are the “agentic workforce” patterns that make the app feel proactive (but controlled).
A. Review gates (non-negotiable)
All generated work moves through explicit states:
PROPOSED (agent produced)
IN REVIEW (human reviewing)
APPROVED (ready to send/file)
EXECUTED (sent/filed/exported)
RETURNED (needs revision)
UI requirements
Every package shows:
Status badge
Owner (reviewer)
Timestamp
Delta summary (“Changed 3 sections”)
Actions must be explicit:
APPROVE
RETURN WITH NOTES
REQUEST REVISION
No hidden auto-send.
B. “Next step” engine
A dedicated component on every matter:
NEXT STEP (single clear action)
DEPENDENCIES (what’s blocking)
DUE (date)
ISSUED BY (agent/operator)
Think “docket clerk,” not “assistant.”
C. Client updates as products
Client updates are treated like a versioned artifact:
UPDATE 0047 / MONTHLY
Review gate
Delivery channel (email/pdf)
Audit log link
D. Audit trail everywhere
Any action that changes an output includes:
Who/what initiated
What changed
When
Link to diff or version
6) Content style in-app
Default phrasing
“Prepared for attorney review.”
“Issues flagged.”
“Awaiting approval.”
“Executed.”
Avoid:
“I think”
“Looks good!”
“AI suggests”
Implementation kit
Tailwind config snippet (optional)
If you’re on Tailwind, map the tokens cleanly:
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        paper: "#F2EFE6",
        ink: "#0B0D0F",
        warmgray: "#8B857A",
        licblue: "#0B3D91",
        licred: "#B23A2B",
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', "system-ui", "sans-serif"],
        condensed: ['"IBM Plex Sans Condensed"', '"IBM Plex Sans"', "system-ui", "sans-serif"],
        mono: ['"IBM Plex Mono"', "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      borderRadius: { DEFAULT: "0px" },
      borderWidth: { 1: "1px", 2: "2px", 6: "6px" },
      spacing: { 1: "4px", 2: "8px", 3: "12px", 4: "16px", 5: "24px", 6: "32px", 7: "48px", 8: "64px" },
    },
  },
};
Codex refactor packet
Codex works best with: explicit context, clear “done,” and a workflow broken into smaller steps with verification (lint/tests).
1) Add this to your repo: AGENTS.md
Codex can load repo-level custom instructions via AGENTS.md.
# LIC Design System + UX Instructions (AGENTS.md)

You are refactoring this repository's UI to match the LIC brand system.

## Brand
- Tone: procedural, dry, conservative.
- No AI hype words ("magic", "revolutionary", "assistant buddy").
- Prefer nouns/verbs, codes, timestamps, statuses.

## Visual System
- Background: Paper (#F2EFE6)
- Text/borders: Ink (#0B0D0F)
- Accent: Process Blue (#0B3D91) used sparingly.
- No shadows. No gradients. No rounded corners. No glassmorphism.
- 8pt spacing grid. Heavy rules as structure.

## Typography
- Primary: IBM Plex Sans
- Headings: IBM Plex Sans Condensed (uppercase + letter-spacing 0.06em)
- Metadata: IBM Plex Mono (uppercase, compact)

## Components
- Build/normalize primitives: Button, Input, Select, Badge, Table, Card, Drawer, Modal, Toast.
- Tables are first-class; prefer tables over card grids for dense information.
- Every interactive element must have :focus-visible styling.

## Workflows + Interaction
- Enforce review gates for generated outputs:
  PROPOSED -> IN REVIEW -> APPROVED -> EXECUTED -> RETURNED
- Never auto-send to clients without explicit approval.
- Every action should write/emit an audit log entry and show timestamped feedback.
- Use drawers for review to preserve context.

## Engineering Rules
- Do changes in small PR-sized steps.
- Keep behavior stable unless the task explicitly changes it.
- Add/adjust tests where the repo already has testing patterns.
- Run lint + typecheck + tests based on package scripts.
- Provide a short "before/after" summary and list of touched files.

## Definition of Done (for each step)
- UI matches tokens (colors, borders, radius, type).
- Accessibility: keyboard nav works, focus visible, labels present.
- No console errors.
- Lint/tests pass.
2) Paste this into Codex
This is written to trigger the “scan → plan → refactor → verify” loop Codex recommends.
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
3) Optional: “Front-end only” variant (if you want stricter control)
If you want to prevent any backend drift, append this line to the prompt:
HARD RULE: Do not edit server/backend code. If a UI change requires new data, stub the UI gracefully and leave TODOs.

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

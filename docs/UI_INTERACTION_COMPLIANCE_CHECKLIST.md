# UI + Interaction Compliance Checklist

Source of truth: `lic-design-system/references/`
Canonical component matrix: `lic-design-system/references/ui-kit.md`
Canonical precedence contract: `docs/UI_CANONICAL_PRECEDENCE.md`
Explicitly out of scope for product app parity: `lic-design-system/references/marketing-site.md`.

Use this checklist for any UI-affecting ticket or PR.

## 1) Visual System
- Uses canonical palette only (`Paper #F7F5F0`, `Ink #0B0B0B`, `Institutional #2B4C7E`, `Filing Red #8B2500`, `Ledger #2D5F3A`, tokenized neutrals).
- No gradients.
- No shadows.
- No rounded corners.
- Border/rule-based hierarchy present.

## 2) Typography + Copy
- Condensed used for headings (`uppercase`, tracking `0.06em`).
- Mono used for labels/codes/status metadata.
- Sans used for body content.
- Serif used sparingly for approved emphasis contexts only.
- Voice is procedural and terse.
- No hype/friendly filler phrases.
- Product copy does not include standards-manual scaffolding markers (`Standards Manual`, `LIC / IDENTITY`, revision/confidential banner language).

## 3) Layout + Density
- 12-column desktop structure respected.
- Responsive matrix enforced:
  - `>=1280px` full desktop layout with visible sidebar and full-width tables.
  - `1024-1279px` compact desktop (collapsed rail/hamburger, dense-data readability preserved via scroll where needed).
  - `768-1023px` tablet mode (overlay navigation drawer, single-column content, 48px touch targets).
  - `<768px` unsupported notice shown with predictable fallback behavior.
- 8px spacing scale respected.
- Table/list-first for dense operational data.
- Max content width and margin constraints respected.

## 4) Interaction Behavior
- State is always visible.
- Destructive or irreversible actions require explicit confirmation.
- System does not interrupt first (no unsolicited intrusive modals/tooltips).
- Motion is functional and linear only.
- No anti-patterns: infinite scroll, skeleton shimmer, optimistic critical writes, hover-only disclosure, stacked modals.

## 5) Feedback Hierarchy
- Inline state change for low-severity reversible actions.
- Toast for completed/status updates.
- Inline alert for warnings/validation/system notices.
- Confirmation dialog for destructive/irreversible actions.
- Errors persist inline until resolved (not toast-only).

## 6) Accessibility
- WCAG 2.1 AA contrast and semantics.
- Keyboard navigation complete and logical.
- Focus-visible ring present and consistent.
- Modal focus trap + focus return behavior verified.
- Reduced motion support verified.
- Color is not sole state indicator.

## 7) AI-Specific Interaction
- AI presented as workforce/operator model, not chatbot persona.
- Outputs shown as structured work product with provenance metadata.
- Review gate enforced before external send/file actions.
- No confidence percentages; uncertainty expressed as professional caveats.

## 8) Verification Evidence in PR/Issue
- Screens/routes touched listed.
- Linked PRD/screen spec reference for each touched route (or explicit `Blocked by PRD/Screens` ticket for future flow work).
- Test/build commands listed and passed.
- Manual checklist outcomes documented.
- Any intentional exception documented with rationale and follow-up ticket.
- For shell/navigation edits: explicit confirmation that standards-manual app UX artifacts were not copied into product UI.

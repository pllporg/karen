# UI + Interaction Compliance Checklist

Source of truth: `brand/Brand Identity Document/`

Use this checklist for any UI-affecting ticket or PR.

## 1) Visual System
- Uses canonical palette only (`Ink/Paper/Graphite/Slate/Silver/Fog/Parchment/Institutional/Filing Red/Ledger`).
- No gradients.
- No shadows.
- No rounded corners.
- Border/rule-based hierarchy present.

## 2) Typography + Copy
- Mono used for headings/labels/codes/status metadata.
- Sans used for body content.
- Serif used sparingly for approved emphasis contexts only.
- Voice is procedural and terse.
- No hype/friendly filler phrases.

## 3) Layout + Density
- 12-column desktop structure respected.
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
- Test/build commands listed and passed.
- Manual checklist outcomes documented.
- Any intentional exception documented with rationale and follow-up ticket.

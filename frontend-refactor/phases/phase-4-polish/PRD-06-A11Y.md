# PRD-06: Accessibility & Interaction Compliance

> **Phase:** 4 — Polish
> **Branch:** `refactor/prd-06-a11y`
> **Dependencies:** PRD-01 through PRD-05
> **Cross-reference:** `lic-design-system/references/interaction-and-ai.md`
> **Cross-reference:** `docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md`

---

## Objective

Achieve WCAG 2.1 AA compliance across all pages. Implement every interaction pattern
specified in the Brand Identity Document. This is a sweep across all components and pages
produced in prior phases.

---

## Deliverables

### 1. ARIA & Semantic HTML

**All form controls:**
- Every `<input>`, `<select>`, `<textarea>` has an associated `<label>` with `htmlFor`
- `aria-invalid="true"` set when field has validation error
- `aria-describedby` points to error message element ID
- `aria-required="true"` on required fields

**All tables:**
- Every `<th>` has `scope="col"` or `scope="row"`
- Every `<table>` has either `<caption>` or `aria-label`
- Use `<thead>`, `<tbody>`, `<tfoot>` sections

**All interactive regions:**
- Navigation landmarks: `<nav aria-label="Main navigation">`
- Main content: `<main aria-label="Page content">`
- Status regions: `aria-live="polite"` for toast stacks, loading indicators, status updates
- `aria-live="assertive"` only for critical errors

**All buttons:**
- Icon-only buttons have `aria-label`
- Toggle buttons have `aria-pressed`
- Loading buttons have `aria-busy="true"` and `aria-disabled="true"`

### 2. Focus Management

**Modal and Drawer focus traps:**
- When a modal/drawer opens, focus moves to the first focusable element inside
- Tab key cycles within the modal (focus trap)
- Escape key closes the modal/drawer
- When modal/drawer closes, focus returns to the element that triggered it
- Background content has `aria-hidden="true"` and `inert` attribute

**Tab order:**
- Follows visual reading order (top-left to bottom-right)
- No `tabindex` values greater than 0
- Skip link (already in app-shell) jumps to `<main>` content

**Page navigation:**
- When navigating between pages, focus moves to the page heading
- When an action completes (form submit, deletion), focus moves to appropriate confirmation element

### 3. Keyboard Navigation

**All interactive elements reachable via Tab:**
- Buttons, links, form controls, table sort headers, tab switches
- Custom widgets (stepper, toggle, template picker) are keyboard-operable

**Escape key behavior:**
- Closes the topmost overlay (modal, drawer, dropdown)
- Dismisses the most recent toast notification

**Arrow key navigation (composite widgets):**
- Tab bar: Left/Right arrows move between tabs
- Radio group: Arrow keys move between options
- Select dropdown: Up/Down arrows navigate options
- Stepper: Left/Right arrows navigate steps (Enter activates)

**Enter/Space activation:**
- Buttons: Enter and Space both activate
- Checkboxes: Space toggles
- Links: Enter follows

### 4. Color & Contrast

**Minimum contrast ratios (WCAG AA):**
- Normal text (< 24px): 4.5:1 minimum
- Large text (>= 24px or >= 19px bold): 3:1 minimum
- UI components and graphical objects: 3:1 minimum

**Current palette contrast (pre-verified):**
| Combination | Ratio | Status |
|-------------|-------|--------|
| Ink on Paper | 19.2:1 | Pass |
| Paper on Ink | 19.2:1 | Pass |
| Slate on Paper | 5.1:1 | Pass |
| Institutional on Paper | 7.8:1 | Pass |
| Filing Red on Paper | 8.9:1 | Pass |
| Ledger on Paper | 6.1:1 | Pass |
| Silver on Paper | 2.6:1 | **FAIL for normal text** |

**Silver on Paper fix:** Silver (#A8A8A8) on Paper (#F7F5F0) is 2.6:1 — below AA for normal text.
Use Silver ONLY for disabled states (which are exempt per WCAG since disabled controls are not interactive).
For any non-disabled text, use Slate (#6B6B6B) minimum.

**Non-color indicators:**
- Status badges MUST include text label (not just color dot)
- Error states include error icon or text (not just red border alone)
- Success states include checkmark or text (not just green border alone)

### 5. Touch Targets

- All interactive elements: minimum 44×44px clickable area
- Exception: inline table actions may be 36×36px with explicit justification
- Spacing between adjacent touch targets: minimum 8px

### 6. Reduced Motion

**Already partially implemented** via `prefers-reduced-motion` media query.

Verify:
- All 80ms/100ms/120ms transitions honor the media query
- Loading animation stops or becomes static
- No animation plays that could trigger vestibular discomfort

### 7. Interaction Pattern Compliance

**Per Brand Doc (`interaction-and-ai.md`):**

**Validation:**
- [ ] Validate on blur (field loses focus)
- [ ] Validate on submit (full form)
- [ ] Move focus to first error on submit failure
- [ ] Clear errors immediately when corrected
- [ ] Error messages: "problem + fix" language

**Confirmation dialogs:**
- [ ] No generic "Are you sure?"
- [ ] Title states the exact action and consequence
- [ ] Primary button repeats the action verb (e.g., "Delete Matter", not "Confirm")
- [ ] Cancel is always present and explicit
- [ ] Typed confirmation for irreversible actions (e.g., type "DELETE" to confirm)

**Toast notifications:**
- [ ] Max 3 visible at once
- [ ] 8-second default duration
- [ ] Escape dismisses most recent
- [ ] `aria-live="polite"` on stack
- [ ] Position: bottom-right, max 400px width

**Loading states:**
- [ ] Explicit loading indicator (no hidden loading)
- [ ] Linear motion only (no shimmer, no pulse, no skeleton screens)
- [ ] Loading text says what's loading ("Loading matters..." not just "Loading...")

**Empty states:**
- [ ] Clear message explaining why empty
- [ ] Action button if user can remedy (e.g., "Create your first matter")

---

## Testing

### Automated

Install `jest-axe` for automated accessibility auditing in tests:

```bash
pnpm --filter web add -D jest-axe @types/jest-axe
```

Add to each page test:

```typescript
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = render(<PageComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual

- [ ] Complete every workflow using keyboard only (no mouse)
- [ ] Test with screen reader (VoiceOver on macOS)
- [ ] Verify all focus movements are logical and predictable
- [ ] Verify reduced-motion preference is respected

---

## Acceptance Criteria

- [ ] `jest-axe` reports zero critical or serious violations on all pages
- [ ] Every form field has associated `<label>` with `htmlFor`
- [ ] Every `<th>` has `scope` attribute
- [ ] Every `<table>` has `aria-label` or `<caption>`
- [ ] Modal and Drawer implement focus traps
- [ ] Focus returns to trigger element when overlay closes
- [ ] All keyboard navigation patterns work (Tab, Escape, Arrow keys, Enter/Space)
- [ ] Silver is not used for non-disabled text
- [ ] All status indicators include text (not color-only)
- [ ] All touch targets >= 44×44px (or 36×36px with justification)
- [ ] Validation fires on blur and submit; focus moves to first error
- [ ] Confirmation dialogs state exact consequence; typed confirmation for destructive actions
- [ ] Toast stack enforces 3-max, 8-second duration, Escape dismiss
- [ ] `prefers-reduced-motion` disables all animations
- [ ] `pnpm --filter web test` passes (including new axe tests)
- [ ] `pnpm --filter web build` succeeds

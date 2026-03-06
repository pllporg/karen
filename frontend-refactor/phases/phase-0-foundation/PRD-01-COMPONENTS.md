# PRD-01: Design Token & Component Foundation

> **Phase:** 0 — Foundation
> **Branch:** `refactor/prd-01-components`
> **Dependencies:** None
> **Parallel with:** PRD-02

---

## Objective

Expand the existing `components/ui/` library to fully implement the component inventory
defined in `lic-design-system/references/ui-kit.md`. Every component must use design tokens
from `lic-tokens.css` and CSS classes from `globals.css`. No inline styles.

---

## Deliverables

### 1. Typography Utility Classes

Add to `globals.css` (see `reference/css-additions.md` for exact CSS):

| Class | Font | Size | Weight | Tracking | Leading |
|-------|------|------|--------|----------|---------|
| `.type-display` | Mono | 2.5rem | 500 | 0.02em | 1.1 |
| `.type-h1` | Mono | 2rem | 500 | 0.02em | 1.2 |
| `.type-h2` | Mono | 1.5rem | 500 | 0.01em | 1.3 |
| `.type-h3` | Mono | 1.125rem | 500 | 0.01em | 1.3 |
| `.type-body` | Sans | 1rem | 400 | normal | 1.6 |
| `.type-caption` | Sans | 0.8125rem | 400 | normal | 1.5 |
| `.type-label` | Mono | 0.6875rem | 400 | 0.15em | 1.4 |
| `.type-micro` | Mono | 0.5625rem | 400 | 0.25em | 1.4 |

All heading classes: text-transform uppercase.
Label and Micro classes: text-transform uppercase.

### 2. Spacing Utility Classes

Add to `globals.css`:

| Class Pattern | Value |
|--------------|-------|
| `.gap-{1-8}` | `var(--lic-{n})` |
| `.p-{1-8}` | padding using `var(--lic-{n})` |
| `.mb-{1-8}` | margin-bottom using `var(--lic-{n})` |
| `.mt-{1-8}` | margin-top using `var(--lic-{n})` |
| `.stack-{1-8}` | flex column with gap `var(--lic-{n})` |
| `.row-{1-8}` | flex row with gap `var(--lic-{n})` |

### 3. Layout Grid Classes

Add to `globals.css`:

| Class | Behavior |
|-------|----------|
| `.grid-2` | 2-column grid, gap `var(--lic-4)` |
| `.grid-3` | 3-column grid, gap `var(--lic-4)` |
| `.grid-4` | 4-column grid, gap `var(--lic-4)` |
| `.grid-auto` | auto-fill minmax(280px, 1fr), gap `var(--lic-4)` |
| `.col-span-2` | grid-column: span 2 |
| `.col-span-3` | grid-column: span 3 |
| `.col-full` | grid-column: 1 / -1 |

Responsive: At `compact` breakpoint, `.grid-3` and `.grid-4` collapse to `.grid-2`.
At `tablet` breakpoint, all grids collapse to single column.

### 4. Button Size Variants

**Modify:** `components/ui/button.tsx`

Add `size` prop: `'sm' | 'md' | 'lg'` (default: `'md'`).

| Size | Height | Padding | Font Size |
|------|--------|---------|-----------|
| `sm` | 24px | 4px 12px | 0.6875rem |
| `md` | 40px | 8px 20px | 0.8125rem |
| `lg` | 48px | 12px 28px | 0.8125rem |

Implementation: Add `data-size` attribute. Add CSS rules in `globals.css`.
Labels: font-family mono, text-transform uppercase, letter-spacing 0.08em.

### 5. Form Control Error/Disabled States

**Modify:** `components/ui/input.tsx`, `select.tsx`, `textarea.tsx`

Current: These components accept `invalid` prop and set `data-state`.
Missing: The CSS for error state doesn't match Brand Doc spec.

Update CSS in `globals.css`:
- Error state: 2px `var(--lic-filing-red)` border, `rgba(139, 37, 0, 0.05)` background
- Disabled state: 1px `var(--lic-fog)` border, `var(--lic-parchment)` background, `var(--lic-silver)` text, `cursor: not-allowed`
- Focus state (already exists): 2px `var(--lic-institutional)` border

### 6. New Component: Checkbox

**Create:** `components/ui/checkbox.tsx`

```typescript
interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
  id?: string;
}
```

Visual: 16×16px box, 1px Ink border, square corners. Checked: filled 10×10px Ink center square.
Disabled: Fog border, Silver fill when checked. Focus: Institutional 2px ring.
Label: positioned to the right with 8px gap, font-family sans, font-size 1rem.

### 7. New Component: Radio

**Create:** `components/ui/radio.tsx`

```typescript
interface RadioProps {
  value: string;
  checked: boolean;
  onChange: (value: string) => void;
  label: string;
  name: string;
  disabled?: boolean;
}
```

Visual: 16×16px circle (exception to square-corners rule — radios are semantically round).
1px Ink border. Selected: 8×8px Ink center circle. Focus: Institutional 2px ring.

### 8. New Component: Toggle

**Create:** `components/ui/toggle.tsx`

```typescript
interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}
```

Visual: 40×20px track, 1px Ink border, square corners. Knob: 16×16px, Ink fill.
Off: knob left. On: knob right, Institutional Blue track fill.
Transition: 80ms linear (per motion tokens). Focus: Institutional 2px ring.

### 9. New Component: Stepper

**Create:** `components/ui/stepper.tsx`

```typescript
interface StepperStep {
  label: string;
  status: 'pending' | 'active' | 'complete' | 'blocked';
}

interface StepperProps {
  steps: StepperStep[];
  onStepClick?: (index: number) => void;
}
```

Visual: Horizontal row of numbered circles connected by lines.
- Pending: 1px Ink border, Ink number, Paper fill
- Active: 2px Institutional border, Institutional number, Paper fill
- Complete: Ink fill, Paper checkmark (✓)
- Blocked: Fog border, Silver number, Parchment fill, `cursor: not-allowed`

Step labels below circles in `.type-label` style.
Connecting lines: 1px Fog between circles, 1px Ink for completed segments.
Clicking a completed step navigates back (if `onStepClick` provided).
Clicking a blocked step does nothing.

### 10. New Component: Key-Value Display

**Create:** `components/ui/kv-display.tsx`

```typescript
interface KVPair { label: string; value: ReactNode; }

// Stacked layout (label above value)
function KVStack({ pairs, columns?: 1 | 2 | 3 }: { pairs: KVPair[]; columns?: number })

// Inline layout (label : value on same row)
function KVInline({ pairs }: { pairs: KVPair[] })
```

KVStack: Label in `.type-label`, value in `.type-body`. Grid layout with `columns` prop.
KVInline: Label in `.type-label` (right-aligned, fixed width), value in `.type-body`.
Separator: 1px Fog bottom border between pairs.

### 11. Structured Card Variant

**Modify:** `components/ui/card.tsx`

Add `CardHeader`, `CardBody`, `CardFooter` sub-components:

```typescript
function CardHeader({ module, status, children }: {
  module?: string;    // e.g., "INTK"
  status?: ReactNode; // Badge or status tag
  children?: ReactNode;
})

function CardBody({ children }: { children: ReactNode })

function CardFooter({ children }: { children: ReactNode })
```

CardHeader: Flex row, `justify-content: space-between`. Module code in `.type-label`.
CardFooter: `var(--lic-parchment)` background, padding `var(--lic-2)`.
Card border: 1px Ink. No shadow. No radius.

### 12. Table Enhancements

**Modify:** `components/ui/table.tsx`

Add props to Table:

```typescript
interface TableProps extends TableHTMLAttributes<HTMLTableElement> {
  sortable?: boolean;
  alternating?: boolean; // Alternating row backgrounds
}
```

Alternating rows: even rows get `var(--lic-parchment)` background.
Sort: Column headers render a sort indicator (`▲` / `▼` / `–`). Clicking toggles sort.
All `<th>` elements MUST have `scope="col"` or `scope="row"` — enforce in component.
Table headers: Ink background, Paper text, font-family mono, text-transform uppercase, letter-spacing 0.08em.

### 13. Toast Limits

**Modify:** `components/toast-stack.tsx`

- Maximum 3 toasts visible at once. When a 4th arrives, dismiss the oldest.
- Default duration: 8000ms (currently variable — standardize).
- Escape key dismisses the most recent toast.
- `aria-live="polite"` on the stack container (already present).

### 14. Typed Confirmation Dialog

**Modify:** `components/confirm-dialog.tsx`

Add `typedConfirmation` prop:

```typescript
interface ConfirmDialogProps {
  // ... existing props
  typedConfirmation?: string; // If set, user must type this string to enable confirm button
}
```

When `typedConfirmation` is set:
- Render a text input below the description
- Placeholder: `Type "${typedConfirmation}" to confirm`
- Confirm button disabled until input matches exactly
- Input uses error state styling until match

### 15. IBM Plex Serif Font

**Modify:** `app/layout.tsx` (or the root layout file)

Add IBM Plex Serif from Google Fonts alongside the existing Mono and Sans imports.
Add `--lic-font-serif: 'IBM Plex Serif', Georgia, 'Times New Roman', serif` to `lic-tokens.css`.

---

## Acceptance Criteria

- [ ] All 8 typography utility classes render correctly with specified font/size/weight/tracking
- [ ] All spacing utilities produce correct values from design tokens
- [ ] Button renders in 3 sizes × 4 tones = 12 combinations
- [ ] Input/Select/Textarea show distinct error, disabled, and focus states
- [ ] Checkbox renders with square corners, proper checked indicator
- [ ] Radio renders with circular shape, proper selected indicator
- [ ] Toggle animates in 80ms linear between states
- [ ] Stepper renders 4 states with correct visual treatment
- [ ] KVStack and KVInline render label/value pairs correctly
- [ ] Structured Card renders header (with module code), body, footer
- [ ] Table alternating rows alternate between Paper and Parchment
- [ ] Table headers render with Ink background, mono font, uppercase
- [ ] Toast stack enforces 3-toast maximum
- [ ] Typed confirmation dialog requires exact string match
- [ ] IBM Plex Serif loads and renders for serif typography
- [ ] Zero inline `style={{}}` in any component file
- [ ] `pnpm --filter web test` passes
- [ ] `pnpm --filter web build` succeeds

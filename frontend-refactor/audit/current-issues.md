# Current Issues Audit — Per-File Inventory

> Every known issue in `apps/web/` that this refactoring addresses.
> Use this as a checklist during PRD-05 (page-by-page overhaul).
> Mark items ✅ as you fix them.

---

## Critical (P0) — Must fix immediately

### `app/matters/[id]/page.tsx` — ~100K+ lines

- [ ] File is ~100,000+ lines — completely unmanageable
- [ ] Must decompose into tabbed sub-routes (see PRD-05)
- [ ] Likely contains 50+ useState hooks
- [ ] Inline styles throughout
- [ ] Type safety unknown (cannot realistically audit this file)
- **Action:** Delete and rewrite as directory with layout.tsx + sub-pages

### `app/matters/page.tsx` — 303 lines

- [ ] 19+ individual useState hooks for intake wizard fields
- [ ] Hardcoded sample data: "Kitchen Remodel Defect", specific addresses, dollar amounts
- [ ] Redundant form patterns: quick-add form AND inline intake wizard
- [ ] No form validation on any field
- [ ] No error handling on API calls
- [ ] No success feedback after creation
- [ ] Inline `gridTemplateColumns: '1fr 1fr 1fr 120px'`
- [ ] Some fields parse to numbers inconsistently
- **Action:** Remove inline wizard (matters created via GP-01). Keep quick-add with react-hook-form.

### `app/intake/[leadId]/intake/page.tsx` — 47 lines

- [ ] Renders `Object.entries(form)` as generic key/value table
- [ ] Every field is a plain text input regardless of field type
- [ ] No stepped wizard, no sections, no field grouping
- [ ] No validation whatsoever
- [ ] No draft auto-save (only manual submit)
- **Action:** Complete rewrite as 5-step wizard (PRD-04)

### `app/intake/[leadId]/conflict/page.tsx` — 50 lines

- [ ] Hardcoded query text: "Client name + opposing party + property address"
- [ ] No conflict match results display
- [ ] No confidence scores or rationale
- [ ] No audit trail
- [ ] No gate enforcement (can proceed without resolving)
- [ ] Inline `style={{ display: 'flex', gap: 8 }}`
- **Action:** Complete rewrite with results table + audit trail (PRD-04)

### `app/intake/[leadId]/engagement/page.tsx` — 48 lines

- [ ] Raw template ID text input (user must know the ID)
- [ ] Raw envelope ID text input
- [ ] No template selection UI
- [ ] No fee arrangement fields
- [ ] No eSign status lifecycle tracking
- [ ] No gate enforcement
- **Action:** Complete rewrite with template picker + eSign tracker (PRD-04)

### `app/intake/[leadId]/convert/page.tsx` — 61 lines

- [ ] Hardcoded defaults: "Kitchen Remodel Defect - Intake Conversion", "M-2026-INT-001"
- [ ] No participant management
- [ ] No ethical wall toggle
- [ ] Checklist shows raw true/false text
- [ ] `.catch(() => undefined)` silently swallows errors
- **Action:** Complete rewrite with participants + ethical wall (PRD-04)

---

## High (P1) — Fix in Phase 3

### `app/dashboard/page.tsx` — 76 lines

- [ ] Inline `style={{ marginBottom: 14 }}` on metric cards
- [ ] Inline `style={{ marginTop: 10, fontSize: 13 }}` on notice
- [ ] Loading placeholder is just "..." for each metric value
- [ ] No error display — catch block silently defaults to zeros
- [ ] Metric cards are not clickable (should link to respective pages)
- [ ] AI warning notice uses inline styles instead of InlineAlert component

### `app/intake/page.tsx` — 67 lines

- [ ] No filter tabs (All / New / In Review / Conflict Hold / Ready)
- [ ] No pagination
- [ ] No search
- [ ] No loading state — table is blank until data arrives
- [ ] No error handling — failed fetch shows empty table silently
- [ ] No portal origin indicator (◆)
- [ ] Timestamp uses raw `toLocaleString()` without consistent formatting
- [ ] No empty state message clarity

### `app/intake/new/page.tsx` — 39 lines

- [ ] No form validation
- [ ] Hardcoded defaults: "Website Form" source, "Initial queue intake created" notes
- [ ] Status message appears but never clears
- [ ] No disabled state on button during submission
- [ ] No redirect to wizard after creation

### `app/documents/page.tsx` — 435 lines

- [ ] No upload progress indicator
- [ ] Hardcoded default: "Inspection Report" title
- [ ] Hardcoded default: "Default 7-year retention" policy name
- [ ] Weak error handling — minimal response checking
- [ ] No file type/size validation before upload
- [ ] Inline grid templates throughout
- [ ] Retention status messaging: single string state gets overwritten
- [ ] `any[]` types for retention policies and documents

### `app/portal/page.tsx` — 385 lines

- [ ] Inline `gridTemplateColumns: '1fr 2fr 1fr 1fr auto'`
- [ ] File upload has no type/size validation
- [ ] Message text doesn't clear after send (attachment file clears but not body)
- [ ] `window.open()` for downloads can be blocked by popup blockers
- [ ] Snapshot is `any` type
- [ ] Confirmation dialog text is messy/conditional

### `app/admin/page.tsx` — 765 lines

- [ ] 20+ individual useState hooks
- [ ] All admin data fetched upfront on mount (no lazy loading)
- [ ] No pagination on webhook delivery log
- [ ] Hardcoded test data: "Jane Doe" conflict query
- [ ] State management is incoherent — custom field, section, role creation all separate flows
- [ ] Webhook filter state inconsistent
- [ ] Provider status error handling: catch blocks just set error text, no retry
- [ ] Inline grid templates throughout
- **Action:** Decompose into tabbed sub-routes (PRD-05)

---

## Medium (P2) — Fix in Phase 3/4

### `app/ai/page.tsx` — 918 lines

- [ ] 10+ useState hooks
- [ ] Helper functions (`getDeadlineCandidates`, `normalizeDate`) mixed into page file
- [ ] TOOLS array hardcoded at top of file
- [ ] Inline `gridTemplateColumns: '1fr 220px 260px auto'`
- [ ] Nested checkboxes lack proper labeling
- [ ] Error state is a single string (can't display multiple errors)
- [ ] CSS-in-JS for pre/code blocks
- **Positive:** Review gate pipeline visualization is well-built — extract, don't rewrite

### `app/contacts/page.tsx` — 653 lines

- [ ] 14+ useState hooks
- [ ] Inline dedupe confidence calculation (should be utility function)
- [ ] Inline `gridTemplateColumns: '1fr 1fr 1fr 160px auto auto'`
- [ ] Graph search is client-side only, no pagination
- [ ] Toast cleanup uses setTimeout (potential accumulation)
- [ ] Magic numbers: 4500ms toast timeout, toast ID generation
- **Positive:** Uses UI component library correctly, toast/confirm patterns are solid

### `app/analyst/page.tsx` — 325 lines

- [ ] Hardcoded API base URL duplicated
- [ ] Inline `overflowX: 'auto'` on table wrapper
- [ ] Excessive useMemo hooks (some could be simplified)
- **Positive:** Good payload normalization, proper loading/error states, accessible table

### `app/auditor/page.tsx` — 318 lines

- [ ] Hardcoded API base URL
- [ ] Naive retry logic (tries multiple endpoints without logging)
- [ ] Inline `gridTemplateColumns: 'repeat(2, minmax(180px, 220px))'`
- [ ] Inline styles on drawer content
- **Positive:** Uses Drawer/Badge/Table components correctly

### `app/reporting/page.tsx` — 63 lines

- [ ] No error handling — catch block does nothing
- [ ] No loading state — users see blank until data arrives
- [ ] Generic `any` types everywhere
- [ ] Hardcoded CSV endpoint URLs
- [ ] Table headers lack scope attributes

### `app/login/page.tsx` — ~80 lines

- [ ] No form validation (can submit empty fields)
- [ ] No error display for auth failures beyond basic text
- [ ] No focus management on error

---

## Component Issues

### `components/app-shell.tsx` — 249 lines

- [ ] Hardcoded viewport breakpoints (768, 1024, 1280) as magic numbers
- [ ] Navigation links hardcoded in component (must update code to add routes)
- [ ] Resize listener added/removed every render (should use useCallback)
- [ ] Mobile menu doesn't auto-close on route change
- **Positive:** Skip link, proper aria attributes, responsive design

### `components/intake/stage-nav.tsx`

- [ ] Flat horizontal link table — should be Stepper component
- [ ] No gate enforcement (all stages always accessible)
- [ ] No visual indicators for completed/active/blocked steps

### `components/toast-stack.tsx`

- [ ] No maximum toast limit (can accumulate indefinitely)
- [ ] No standardized duration (varies per caller)
- [ ] No Escape key dismiss

### `components/confirm-dialog.tsx`

- [ ] No typed confirmation option for destructive actions
- [ ] Generic "Are you sure?" possible (Brand Doc requires specific consequence language)

---

## Cross-Cutting Issues

### Inline Styles (CRITICAL — found in every page)

Pattern: `style={{ marginBottom: 14, gridTemplateColumns: '1fr 1fr 1fr 120px' }}`

Every instance must be replaced with CSS classes from `globals.css` or the new
utility classes defined in `reference/css-additions.md`.

### Type Safety

Pattern: `useState<any>()`, `apiFetch<any[]>()`, `(data: any)`

Every `any` type must be replaced with a defined interface from `lib/types/`.

### Error Handling

Pattern: `.catch(() => undefined)`, `.catch(() => setError('Failed'))`

Every API call must show meaningful errors to the user via `<ErrorState>` or toast.

### Form Validation

Pattern: Direct `useState` for each field, no validation before submit

Every form must use react-hook-form + Zod schema with `mode: 'onBlur'`.

### Loading States

Pattern: Show "..." or blank space while data loads

Every API-dependent view must show `<LoadingState />` with descriptive label.

### Hardcoded Data

Pattern: Default values like "Kitchen Remodel Defect", "Jane Doe", "M-2026-INT-001"

All hardcoded sample data must be removed. Use empty strings or server-generated values.

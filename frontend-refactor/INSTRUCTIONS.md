# Frontend Refactoring — Codex Execution Instructions

> **Authority:** This document is the execution authority for the frontend refactoring initiative.
> It operates WITHIN the existing doc hierarchy defined in `docs/PROMPT_CANONICAL_SOURCES.md`.
> The UI canonical precedence in `docs/UI_CANONICAL_PRECEDENCE.md` still governs all visual/interaction conflicts.
> This document adds IMPLEMENTATION INSTRUCTIONS on top of existing design system references.

---

## How to Use This Package

This folder (`docs/frontend-refactor/`) contains everything needed to rebuild the `apps/web/` frontend.
Implement phases in strict order. Each phase produces deliverables consumed by later phases.

```
docs/frontend-refactor/
├── INSTRUCTIONS.md                   ← YOU ARE HERE — master execution guide
├── OPERATIONS_PATCH.md               ← Changes to make to existing operational docs
├── phases/
│   ├── phase-0-foundation/
│   │   ├── PRD-01-COMPONENTS.md      ← Component library expansion
│   │   └── PRD-02-DATA-LAYER.md      ← Hooks, types, state patterns
│   ├── phase-1-forms/
│   │   └── PRD-03-FORMS.md           ← Form system + validation
│   ├── phase-2-gp01/
│   │   └── PRD-04-GP01.md            ← GP-01 workflow complete rebuild
│   ├── phase-3-pages/
│   │   └── PRD-05-PAGES.md           ← Every remaining page
│   └── phase-4-polish/
│       ├── PRD-06-A11Y.md            ← Accessibility compliance
│       └── PRD-07-PERF.md            ← Performance + code quality
├── reference/
│   ├── component-specs.md            ← Exact component API contracts
│   ├── hook-specs.md                 ← Exact hook signatures + behavior
│   ├── schema-specs.md               ← Zod schema definitions
│   └── css-additions.md              ← CSS to append to globals.css
└── audit/
    └── current-issues.md             ← Per-file issue inventory
```

---

## Execution Order

**CRITICAL: Phases are sequential. Do not skip ahead.**

### Phase 0 — Foundation (PRD-01 + PRD-02)

**Goal:** Build the primitive layer everything else depends on.

1. Read `phases/phase-0-foundation/PRD-01-COMPONENTS.md`
2. Read `reference/component-specs.md` for exact component APIs
3. Read `reference/css-additions.md` for CSS to append to `globals.css`
4. Implement all components listed in PRD-01
5. Read `phases/phase-0-foundation/PRD-02-DATA-LAYER.md`
6. Read `reference/hook-specs.md` for exact hook signatures
7. Implement all hooks, types, and state utilities listed in PRD-02
8. Run `pnpm --filter web test` — all existing tests must pass
9. Validate: every new component renders with square corners, no easing, instant state transitions

### Phase 1 — Forms (PRD-03)

**Goal:** Eliminate all manual `useState` form patterns.

1. Install dependencies: `pnpm --filter web add react-hook-form @hookform/resolvers`
2. Read `phases/phase-1-forms/PRD-03-FORMS.md`
3. Read `reference/schema-specs.md` for Zod schema definitions
4. Implement FormField wrapper and all Zod schemas
5. Run `pnpm --filter web test`

### Phase 2 — GP-01 Workflow (PRD-04)

**Goal:** Rebuild the intake-to-matter pipeline from scratch.

1. Read `phases/phase-2-gp01/PRD-04-GP01.md`
2. Cross-reference with `lic-design-system/references/gp01-flow.md` for flow spec
3. Cross-reference with `lic-design-system/references/ui-kit.md` for component constraints
4. Implement each screen (A through G) in order
5. Every screen MUST use components from PRD-01, hooks from PRD-02, forms from PRD-03
6. Run `pnpm --filter web test`

### Phase 3 — Page Overhaul (PRD-05)

**Goal:** Migrate every remaining page to the new foundation.

1. Read `phases/phase-3-pages/PRD-05-PAGES.md`
2. Read `audit/current-issues.md` for per-file issues to fix
3. Migrate pages one at a time — each page is an independent unit
4. After each page, run `pnpm --filter web test`
5. Zero inline `style={{}}` attributes when done

### Phase 4 — Polish (PRD-06 + PRD-07)

**Goal:** Accessibility compliance + performance hardening.

1. Read `phases/phase-4-polish/PRD-06-A11Y.md`
2. Read `phases/phase-4-polish/PRD-07-PERF.md`
3. Audit and fix all components and pages
4. Run `pnpm --filter web test` and `pnpm --filter web build`

---

## Global Rules

These rules apply to ALL code written during this refactoring. Violations are blockers.

### Visual Rules (from Brand Identity Document)

1. **No inline styles.** Every visual property comes from CSS classes or design tokens in `lic-tokens.css`.
   - WRONG: `style={{ marginBottom: 14, gridTemplateColumns: '1fr 1fr 1fr 120px' }}`
   - RIGHT: Use CSS classes defined in `globals.css` or new utilities from `reference/css-additions.md`

2. **No border-radius.** All corners are square. `border-radius: 0` is enforced globally.

3. **No decorative motion.** No spring physics, no bounce, no shimmer, no staggered entrance.
   State changes: 0ms. Panel open/close: 120ms linear. Toast: 100ms linear.

4. **No ad-hoc colors.** Use only the 10 palette tokens. No hex values in component code.
   `var(--lic-ink)`, `var(--lic-paper)`, `var(--lic-institutional)`, etc.

5. **No ad-hoc spacing.** Use only the 8-step scale: 4, 8, 16, 24, 32, 48, 64, 96px.
   Map to tokens: `var(--lic-1)` through `var(--lic-8)`.

6. **Typography hierarchy:** IBM Plex Mono for headings/labels/codes/controls.
   IBM Plex Sans for body copy. IBM Plex Serif for emphasis (rare).

7. **Focus ring:** 2px solid `var(--lic-institutional)` with 2px offset on every interactive element.

### Code Rules

1. **No `any` types.** Every `useState`, `apiFetch`, and function parameter has a defined type.

2. **No file over 400 lines.** If a component exceeds 400 lines, decompose it.

3. **No more than 5 direct `useState` calls per component.** Remaining state goes into custom hooks.

4. **All forms use react-hook-form + Zod.** No manual `useState` for form fields.

5. **All API-dependent views show three states:** loading, error, data. Use `<LoadingState />`, `<ErrorState />`, `<EmptyState />` from PRD-02.

6. **Validate on blur and submit.** Focus first error field on submit failure.

7. **Destructive actions require confirmation dialogs.** State the exact consequence. Repeat action verb on the primary button.

8. **No hardcoded sample data.** Remove all default values like "Kitchen Remodel Defect", "Jane Doe", "M-2026-INT-001".

### Existing Doc References

These documents are already in the repo and remain authoritative. Do NOT duplicate their content — reference them.

| Document | What It Governs |
|----------|----------------|
| `lic-design-system/references/design-tokens.md` | Color, typography, spacing, motion tokens |
| `lic-design-system/references/ui-kit.md` | Component inventory and constraints |
| `lic-design-system/references/interaction-and-ai.md` | Interaction rules, AI interface, state model |
| `lic-design-system/references/gp01-flow.md` | Intake-to-matter workflow stages and screens |
| `lic-design-system/references/brand-foundation.md` | Brand voice, naming, vocabulary |
| `docs/UI_CANONICAL_PRECEDENCE.md` | Conflict resolution order for UI decisions |
| `docs/UI_TOKEN_CONTRACT.md` | Token specification contract |
| `docs/UI_INTERACTION_COMPLIANCE_CHECKLIST.md` | Compliance checklist for PR review |

### Branch Strategy

Create one branch per PRD:

```
main
 └── refactor/prd-01-components
 └── refactor/prd-02-data-layer
 └── refactor/prd-03-forms
 └── refactor/prd-04-gp01
 └── refactor/prd-05-pages
 └── refactor/prd-06-a11y
 └── refactor/prd-07-perf
```

PRD-01 and PRD-02 can run in parallel (Phase 0).
PRD-04 and PRD-05 can run in parallel after Phase 0 + Phase 1 merge.
PRD-06 and PRD-07 run after everything else.

### Validation Checklist (run after every PRD)

```bash
pnpm --filter web test              # All tests pass
pnpm --filter web build             # Build succeeds with no warnings
```

Manual checks:
- [ ] No inline `style={{}}` in changed files
- [ ] No `any` types in changed files
- [ ] No file exceeds 400 lines
- [ ] All form fields have visible `<label>` elements
- [ ] All `<th>` have `scope` attribute
- [ ] All interactive elements have focus-visible styling
- [ ] Loading + error states render for every API-dependent view

---

## What NOT to Change

- **Backend API** (`apps/api/`): No changes. All work is `apps/web/` only.
- **Existing design token values** in `lic-tokens.css`: The tokens are correct. The problem is they aren't being used.
- **Navigation link structure** in `app-shell.tsx`: Keep the same 16 routes. Restructure the shell component code, but preserve all links.
- **API endpoint contracts** in `lib/api.ts` and `lib/intake/leads-api.ts`: The API client is correct. Wrap it in hooks, don't rewrite it.
- **Test infrastructure**: Keep Vitest + RTL. Add tests, don't change the test framework.

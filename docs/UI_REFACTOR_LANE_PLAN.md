# KAR-54 UI/UX Refactor Lane Plan

## Objective
Define a low-risk, PR-sized migration path from the current app UI to the LIC brand/system rules (procedural tone, 8pt grid, square geometry, border-first structure, explicit review/audit workflows).

## Discovery Snapshot

### Frontend Stack
- Framework: Next.js App Router (`apps/web/app`)
- Styling: global CSS + utility classes (`apps/web/app/globals.css`)
- Shared UI components: minimal shell/header only (`apps/web/components/app-shell.tsx`, `apps/web/components/page-header.tsx`)
- Tests: Vitest route-level integration tests in `apps/web/test`

### Route Inventory
- `/dashboard`, `/matters`, `/matters/[id]`, `/contacts`, `/communications`, `/documents`, `/billing`, `/portal`, `/ai`, `/admin`, `/imports`, `/exports`, `/reporting`, `/data-dictionary`, `/login`

## LIC Gap Summary (Current -> Target)
- Color/theming: current gradients/soft tints -> matte Paper/Ink system with sparse blue accent usage.
- Geometry: current rounded cards/inputs/badges -> zero-radius across primitives.
- Depth: current shadows/blur/backdrop effects -> no shadows; hierarchy via heavy/medium rules and spacing.
- Typography: current Space Grotesk + mixed styles -> IBM Plex Sans / Sans Condensed / Mono with uppercase tracked headings.
- Structure: current card-heavy layout -> table-first dense workflows for queue, logs, discovery, reporting.
- Interaction governance: inconsistent review-state visualization -> normalized status workflow `PROPOSED -> IN REVIEW -> APPROVED -> EXECUTED -> RETURNED` with explicit approval gates and timestamped audit feedback.
- Accessibility: focus-visible behavior is not standardized -> global `:focus-visible` contract for all interactive controls.

## Refactor Lane (Phased)

### Phase 0 - Guardrails (KAR-55)
- Define token contract and global base styles (`paper/ink/accent`, type, spacing, rules, focus).
- Add UI lint rules/conventions for `border-radius: 0`, no gradients, no shadows.
- Add baseline visual smoke checks for shell + key forms.

### Phase 1 - Shell + Navigation (KAR-56)
- Refactor global shell and nav to LIC structure (module-first, rule-separated layout).
- Remove blur/gradient treatments from sidebar/topbar.
- Normalize heading/metadata typographic hierarchy.

### Phase 2 - Primitive Uplift (KAR-57)
- Build reusable primitives: `Button`, `Input`, `Textarea`, `Select`, `Badge`, `Table`, `Card`, `Drawer`, `Modal`, `Toast`.
- Adopt primitives incrementally by page; prevent new one-off styles.

### Phase 3 - Accessibility Remediation (KAR-58)
- Keyboard/focus pass on all primary workflows.
- Label/error semantics normalization for forms.
- Contrast and status-not-color-only validation.

### Phase 4 - Responsive Matrix (KAR-59)
- Define responsive behavior by route (desktop/tablet/mobile).
- Validate dense tables, forms, and review drawers at breakpoints.
- Fix overflow and action reachability regressions.

### Phase 5 - Regression + Release Controls (KAR-60)
- Expand web regression coverage for shell/primitives and high-traffic workflows.
- Add final smoke script for approval/send flows.
- Produce rollout checklist and fallback plan.

## PR Sequence (Small, Mergeable Steps)
1. Token + global style baseline only.
2. Shell/navigation migration.
3. Primitive library introduction (no route rewrites yet).
4. Matter/queue-heavy pages converted to table-first primitives.
5. Approval/review workflow visual standardization.
6. Accessibility + responsive cleanup.
7. Regression hardening and final polish.

## Verification Standard Per Slice
- `pnpm --filter web test`
- `pnpm test`
- `pnpm build`
- Manual checks: keyboard navigation, focus-visible, no console errors on touched routes.

## Non-Goals for KAR-54
- No backend API changes.
- No full visual rewrite in a single PR.
- No migration of every page in this planning slice.

# LIC Legal Suite — Frontend Refactoring Plan

> **Date:** 2026-03-02
> **Status:** Draft for review
> **Scope:** `apps/web/` — Next.js 15 + React 19 frontend
> **Reference:** Brand Identity Document v. 2.19.2026_5 (Figma export)

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current State Assessment](#2-current-state-assessment)
3. [Design System Gap Analysis](#3-design-system-gap-analysis)
4. [Refactoring Phases](#4-refactoring-phases)
5. [PRD-01: Design Token & Component Foundation](#prd-01-design-token--component-foundation)
6. [PRD-02: State Management & Data Layer](#prd-02-state-management--data-layer)
7. [PRD-03: Form System & Validation](#prd-03-form-system--validation)
8. [PRD-04: GP-01 Intake-to-Matter Workflow Rebuild](#prd-04-gp-01-intake-to-matter-workflow-rebuild)
9. [PRD-05: Page-by-Page UI Overhaul](#prd-05-page-by-page-ui-overhaul)
10. [PRD-06: Accessibility & Interaction Compliance](#prd-06-accessibility--interaction-compliance)
11. [PRD-07: Performance & Code Quality](#prd-07-performance--code-quality)
12. [Migration Strategy](#migration-strategy)
13. [File Inventory](#file-inventory)

---

## 1. Executive Summary

The LIC Legal Suite frontend was scaffolded rapidly with Codex. While the backend API layer and data model are sound, the frontend has accumulated significant UX debt that prevents the application from functioning as a production-quality litigation operations platform.

**Core problems:**

- **Inline styles everywhere.** Pages use hardcoded pixel values (`marginBottom: 14`, `gridTemplateColumns: '1fr 1fr 1fr 120px'`) instead of the design token system defined in `lic-tokens.css` and the Brand Identity Document.
- **No form validation.** Every form in the app submits without client-side validation. Errors from the API are silently swallowed.
- **State explosion.** Pages use 10–20+ individual `useState` hooks with no custom hooks, no shared patterns, and no data caching. The Matters detail page is 100K+ lines.
- **GP-01 workflow is skeletal.** The intake wizard renders raw `Object.entries(form)` as a key/value table. The conflict check, engagement, and conversion pages are ~50 lines each with hardcoded default values.
- **No loading or error states.** Most pages show blank content until data arrives, then silently show nothing if the API fails.
- **Accessibility violations.** Missing ARIA labels, table headers without scope, color-only status indicators, no keyboard trap management in modals.
- **Brand document not implemented.** The Brand Identity Document specifies 60+ shadcn/ui-based components, an 8px spacing grid, IBM Plex type scale, square corners, instant transitions, and a full GP-01 screen specification. Almost none of this is reflected in the running app.

**Goal:** Rebuild the frontend layer-by-layer so every screen matches the Brand Identity Document specifications, the GP-01 workflow is fully functional with proper gating, and the UX meets the institutional standard: "predictable, immediate, and silent."

---

## 2. Current State Assessment

### 2.1 What Works

| Area | Status |
|------|--------|
| App shell / sidebar navigation | Good — responsive breakpoints, skip link, proper active states |
| CSS token file (`lic-tokens.css`) | Good — color, spacing, and font tokens defined |
| Global stylesheet (`globals.css`) | Good — 951 lines of institutional styles, responsive modes |
| Basic UI primitives (`components/ui/`) | Functional — Button, Input, Card, Badge, Table, Select, Modal, Drawer, Toast |
| API client (`lib/api.ts`) | Functional — session management, auto-refresh, error retry |
| Intake leads API (`lib/intake/leads-api.ts`) | Functional — covers full GP-01 endpoint surface |
| Test infrastructure | Present — Vitest + RTL with regression tests for key flows |

### 2.2 What Does Not Work

| Area | Severity | Description |
|------|----------|-------------|
| **Inline styles** | Critical | Every page uses hardcoded `style={{}}` instead of CSS classes/tokens |
| **Form validation** | Critical | Zero client-side validation across all forms |
| **Error handling** | Critical | API errors silently caught, no user feedback |
| **Loading states** | High | Pages render blank/`...` while fetching data |
| **GP-01 Intake Wizard** | Critical | Renders `Object.entries()` as generic table, no stepped wizard |
| **GP-01 Conflict Check** | Critical | Hardcoded query text, no match results display, no audit trail |
| **GP-01 Engagement** | Critical | Raw template ID input, no template selection, no eSign status lifecycle |
| **GP-01 Convert** | High | Hardcoded matter name/number, no participant model |
| **Matters page** | Critical | 19+ useState hooks, hardcoded sample data, two redundant form patterns |
| **Matter detail page** | Critical | 100K+ lines, monolithic, unmanageable |
| **Dashboard** | High | No clickable metric cards, inline styles, silent error fallback |
| **Admin page** | High | 20+ useState hooks, all data loaded upfront, no pagination |
| **Contacts page** | Medium | Complex but functional; grid layouts hardcoded |
| **Documents page** | High | No upload progress, weak error handling |
| **AI page** | Medium | Functional review gates, but massive state, inline styles |
| **Portal page** | High | Hardcoded grid columns, weak file upload validation |
| **Type safety** | Medium | Widespread `any` types in useState and API responses |
| **Accessibility** | High | Missing ARIA, no scope on th, color-only indicators |
| **Responsive** | Medium | Hardcoded grid templates break on compact/tablet viewports |

### 2.3 Page Complexity Ranking

| Page | Lines | useState Hooks | Inline Styles | Priority |
|------|-------|---------------|---------------|----------|
| Matters `[id]` detail | ~106K | 50+? | Pervasive | P0 — Must rewrite |
| Matters list | 303 | 19 | Heavy | P0 |
| AI Workspace | 918 | 10+ | Heavy | P1 |
| Admin | 765 | 20+ | Heavy | P1 |
| Contacts | 653 | 14+ | Moderate | P1 |
| Documents | 435 | 8+ | Heavy | P1 |
| Portal | 385 | 6+ | Heavy | P1 |
| Analyst | 325 | 5 | Moderate | P2 |
| Auditor | 318 | 5 | Moderate | P2 |
| Dashboard | 76 | 3 | Heavy | P1 |
| Intake Queue | 67 | 2 | Light | P1 |
| Intake stages (×4) | ~50 ea. | 2–4 | Light | P0 — Must rebuild |
| Login | ~80 | 4 | Moderate | P2 |
| Reporting | 63 | 2 | Light | P2 |

---

## 3. Design System Gap Analysis

The Brand Identity Document specifies a complete design system. Here is what exists vs. what's missing in the running app.

### 3.1 Tokens & Foundations

| Spec | Brand Doc | Current App | Gap |
|------|-----------|-------------|-----|
| Color palette (10 values) | Defined | `lic-tokens.css` has all 10 | None — tokens exist |
| Spacing scale (8 values) | 4–96px, 8px base | `lic-tokens.css` has all 8 | Tokens exist but **not used** — pages use inline px values |
| Typography scale (8 levels) | Display through Micro | Partially in `globals.css` | Missing explicit utility classes for each level |
| Font families (3) | Mono, Sans, Serif | Mono + Sans loaded | **Serif (IBM Plex Serif) not loaded**, not used |
| Border/radius | Square corners, 1–4px rules | `globals.css` sets `border-radius: 0` | Correct |
| Motion | 0ms–120ms, linear only | `globals.css` disables transitions | Correct |
| Focus ring | 2px Institutional Blue + offset | Defined in tokens | Correct |

### 3.2 Components

| Component | Brand Doc Spec | Current Implementation | Gap |
|-----------|---------------|----------------------|-----|
| Button (4 variants, 3 sizes) | Primary/Secondary/Ghost/Destructive, Sm/Md/Lg | 4 variants exist, single size | **Missing size variants** |
| Form inputs | Label above, focus/error/disabled states | Input exists, no error state styling | **No error state rendering** |
| Checkbox/Radio/Toggle | Custom styled, no animation | Not implemented | **Missing entirely** |
| Stepper/Wizard | Numbered steps, progress indicator | `StageNav` is a flat link bar | **Must rebuild as proper stepper** |
| Card (structured) | Header/Body/Footer with module code | Simple `<div className="card">` | **Missing structured card** |
| Status tags | Colored rule + monospace label | Badge component exists | Functional — minor adjustments needed |
| Data display (KV pairs) | Stacked and inline patterns | Not implemented as component | **Missing** |
| Sortable tables | Ink headers, alternating rows | Table exists, no sort | **Missing sort, alternating rows** |
| Confirmation dialog | Typed confirmation for destructive actions | Basic confirm dialog exists | **Missing typed confirmation** |
| Toast | Bottom-right, 8s, max 3 visible | Toast stack exists | Functional — needs 8s timeout, 3-max limit |
| Inline alerts | Colored left rule + text | `.notice` / `.error` classes exist | Functional |
| Sidebar shell | Fixed 280px, Ink bg, active state | Implemented | Good |
| Top bar | 48px, Paper bg | Implemented via PageHeader | Good |

### 3.3 GP-01 Workflow Screens

| Screen | Brand Doc Spec | Current Implementation | Gap |
|--------|---------------|----------------------|-----|
| GP-01-A: Intake Queue | Filterable table, source/stage/owner, filter tabs, pagination | Basic table, no filters, no pagination | **Major rebuild** |
| GP-01-B: Lead Intake Wizard | 5-step progressive stepper, save-as-draft, uploads, duplicate detection | Renders `Object.entries()` as generic table | **Complete rewrite** |
| GP-01-C: Lead Detail + AI Summary | Side-by-side lead data + AI artifact, tabs, citations | Not implemented | **Not built** |
| GP-01-D: Conflict Check | Fuzzy match results, confidence scores, append-only audit trail | Single textarea + two buttons | **Major rebuild** |
| GP-01-E: Engagement Letter | Template picker, merge preview, eSign lifecycle tracking | Raw template ID input field | **Major rebuild** |
| GP-01-F: Convert to Matter | Participant graph, ethical wall toggle, role assignment | 3 text inputs + submit | **Major rebuild** |
| GP-01-G: Matter Overview + Checklist | Setup checklist with deep links, completeness indicator | Basic checklist table | **Major rebuild** |

---

## 4. Refactoring Phases

```
Phase 0 ─ Foundation          (PRD-01, PRD-02)        Tokens, components, data hooks
Phase 1 ─ Forms & Validation  (PRD-03)                Form system, Zod schemas
Phase 2 ─ GP-01 Workflow      (PRD-04)                Intake-to-Matter rebuild
Phase 3 ─ Page Overhaul       (PRD-05)                Every remaining page
Phase 4 ─ Polish              (PRD-06, PRD-07)        Accessibility, performance
```

Each phase builds on the prior. Phase 0 produces the primitives that every subsequent phase consumes. Phase 2 (GP-01) is the core workflow and the highest-impact UX improvement.

---

## PRD-01: Design Token & Component Foundation

### Objective

Establish a component library that faithfully implements the Brand Identity Document so that every page can be built from approved parts without ad-hoc styling.

### Scope

| Deliverable | Description |
|-------------|-------------|
| **Typography utilities** | CSS classes for all 8 type scale levels (`.type-display` through `.type-micro`) using correct font family, weight, size, tracking, and leading |
| **Spacing utilities** | CSS classes or Tailwind extensions for the 8-step spacing scale (`.space-1` through `.space-8`) |
| **Button sizes** | Add `sm` (24px), `md` (40px), `lg` (48px) variants to `components/ui/button.tsx` |
| **Form control states** | Add `error`, `disabled`, `focus` visual states to Input, Select, Textarea |
| **Checkbox, Radio, Toggle** | New primitives matching Brand Doc spec (square check, dot radio, sliding toggle) |
| **Structured Card** | Card with Header (module code + status), Body, Footer (metadata) |
| **Key-Value Display** | `<KVStack>` and `<KVInline>` components for data display |
| **Stepper** | `<Stepper>` component with numbered steps, active/complete indicators |
| **Typed Confirmation Dialog** | Extend `confirm-dialog.tsx` with typed-input confirmation for destructive actions |
| **Toast limits** | Enforce 8-second duration and 3-toast maximum in `toast-stack.tsx` |
| **Table enhancements** | Add sortable column headers, alternating row backgrounds, column scope attributes |
| **IBM Plex Serif** | Load via Google Fonts alongside existing Mono/Sans |

### Acceptance Criteria

- [ ] Every component renders correctly with square corners, no easing, instant state transitions
- [ ] All interactive elements show the specified focus ring (2px Institutional Blue, 2px offset)
- [ ] Error states render with 2px Filing Red border + light red background
- [ ] Disabled states render with Fog border + Silver text + not-allowed cursor
- [ ] A visual specimen page (`/dev/specimens`) renders all components for review (dev only)
- [ ] No inline `style={{}}` attributes in any component file
- [ ] Existing regression tests continue to pass

### Files to Create/Modify

| Action | File |
|--------|------|
| Modify | `app/globals.css` — add typography utilities, spacing utilities |
| Modify | `components/ui/button.tsx` — add size prop |
| Modify | `components/ui/input.tsx` — add error/disabled visual states |
| Modify | `components/ui/select.tsx` — add error/disabled visual states |
| Modify | `components/ui/textarea.tsx` — add error/disabled visual states |
| Create | `components/ui/checkbox.tsx` |
| Create | `components/ui/radio.tsx` |
| Create | `components/ui/toggle.tsx` |
| Create | `components/ui/stepper.tsx` |
| Create | `components/ui/kv-display.tsx` |
| Modify | `components/ui/card.tsx` — add structured variant (header/body/footer) |
| Modify | `components/ui/table.tsx` — add sort, alternating rows, scope |
| Modify | `components/ui/toast.tsx` — enforce 8s duration |
| Modify | `components/toast-stack.tsx` — enforce 3-toast max |
| Modify | `components/confirm-dialog.tsx` — add typed confirmation variant |
| Modify | `app/(root)/layout.tsx` or `app/layout.tsx` — load IBM Plex Serif |

---

## PRD-02: State Management & Data Layer

### Objective

Replace per-page state explosion with a structured data layer using custom hooks, proper loading/error states, and type-safe API integration.

### Scope

| Deliverable | Description |
|-------------|-------------|
| **`useApiQuery` hook** | Generic data-fetching hook wrapping `apiFetch` with loading, error, data, and refetch states. Handles 401 retry internally. |
| **`useApiMutation` hook** | Generic mutation hook returning `{ mutate, loading, error, data }` with optimistic update support |
| **Domain hooks** | `useLeads()`, `useLead(id)`, `useMatters()`, `useMatter(id)`, `useContacts()`, `useDashboardSnapshot()`, etc. — each encapsulating API endpoint, type, and caching |
| **Type definitions** | Shared TypeScript interfaces in `lib/types/` for Lead, Matter, Contact, Document, Invoice, AiJob, Conflict, Engagement, etc. — replacing all `any` types |
| **Loading component** | `<LoadingState />` — consistent loading indicator (linear motion per Brand Doc, no shimmer) |
| **Error component** | `<ErrorState />` — consistent error display with retry action |
| **Empty state component** | `<EmptyState />` — consistent messaging when a list has zero items |

### Acceptance Criteria

- [ ] No page has more than 5 direct `useState` calls (remaining state lives in custom hooks)
- [ ] Every API-dependent page shows a loading indicator during fetch
- [ ] Every API-dependent page shows an error state with retry on failure
- [ ] All API response types are defined — zero `any` types in hooks
- [ ] `useApiQuery` deduplicates concurrent requests to the same endpoint
- [ ] All existing regression tests pass with hooks replacing direct fetch

### Files to Create/Modify

| Action | File |
|--------|------|
| Create | `lib/hooks/use-api-query.ts` |
| Create | `lib/hooks/use-api-mutation.ts` |
| Create | `lib/hooks/use-leads.ts` |
| Create | `lib/hooks/use-matters.ts` |
| Create | `lib/hooks/use-contacts.ts` |
| Create | `lib/hooks/use-dashboard.ts` |
| Create | `lib/hooks/use-documents.ts` |
| Create | `lib/hooks/use-billing.ts` |
| Create | `lib/hooks/use-ai.ts` |
| Create | `lib/hooks/use-admin.ts` |
| Create | `lib/types/lead.ts` |
| Create | `lib/types/matter.ts` |
| Create | `lib/types/contact.ts` |
| Create | `lib/types/document.ts` |
| Create | `lib/types/common.ts` (shared enums, pagination, etc.) |
| Create | `components/loading-state.tsx` |
| Create | `components/error-state.tsx` |
| Create | `components/empty-state.tsx` |

---

## PRD-03: Form System & Validation

### Objective

Implement a consistent form system with client-side validation, proper error display, and accessible labeling across all data-entry surfaces.

### Scope

| Deliverable | Description |
|-------------|-------------|
| **Install `react-hook-form`** | Form state management library — eliminates per-field useState |
| **Zod schema integration** | Connect existing Zod dependency to react-hook-form via `@hookform/resolvers/zod` |
| **`<FormField>` wrapper** | Component that renders label + control + error message with correct Brand Doc styling (label above, error below in Filing Red) |
| **Validation schemas** | Zod schemas for: new lead, intake draft (all sections), conflict resolution, engagement generation, matter creation, contact creation, document upload, message composition |
| **Validate on blur + submit** | Per Brand Doc: validate fields on blur, validate entire form on submit, focus first error on failure |
| **Button loading state** | Disable button + show "Submitting..." during async operations to prevent double-submit |

### Acceptance Criteria

- [ ] Every form in the app uses react-hook-form + Zod — no manual `useState` for form fields
- [ ] Validation errors appear below the relevant field in Filing Red with a 2px left border
- [ ] Submit buttons disable and show loading state during API calls
- [ ] Focus moves to the first error field on submit failure
- [ ] Error messages use "problem + fix" language (e.g., "Matter name is required. Enter a name to continue.")
- [ ] All form fields have visible `<label>` elements with `htmlFor` binding

### Files to Create/Modify

| Action | File |
|--------|------|
| Install | `react-hook-form`, `@hookform/resolvers` (devDependencies) |
| Create | `components/ui/form-field.tsx` |
| Create | `lib/schemas/lead.ts` |
| Create | `lib/schemas/matter.ts` |
| Create | `lib/schemas/contact.ts` |
| Create | `lib/schemas/intake.ts` |
| Create | `lib/schemas/engagement.ts` |
| Create | `lib/schemas/document.ts` |
| Create | `lib/schemas/common.ts` |
| Modify | Every page with a form (see PRD-05 for page list) |

---

## PRD-04: GP-01 Intake-to-Matter Workflow Rebuild

### Objective

Rebuild the GP-01 workflow from the ground up to match the Brand Identity Document screen specifications. This is the core operational workflow of the application and the highest-impact UX improvement.

### Current State

The existing intake flow is a series of minimal pages (~50 lines each) that expose raw API parameters as text fields. The intake draft page literally renders `Object.entries(form)` as a generic table. There is no stepped wizard, no file uploads, no duplicate detection, no conflict match display, no template selection, no eSign lifecycle tracking, and no participant model.

### Screen-by-Screen Specification

#### GP-01-A: Intake Queue (`/intake`)

**Current:** Basic table with lead name, stage, source, timestamp. No filters, no pagination.

**Target:**

| Element | Specification |
|---------|---------------|
| Filter tabs | All / New / In Review / Conflict Hold / Ready — tab-style navigation above table |
| Table columns | LEAD (name + short ID), SOURCE (with portal indicator ◆), STAGE (status tag), TYPE, ATTORNEY, CREATED, NEXT ACTION (button) |
| Pagination | Bottom pagination with counts (e.g., "Showing 1–25 of 142") |
| New lead button | Top-right primary action |
| Portal indicator | ◆ glyph next to source for portal-originated leads; portal leads cannot be bulk-deleted |
| Empty state | "No leads match the current filter." with create action |
| Search | Text search across lead name, source, attorney |

**Files:**
- Rewrite: `app/intake/page.tsx`
- Create: `components/intake/intake-queue-filters.tsx`

#### GP-01-B: Lead Intake Wizard (`/intake/[leadId]/intake`)

**Current:** Renders `Object.entries(form)` as key/value table with generic text inputs.

**Target:**

| Element | Specification |
|---------|---------------|
| Stepper | 5-step horizontal stepper: CLIENT → PROPERTY → DISPUTE → UPLOADS → REVIEW |
| Step 1: Client | First name, last name, email, phone, company, role. Duplicate detection inline alert. |
| Step 2: Property | Address, city, state, zip, parcel ID, property type, year built |
| Step 3: Dispute | Contract date/price, defect categories (multi-select), severity, damages, liens, insurance claims |
| Step 4: Uploads | Drag-and-drop upload zone (dashed border). File list with status indicators. Category suggestion per file. |
| Step 5: Review | Read-only summary of all steps. Edit links per section. Final submit button. |
| Auto-save | Save draft on step navigation. Show "Draft saved" badge in header. |
| Navigation | Back / Save Draft / Continue → buttons at bottom. Continue disabled until required fields valid. |
| Duplicate detection | On Step 1 blur of name/email, check for existing contacts. Show confidence, match rationale, and link/create options. |

**Files:**
- Rewrite: `app/intake/[leadId]/intake/page.tsx`
- Create: `components/intake/wizard-step-client.tsx`
- Create: `components/intake/wizard-step-property.tsx`
- Create: `components/intake/wizard-step-dispute.tsx`
- Create: `components/intake/wizard-step-uploads.tsx`
- Create: `components/intake/wizard-step-review.tsx`
- Create: `components/intake/duplicate-alert.tsx`
- Create: `components/intake/upload-dropzone.tsx`
- Create: `lib/schemas/intake.ts` (Zod schemas per step)
- Modify: `lib/intake/intake-wizard-adapter.ts` (update field mapping)

#### GP-01-C: Lead Detail + AI Summary (NEW PAGE)

**Current:** Not implemented.

**Target:**

| Element | Specification |
|---------|---------------|
| Layout | Two-column: lead record (left, 60%) + AI artifact panel (right, 40%) |
| Lead record | KV display of all captured fields, grouped by section |
| AI artifact | Draft badge prominently displayed. Source-linked citations. "Mark as reviewed" action. |
| Tabs | Overview / Documents / Timeline / Agents / Activity |
| Missing info | Actionable items list for data gaps — each links to the relevant intake step |

**Files:**
- Create: `app/intake/[leadId]/page.tsx` (or `detail/page.tsx`)
- Create: `components/intake/lead-detail-record.tsx`
- Create: `components/intake/ai-summary-panel.tsx`

#### GP-01-D: Conflict Check (`/intake/[leadId]/conflict`)

**Current:** Single textarea for query, two action buttons, no results display.

**Target:**

| Element | Specification |
|---------|---------------|
| Query | Pre-populated from lead data (client name, opposing parties, property address). Editable. |
| Results table | Fuzzy match results with columns: ENTITY, TYPE, MATCH CONFIDENCE (%), RATIONALE, MATTER |
| Resolution | Per-result resolution: Clear / Potential Conflict / Confirmed Conflict with notes field |
| Audit trail | Append-only timeline of all checks and resolutions. Cannot edit prior entries. |
| Gate | "Proceed to Engagement" button only enabled when all conflicts are resolved or cleared |

**Files:**
- Rewrite: `app/intake/[leadId]/conflict/page.tsx`
- Create: `components/intake/conflict-results-table.tsx`
- Create: `components/intake/conflict-audit-trail.tsx`

#### GP-01-E: Engagement Letter (`/intake/[leadId]/engagement`)

**Current:** Raw template ID text input and envelope ID text input.

**Target:**

| Element | Specification |
|---------|---------------|
| Template picker | Dropdown/card selection of available engagement templates with preview |
| Merge fields | Display extracted merge fields with values from lead record. Editable overrides. |
| Fee arrangement | Fee type (contingency/hourly/flat), rate, retainer amount fields |
| Generate | "Generate Engagement Letter" produces preview (rendered document) |
| Recipient | Confirm recipient name, email. Secondary recipients optional. |
| Send | "Send for Signature" triggers eSign workflow |
| Status lifecycle | Visual status tracker: Draft → In Review → Sent → Viewed → Signed / Declined / Expired |
| Gate | "Proceed to Convert" only enabled when status is Signed |

**Files:**
- Rewrite: `app/intake/[leadId]/engagement/page.tsx`
- Create: `components/intake/template-picker.tsx`
- Create: `components/intake/engagement-preview.tsx`
- Create: `components/intake/esign-status-tracker.tsx`
- Create: `components/intake/fee-arrangement-form.tsx`

#### GP-01-F: Convert to Matter (`/intake/[leadId]/convert`)

**Current:** 3 hardcoded text inputs (matter name, number, practice area) + submit.

**Target:**

| Element | Specification |
|---------|---------------|
| Setup checklist | Visual checklist: Intake ✓, Conflict ✓, Engagement ✓, Ready to Convert status |
| Matter fields | Name (pre-populated), Number (auto-generated with override), Practice Area (dropdown), Case Type (dropdown) |
| Participants | Add participants with role (client, opposing counsel, expert, etc.), side (plaintiff/defendant), and representation links |
| Participant graph | Visual preview of party relationships |
| Ethical wall | Explicit toggle with audit note for ethical wall decision |
| Convert | "Create Matter" button — requires all checklist items complete |

**Files:**
- Rewrite: `app/intake/[leadId]/convert/page.tsx`
- Create: `components/intake/setup-checklist-visual.tsx`
- Create: `components/intake/participant-editor.tsx`
- Create: `components/intake/participant-graph.tsx`
- Create: `components/intake/ethical-wall-toggle.tsx`

#### GP-01-G: Matter Overview + Setup Checklist (NEW)

**Current:** Matter detail page exists but is a 100K-line monolith.

**Target:** After conversion, the new matter opens to a setup checklist view with deep links into relevant configuration areas (document folders, billing setup, team assignment, etc.). Completeness shown as a progress bar (not gamified — just "4 of 12 items complete").

This is addressed in PRD-05 as part of the Matter detail rewrite.

### Stage Navigation

**Current:** `StageNav` component is a flat horizontal link bar.

**Target:** Replace with the `<Stepper>` component from PRD-01 showing:
- Step number and label
- Completed steps: ✓ indicator, Ledger Green
- Active step: Institutional Blue highlight
- Blocked steps: Disabled state, tooltip explaining prerequisite
- Gate enforcement: Steps cannot be skipped; clicking a locked step shows reason

**Files:**
- Rewrite: `components/intake/stage-nav.tsx` (use new `<Stepper>`)

### Acceptance Criteria

- [ ] A lead can be created, triaged, and converted to a matter entirely through the UI
- [ ] The intake wizard saves drafts automatically on step transitions
- [ ] Duplicate contacts are detected during client step and shown with confidence
- [ ] Conflict check displays fuzzy match results with confidence percentages
- [ ] Conflict decisions are recorded in an append-only audit trail
- [ ] Engagement templates can be selected, previewed, and sent for signature
- [ ] eSign status is tracked through the full lifecycle
- [ ] Conversion requires all prior gates to be satisfied
- [ ] Participants can be added with roles and sides
- [ ] Every screen uses components from PRD-01 — no ad-hoc widgets
- [ ] All forms use react-hook-form + Zod from PRD-03

---

## PRD-05: Page-by-Page UI Overhaul

### Objective

Rebuild every non-GP-01 page to use the component foundation (PRD-01), data hooks (PRD-02), and form system (PRD-03). Eliminate all inline styles.

### Dashboard (`/dashboard`)

**Current issues:** Inline styles, no error display, metrics not clickable, "..." loading placeholder.

**Changes:**
- Replace `style={{}}` with CSS utility classes
- Use `useDashboardSnapshot()` hook from PRD-02
- Show `<LoadingState />` during fetch, `<ErrorState />` on failure
- Make metric cards clickable (link to respective pages)
- Move AI warning notice into a proper `<InlineAlert>` component
- Use `<CardGrid>` with structured cards for metrics

### Matters List (`/matters`)

**Current issues:** 19+ useState hooks, hardcoded sample data, two redundant form patterns (quick-add + wizard), no validation.

**Changes:**
- Remove inline intake wizard — matters are created via GP-01 flow only
- Keep quick-add form but convert to react-hook-form + Zod
- Use `useMatters()` hook for data fetching
- Replace hardcoded grid templates with responsive CSS classes
- Add table sorting and pagination
- Remove all hardcoded default values ("Kitchen Remodel Defect", etc.)

### Matter Detail (`/matters/[id]`)

**Current issues:** ~100K lines, monolithic, unmanageable.

**Changes:**
- **Decompose into tabbed sub-pages** using nested Next.js routes:
  - `/matters/[id]/` — Overview + setup checklist
  - `/matters/[id]/participants` — Party management
  - `/matters/[id]/documents` — Matter documents
  - `/matters/[id]/communications` — Matter messages
  - `/matters/[id]/billing` — Matter billing
  - `/matters/[id]/timeline` — Activity timeline
  - `/matters/[id]/tasks` — Deadlines and tasks
- Each sub-page is a separate file, ~100–300 lines max
- Shared matter context via `useMatter(id)` hook
- Tab navigation at top of matter shell

### Contacts (`/contacts`)

**Current issues:** 14+ useState hooks, hardcoded grid templates, complex inline dedupe logic.

**Changes:**
- Extract `useContacts()`, `useDedupeSuggestions()` hooks
- Move dedupe confidence calculation to a utility function
- Replace hardcoded `gridTemplateColumns` with CSS classes
- Improve relationship graph responsiveness

### Documents (`/documents`)

**Current issues:** No upload progress, weak error handling, hardcoded defaults.

**Changes:**
- Use `useDocuments()` hook
- Add upload progress indicator (linear bar, per Brand Doc)
- Add file type/size validation before upload
- Replace inline grid styles with CSS classes
- Add proper error/success toast notifications

### Communications (`/communications`)

**Changes:**
- Use data hooks for threads and messages
- Ensure message composition uses react-hook-form
- Replace inline styles with CSS classes

### Billing (`/billing`)

**Changes:**
- Use `useBilling()` hook
- Replace inline styles with CSS classes
- Add form validation to invoice/expense creation

### AI Workspace (`/ai`)

**Current issues:** 918 lines, 10+ useState hooks, complex review gate state.

**Changes:**
- Extract `useAiJobs()`, `useStylePacks()` hooks
- Move helper functions (`getDeadlineCandidates`, `normalizeDate`) to `lib/ai/utils.ts`
- Replace inline grid styles with CSS classes
- Keep review gate visualization (it's well-built) but migrate to CSS classes

### Admin (`/admin`)

**Current issues:** 765 lines, 20+ useState hooks, all data loaded upfront.

**Changes:**
- Decompose into tabbed sections: Settings / Users / Integrations / Conflicts / Webhooks
- Each section as a separate component
- Lazy-load section data on tab switch
- Use data hooks per section
- Add pagination to webhook delivery log

### Analyst (`/analyst`)

**Changes:**
- Use `useAnalystQueue()` hook
- Replace inline styles with CSS classes
- Improve filter UI with proper Select components

### Auditor (`/auditor`)

**Changes:**
- Use `useAuditorQueue()` hook
- Replace inline styles with CSS classes
- Improve drawer detail panel styling

### Reporting (`/reporting`)

**Changes:**
- Use `useReportingData()` hook
- Add loading and error states (currently absent)
- Replace inline styles

### Portal (`/portal`)

**Changes:**
- Use data hooks for portal sections
- Add file upload validation (type, size)
- Replace hardcoded grid templates
- Fix message composition to use react-hook-form

### Login (`/login`)

**Changes:**
- Convert to react-hook-form with Zod validation
- Add proper error display for auth failures
- Ensure focus management on error

### Acceptance Criteria

- [ ] Zero inline `style={{}}` attributes across all page files
- [ ] Every page uses data hooks from PRD-02
- [ ] Every form uses react-hook-form from PRD-03
- [ ] Every page shows loading, error, and empty states appropriately
- [ ] Matter detail page is decomposed into <300-line sub-pages
- [ ] All existing regression tests pass (updated as needed)
- [ ] Pages render correctly at desktop (1280px+), compact (1024px), and tablet (768px) viewports

---

## PRD-06: Accessibility & Interaction Compliance

### Objective

Achieve WCAG AA compliance and implement all interaction patterns specified in the Brand Identity Document.

### Scope

| Deliverable | Description |
|-------------|-------------|
| **ARIA labeling** | All form inputs have associated labels. All interactive regions have `aria-label` or `aria-labelledby`. All status indicators have `aria-live` regions. |
| **Table semantics** | All `<th>` elements have `scope="col"` or `scope="row"`. All tables have `<caption>` or `aria-label`. |
| **Focus management** | Modal/drawer focus traps. Return focus to trigger on close. Tab order follows visual reading order. No `tabindex > 0`. |
| **Keyboard navigation** | All interactive elements reachable via Tab. Escape closes overlays. Arrow keys navigate within composite widgets. |
| **Color contrast** | Verify all text/background combinations meet WCAG AA (4.5:1 for normal text, 3:1 for large text) |
| **Non-color indicators** | Status indicators include text labels or icons, not just color |
| **Touch targets** | Minimum 44×44px for all interactive elements |
| **Reduced motion** | Respect `prefers-reduced-motion` media query (already partially implemented) |
| **Validation feedback** | Per Brand Doc: validate on blur + submit, focus first error, clear errors when corrected |
| **Confirmation dialogs** | State exact consequence, repeat action verb on primary button, support typed confirmation |
| **Toast behavior** | 8-second duration, max 3 visible, Escape dismisses, accessible announce via `aria-live` |

### Acceptance Criteria

- [ ] `axe-core` audit reports zero critical or serious violations on all pages
- [ ] All interactive flows are completable via keyboard only
- [ ] Screen reader testing confirms all form fields, tables, and status indicators are properly announced
- [ ] Modal and drawer overlays properly trap and restore focus
- [ ] All status badges include text label (not just color)

### Files to Modify

All component and page files. Key targets:
- `components/ui/modal.tsx` — add focus trap
- `components/ui/drawer.tsx` — add focus trap
- `components/ui/table.tsx` — add scope attributes
- `components/ui/toast.tsx` — add aria-live, enforce limits
- `components/confirm-dialog.tsx` — add typed confirmation
- All page files — add aria-labels to interactive regions

---

## PRD-07: Performance & Code Quality

### Objective

Improve load performance, code maintainability, and type safety.

### Scope

| Deliverable | Description |
|-------------|-------------|
| **Code splitting** | Ensure Next.js dynamic imports for heavy pages (AI workspace, Admin, Matter detail) |
| **List pagination** | Client-side pagination for any list > 25 items (contacts, matters, leads, AI jobs, webhooks) |
| **Type elimination** | Remove all `any` types — replace with defined interfaces from PRD-02 |
| **File size limits** | No single page/component file exceeds 400 lines. Decompose if needed. |
| **Test coverage** | Add unit tests for all custom hooks. Add integration tests for GP-01 flow. |
| **Lint rules** | Add ESLint rules: `no-explicit-any`, `no-inline-styles` (custom rule or plugin) |
| **Bundle analysis** | Run `next build` and analyze bundle — identify and fix any oversized chunks |

### Acceptance Criteria

- [ ] No TypeScript `any` types in `apps/web/`
- [ ] No file exceeds 400 lines
- [ ] All custom hooks have unit tests
- [ ] GP-01 flow has integration test coverage
- [ ] Lighthouse performance score > 80 on all pages
- [ ] `next build` completes without warnings

---

## Migration Strategy

### Principles

1. **Incremental, not big-bang.** Each PRD can be merged independently. Pages can be migrated one at a time within PRD-05.
2. **Tests as guardrails.** Existing regression tests must pass at every step. New tests are added alongside new code.
3. **No API changes required.** All refactoring is frontend-only. The backend API surface remains unchanged.
4. **Feature parity first, then enhancement.** Rebuild existing functionality before adding new features (like the Lead Detail page in GP-01-C).

### Branch Strategy

```
main
 └── refactor/prd-01-components       ← Foundation
      └── refactor/prd-02-data-layer   ← Hooks + types
           └── refactor/prd-03-forms   ← Form system
 └── refactor/prd-04-gp01             ← GP-01 rebuild (depends on 01–03)
 └── refactor/prd-05-pages            ← Page overhaul (depends on 01–03)
 └── refactor/prd-06-a11y             ← Accessibility (depends on 01–05)
 └── refactor/prd-07-perf             ← Performance (depends on all)
```

PRDs 04 and 05 can proceed in parallel after 01–03 are merged.

### Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Regressions during migration | Existing Vitest regression suite runs on every PR |
| Scope creep | Each PRD has explicit file list and acceptance criteria |
| Backend API gaps for GP-01 features | PRD-04 notes where API endpoints may need enhancement; flag as blockers |
| Large PR reviews | Break PRD-05 into per-page PRs (dashboard, matters, contacts, etc.) |

---

## File Inventory

### Files to Create (~40 new files)

```
components/ui/checkbox.tsx
components/ui/radio.tsx
components/ui/toggle.tsx
components/ui/stepper.tsx
components/ui/kv-display.tsx
components/ui/form-field.tsx
components/loading-state.tsx
components/error-state.tsx
components/empty-state.tsx
components/intake/intake-queue-filters.tsx
components/intake/wizard-step-client.tsx
components/intake/wizard-step-property.tsx
components/intake/wizard-step-dispute.tsx
components/intake/wizard-step-uploads.tsx
components/intake/wizard-step-review.tsx
components/intake/duplicate-alert.tsx
components/intake/upload-dropzone.tsx
components/intake/conflict-results-table.tsx
components/intake/conflict-audit-trail.tsx
components/intake/template-picker.tsx
components/intake/engagement-preview.tsx
components/intake/esign-status-tracker.tsx
components/intake/fee-arrangement-form.tsx
components/intake/setup-checklist-visual.tsx
components/intake/participant-editor.tsx
components/intake/participant-graph.tsx
components/intake/ethical-wall-toggle.tsx
components/intake/lead-detail-record.tsx
components/intake/ai-summary-panel.tsx
lib/hooks/use-api-query.ts
lib/hooks/use-api-mutation.ts
lib/hooks/use-leads.ts
lib/hooks/use-matters.ts
lib/hooks/use-contacts.ts
lib/hooks/use-dashboard.ts
lib/hooks/use-documents.ts
lib/hooks/use-billing.ts
lib/hooks/use-ai.ts
lib/hooks/use-admin.ts
lib/types/lead.ts
lib/types/matter.ts
lib/types/contact.ts
lib/types/document.ts
lib/types/common.ts
lib/schemas/lead.ts
lib/schemas/matter.ts
lib/schemas/contact.ts
lib/schemas/intake.ts
lib/schemas/engagement.ts
lib/schemas/document.ts
lib/schemas/common.ts
lib/ai/utils.ts
```

### Files to Rewrite (~20 page files)

```
app/intake/page.tsx
app/intake/[leadId]/intake/page.tsx
app/intake/[leadId]/conflict/page.tsx
app/intake/[leadId]/engagement/page.tsx
app/intake/[leadId]/convert/page.tsx
app/intake/new/page.tsx
app/dashboard/page.tsx
app/matters/page.tsx
app/matters/[id]/page.tsx → decompose into sub-routes
app/contacts/page.tsx
app/documents/page.tsx
app/communications/page.tsx
app/billing/page.tsx
app/ai/page.tsx
app/admin/page.tsx
app/analyst/page.tsx
app/auditor/page.tsx
app/reporting/page.tsx
app/portal/page.tsx
app/login/page.tsx
```

### Files to Modify (~15 existing files)

```
app/globals.css
app/layout.tsx (or (root)/layout.tsx)
components/ui/button.tsx
components/ui/input.tsx
components/ui/select.tsx
components/ui/textarea.tsx
components/ui/card.tsx
components/ui/table.tsx
components/ui/modal.tsx
components/ui/drawer.tsx
components/ui/toast.tsx
components/toast-stack.tsx
components/confirm-dialog.tsx
components/page-header.tsx
components/intake/stage-nav.tsx
lib/intake/intake-wizard-adapter.ts
```

### New Dependencies

```
react-hook-form
@hookform/resolvers
```

---

*This document is the authoritative reference for the LIC Legal Suite frontend refactoring. Each PRD is self-contained with scope, deliverables, acceptance criteria, and file lists. Implementation should proceed in phase order: Foundation → Forms → GP-01 → Pages → Polish.*

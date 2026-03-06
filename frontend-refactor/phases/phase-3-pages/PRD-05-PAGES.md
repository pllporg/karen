# PRD-05: Page-by-Page UI Overhaul

> **Phase:** 3 — Pages
> **Branch:** `refactor/prd-05-pages` (or split into per-page branches)
> **Dependencies:** PRD-01 (components), PRD-02 (hooks), PRD-03 (forms)
> **Parallel with:** PRD-04 (GP-01)
> **Cross-reference:** `audit/current-issues.md` for per-file issue inventory

---

## Objective

Rebuild every non-GP-01 page to use the component foundation (PRD-01), data hooks (PRD-02),
and form system (PRD-03). Eliminate ALL inline `style={{}}` attributes. Every page shows
loading, error, and empty states. No file exceeds 400 lines.

---

## Universal Migration Pattern

Every page follows this transformation:

1. **Replace direct `apiFetch` calls** → use domain hooks from PRD-02
2. **Replace manual `useState` for form fields** → use react-hook-form from PRD-03
3. **Replace inline `style={{}}` attributes** → use CSS classes from `globals.css`
4. **Add three states** → `<LoadingState />`, `<ErrorState />`, `<EmptyState />`
5. **Add proper type definitions** → no `any` types
6. **Remove hardcoded sample data** → empty defaults, server-generated values

---

## Page Specifications

### 1. Dashboard (`app/dashboard/page.tsx`)

**Current:** 76 lines. Promise.all fetch, inline styles, "..." loading placeholder, no error display.

**Changes:**
| What | Before | After |
|------|--------|-------|
| Data fetching | Direct `apiFetch` in useEffect | `useDashboardSnapshot()` hook |
| Loading | Shows "..." for each metric | `<LoadingState />` |
| Error | Silent fallback to zeros | `<ErrorState />` with retry |
| Metric cards | Inline `style={{ marginBottom: 14 }}` | `<CardGrid>` with structured `<Card>` |
| Card behavior | Static text | Clickable — each links to its page |
| AI warning | Inline styled `<div>` | Inline alert component with Institutional Blue left border |
| Layout | Inline margins/padding | CSS utility classes `.stack-4`, `.mb-4` |

**Target structure:**
```tsx
export default function DashboardPage() {
  const { data, loading, error, refetch } = useDashboardSnapshot();
  if (loading) return <AppShell><LoadingState /></AppShell>;
  if (error) return <AppShell><ErrorState message={error.message} onRetry={refetch} /></AppShell>;
  return (
    <AppShell>
      <PageHeader title="Dashboard" subtitle="Operations snapshot" />
      <InlineAlert>AI outputs are drafts — attorney review required before client delivery.</InlineAlert>
      <CardGrid>
        <LinkCard href="/matters" module="MT" label="Open Matters" value={data.openMatters} />
        <LinkCard href="/contacts" module="CT" label="Contacts" value={data.contacts} />
        {/* ... */}
      </CardGrid>
    </AppShell>
  );
}
```

### 2. Matters List (`app/matters/page.tsx`)

**Current:** 303 lines. 19 useState hooks. Hardcoded sample data. Two form patterns (quick-add + inline wizard).

**Changes:**
| What | Before | After |
|------|--------|-------|
| Data | `apiFetch` + 3 useState | `useMatters()` hook |
| Quick-add form | 4 manual useState fields | react-hook-form + `createMatterSchema` |
| Inline wizard | 19+ useState fields, hardcoded defaults | REMOVE — matter creation via GP-01 flow |
| Table | Hardcoded grid template | `<Table>` with sortable headers |
| Layout | Inline `gridTemplateColumns` | CSS grid utilities |

**Key decision:** Remove the inline intake wizard entirely. Matters are created through the GP-01 intake-to-matter flow. Keep only the quick-add form for simple matter creation.

**Target:** ~150 lines max. Table + quick-add form + filters.

### 3. Matter Detail (`app/matters/[id]/page.tsx`)

**Current:** ~100,000+ lines. Single monolithic file. Unmanageable.

**CRITICAL CHANGE: Decompose into tabbed sub-routes.**

**New directory structure:**
```
app/matters/[id]/
├── layout.tsx              ← Shared matter header + tab navigation
├── page.tsx                ← Overview tab (default) + setup checklist
├── participants/page.tsx   ← Party management
├── documents/page.tsx      ← Matter documents
├── communications/page.tsx ← Matter messages
├── billing/page.tsx        ← Matter billing
├── timeline/page.tsx       ← Activity timeline
├── tasks/page.tsx          ← Deadlines and tasks
```

**Shared layout** (`layout.tsx`): Uses `useMatter(id)` hook. Renders matter header (name, number, status badge, practice area) and tab navigation. Passes matter data to children via context or props.

**Each sub-page:** Self-contained, ~100–300 lines max. Uses its own domain hook(s).

**Tab navigation:** Horizontal tabs (from PRD-01 component set) below the matter header:
Overview | Participants | Documents | Communications | Billing | Timeline | Tasks

**Overview tab** (`page.tsx`):
- Matter summary using `<KVStack>`
- Setup checklist (if newly converted from GP-01): progress indicator + deep-link items
- Recent activity feed (last 10 events)

### 4. Contacts (`app/contacts/page.tsx`)

**Current:** 653 lines. 14 useState hooks. Complex dedupe logic inline. Hardcoded grid templates.

**Changes:**
- Extract `useContacts(filters)` hook for data fetching
- Extract `useDedupeSuggestions(contactId)` hook for dedupe
- Move confidence calculation to `lib/contacts/dedupe-utils.ts`
- Replace `gridTemplateColumns: '1fr 1fr 1fr 160px auto auto'` with CSS grid class
- Keep Toast and ConfirmDialog patterns (they're correct)
- Add pagination (contacts list can be large)

**Decomposition:** Split into:
- `app/contacts/page.tsx` (main list, ~200 lines)
- `components/contacts/contact-table.tsx` (table + filters)
- `components/contacts/dedupe-panel.tsx` (dedupe suggestions + merge)
- `components/contacts/relationship-graph.tsx` (graph visualization)

### 5. Documents (`app/documents/page.tsx`)

**Current:** 435 lines. No upload progress. Weak error handling. Hardcoded defaults.

**Changes:**
- Extract `useDocuments()` hook
- Add upload progress indicator (linear bar, not circular spinner)
- Add file type/size validation before upload (max 50MB, allowed MIME types)
- Replace inline grid styles with `.form-grid-2`
- Add toast notifications for success/error
- Replace hardcoded "Inspection Report" default with empty string

### 6. Communications (`app/communications/page.tsx`)

**Changes:**
- Extract `useThreads()`, `useMessages(threadId)` hooks
- Message composition form uses react-hook-form
- Replace inline styles with CSS classes
- Add loading/error states for thread list and message display

### 7. Billing (`app/billing/page.tsx`)

**Changes:**
- Extract `useBillingData()` hook
- Invoice/expense forms use react-hook-form
- Replace inline styles
- Add loading/error states

### 8. AI Workspace (`app/ai/page.tsx`)

**Current:** 918 lines. 10+ useState hooks. Helper functions mixed in.

**Changes:**
- Extract `useAiJobs(filters)`, `useStylePacks()` hooks
- Move helper functions to `lib/ai/utils.ts`:
  - `getDeadlineCandidates(text: string): DeadlineCandidate[]`
  - `normalizeDate(input: string): string`
  - TOOLS constant
- Keep review gate visualization (it's well-built) but extract to `components/ai/review-gate.tsx`
- Replace inline grid styles with CSS classes
- Add pagination to job list

**Decomposition:**
- `app/ai/page.tsx` (main layout, tab selection, ~150 lines)
- `components/ai/style-pack-manager.tsx` (CRUD for style packs)
- `components/ai/job-creator.tsx` (job creation form)
- `components/ai/job-list.tsx` (job table with filters)
- `components/ai/artifact-reviewer.tsx` (review + approve/reject)
- `components/ai/review-gate.tsx` (pipeline visualization)

### 9. Admin (`app/admin/page.tsx`)

**Current:** 765 lines. 20+ useState hooks. All data loaded upfront.

**DECOMPOSE into tabbed sections:**

```
app/admin/
├── layout.tsx              ← Tab navigation
├── page.tsx                ← Settings (default tab)
├── users/page.tsx          ← User management
├── integrations/page.tsx   ← Integration config
├── conflicts/page.tsx      ← Conflict check profiles
├── webhooks/page.tsx       ← Webhook delivery log
```

Each tab lazy-loads its data on tab switch. Uses its own hook.

### 10. Analyst Dashboard (`app/analyst/page.tsx`)

**Current:** 325 lines. Functional but has inline styles.

**Changes:**
- Extract `useAnalystQueue(filters)` hook
- Replace inline styles with CSS classes
- Improve filter UI with proper Select components from PRD-01
- Keep CSV export (it works)

### 11. Auditor Queue (`app/auditor/page.tsx`)

**Current:** 318 lines. Functional but has inline styles.

**Changes:**
- Extract `useAuditorQueue(filters)` hook
- Replace inline styles with CSS classes
- Drawer detail panel: use proper `<KVStack>` for signal details

### 12. Reporting (`app/reporting/page.tsx`)

**Current:** 63 lines. No error handling. No loading state. `any` types.

**Changes:**
- Extract `useReportingData()` hook
- Add `<LoadingState />` and `<ErrorState />`
- Type the report data properly
- Keep CSV export links

### 13. Portal (`app/portal/page.tsx`)

**Current:** 385 lines. Hardcoded grid templates. Weak file upload.

**Changes:**
- Extract `usePortalData()` hook
- File upload: add type/size validation
- Replace `gridTemplateColumns: '1fr 2fr 1fr 1fr auto'` with CSS grid class
- Message form uses react-hook-form
- Add loading/error states

### 14. Login (`app/login/page.tsx`)

**Changes:**
- Convert to react-hook-form with Zod validation
- Add proper error display for auth failures (inline alert, not just text)
- Focus management: auto-focus email field on mount, focus error field on failure

### 15. Data Dictionary, Imports, Exports

Lower priority. Apply the same pattern: hook for data, CSS classes for layout, loading/error states.

---

## Acceptance Criteria

- [ ] Zero inline `style={{}}` attributes across ALL page files in `apps/web/`
- [ ] Every page uses domain hooks from PRD-02 — no direct `apiFetch` calls
- [ ] Every form uses react-hook-form — no manual useState for form fields
- [ ] Every API-dependent page renders `<LoadingState />`, `<ErrorState />`, `<EmptyState />`
- [ ] Matter detail is decomposed into sub-routes, each <300 lines
- [ ] Admin is decomposed into tabbed sub-routes
- [ ] AI Workspace helper functions extracted to `lib/ai/utils.ts`
- [ ] No file exceeds 400 lines
- [ ] No `any` types in any page file
- [ ] No hardcoded sample data (no "Kitchen Remodel Defect", "Jane Doe", etc.)
- [ ] All existing regression tests pass (updated as needed for new component structure)
- [ ] `pnpm --filter web test` passes
- [ ] `pnpm --filter web build` succeeds

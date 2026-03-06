# PRD-07: Performance & Code Quality

> **Phase:** 4 — Polish
> **Branch:** `refactor/prd-07-perf`
> **Dependencies:** PRD-01 through PRD-06

---

## Objective

Harden code quality, eliminate type safety gaps, enforce file size limits, add test
coverage for new infrastructure, and optimize bundle performance.

---

## Deliverables

### 1. Type Safety — Zero `any`

**Audit and eliminate all `any` types in `apps/web/`.**

Common patterns to fix:

| Pattern | Fix |
|---------|-----|
| `useState<any>()` | Use typed interface: `useState<Matter[]>([])` |
| `useState<any[]>([])` | Use typed array: `useState<Lead[]>([])` |
| `apiFetch<any>()` | Should not appear — pages use typed hooks now |
| Function params `(data: any)` | Define interface or use Zod inference |
| Event handlers `(e: any)` | Use React event types: `ChangeEvent<HTMLInputElement>` |
| API response `(res: any)` | Define response interface in `lib/types/` |

**Add ESLint rule:**
```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error"
  }
}
```

### 2. File Size Limits — 400 Lines Max

**No file in `apps/web/` may exceed 400 lines.**

Files likely to exceed after refactoring (monitor these):
- `app/globals.css` — currently 951 lines. This is acceptable for a central stylesheet.
  Exception: CSS files are exempt from the 400-line rule.
- `app/ai/page.tsx` — must decompose per PRD-05 spec
- `app/contacts/page.tsx` — must decompose per PRD-05 spec

**Add CI check:**
```bash
# Check no .tsx/.ts file exceeds 400 lines (excluding CSS, test files, type files)
find apps/web/app apps/web/components apps/web/lib \
  -name '*.tsx' -o -name '*.ts' | \
  grep -v '.spec.' | grep -v '.test.' | grep -v 'types/' | \
  while read f; do
    lines=$(wc -l < "$f")
    if [ "$lines" -gt 400 ]; then
      echo "FAIL: $f has $lines lines (max 400)"
      exit 1
    fi
  done
```

### 3. Code Splitting

**Ensure Next.js lazy-loads heavy pages:**

Next.js App Router automatically code-splits per route. Verify:
- Each page file is a separate chunk in the build output
- No single chunk exceeds 200KB gzipped

**For heavy components within a page** (e.g., relationship graph, review gate pipeline):
```tsx
import dynamic from 'next/dynamic';

const RelationshipGraph = dynamic(
  () => import('@/components/contacts/relationship-graph'),
  { loading: () => <LoadingState label="Loading graph..." /> }
);
```

Candidates for dynamic import:
- `components/contacts/relationship-graph.tsx`
- `components/intake/participant-graph.tsx`
- `components/ai/review-gate.tsx`

### 4. Pagination

**Every list that could exceed 25 items must be paginated.**

Lists requiring pagination:
| List | Location | Current | Target |
|------|----------|---------|--------|
| Leads queue | `/intake` | No pagination | 25/page with count |
| Matters | `/matters` | No pagination | 25/page with count |
| Contacts | `/contacts` | No pagination | 25/page with count |
| AI jobs | `/ai` | No pagination | 25/page with count |
| Documents | `/documents` | No pagination | 25/page with count |
| Webhook log | `/admin/webhooks` | No pagination | 25/page with count |
| Audit trail entries | Conflict check | No pagination | Show all (typically < 25) |

Pagination component: Use the navigation/pagination from PRD-01 component set.
Pattern: "Showing 1–25 of 142" text + page number buttons.

### 5. Test Coverage

**Unit tests for all custom hooks:**

| Hook | Test File | Key Tests |
|------|-----------|-----------|
| `useApiQuery` | `test/hooks/use-api-query.spec.ts` | Loading state, error state, refetch, dedup |
| `useApiMutation` | `test/hooks/use-api-mutation.spec.ts` | Mutate, loading, error, reset |
| `useLeads` | `test/hooks/use-leads.spec.ts` | Returns typed Lead[], handles filters |
| `useMatters` | `test/hooks/use-matters.spec.ts` | Returns typed Matter[], handles filters |
| `useDashboardSnapshot` | `test/hooks/use-dashboard.spec.ts` | Returns snapshot object |

**Integration tests for GP-01 flow:**

| Test | File | Covers |
|------|------|--------|
| Lead creation | `test/gp01/create-lead.spec.tsx` | New lead form → redirect to wizard |
| Intake wizard | `test/gp01/intake-wizard.spec.tsx` | Step navigation, validation, draft save |
| Conflict check | `test/gp01/conflict-check.spec.tsx` | Run check, resolve, gate enforcement |
| Engagement | `test/gp01/engagement.spec.tsx` | Template pick, generate, send, status |
| Conversion | `test/gp01/convert.spec.tsx` | Checklist gate, participants, convert |

**Accessibility tests:**

Add `jest-axe` tests to every page (see PRD-06).

### 6. ESLint Configuration

Add or verify these rules in the web app's ESLint config:

```json
{
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "react/no-unknown-property": ["error", { "ignore": ["jsx", "global"] }],
    "no-console": ["warn", { "allow": ["warn", "error"] }]
  }
}
```

**Custom lint: no inline styles.**
If no ESLint plugin is available for inline style detection, add a CI script:

```bash
# Check for inline style attributes in TSX files
grep -rn 'style={{' apps/web/app apps/web/components | grep '.tsx:' && \
  echo "FAIL: Inline styles found" && exit 1 || echo "PASS: No inline styles"
```

### 7. Build Validation

```bash
pnpm --filter web build
```

Must complete with:
- Zero TypeScript errors
- Zero ESLint errors
- No "unused variable" warnings for exported types
- Build output logged for chunk size review

### 8. Lighthouse Targets

Run Lighthouse on key pages:

| Page | Performance | Accessibility | Best Practices |
|------|------------|---------------|----------------|
| Dashboard | > 80 | > 90 | > 90 |
| Matters list | > 80 | > 90 | > 90 |
| Intake queue | > 80 | > 90 | > 90 |
| Login | > 90 | > 95 | > 95 |

---

## Acceptance Criteria

- [ ] Zero `any` types in `apps/web/` (ESLint enforced)
- [ ] No `.tsx` or `.ts` file exceeds 400 lines (CSS exempt)
- [ ] Dynamic imports used for heavy components (graph, review gate)
- [ ] Every list > 25 items has pagination
- [ ] Unit tests exist for all custom hooks
- [ ] Integration tests exist for GP-01 flow
- [ ] `jest-axe` tests exist for all pages
- [ ] ESLint config enforces `no-explicit-any`
- [ ] CI script detects inline styles
- [ ] `pnpm --filter web build` succeeds with zero errors/warnings
- [ ] Lighthouse performance > 80 on all key pages
- [ ] Lighthouse accessibility > 90 on all key pages

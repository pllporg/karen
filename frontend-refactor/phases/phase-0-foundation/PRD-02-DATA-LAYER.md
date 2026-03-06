# PRD-02: State Management & Data Layer

> **Phase:** 0 — Foundation
> **Branch:** `refactor/prd-02-data-layer`
> **Dependencies:** None
> **Parallel with:** PRD-01

---

## Objective

Replace the per-page state explosion (10–20+ `useState` hooks per page) with a structured
data layer. Every API-consuming view will use a typed custom hook that encapsulates fetching,
caching, loading state, error state, and refetch. No page will import `apiFetch` directly.

---

## Problem Statement

Current state of the codebase:

| Page | Direct useState Hooks | Direct apiFetch Calls | Type Safety |
|------|--------------------|---------------------|-------------|
| Matters list | 19+ | 3+ | `any` everywhere |
| Matter detail | 50+? | Many | `any` everywhere |
| Admin | 20+ | 10+ | `any` for most |
| Contacts | 14+ | 5+ | Partial types |
| AI Workspace | 10+ | 6+ | Partial types |
| Documents | 8+ | 4+ | `any[]` for lists |
| Portal | 6+ | 5+ | `any` for snapshot |
| Dashboard | 3 | 1 (Promise.all) | `any` for snapshot |

**Problems this causes:**
- State dependencies are invisible (changing one `useState` can break another)
- Loading states are handled ad-hoc or not at all
- Errors are silently swallowed in catch blocks
- Data is re-fetched on every mount with no caching
- Type safety is non-existent — runtime crashes are invisible until users hit them

---

## Deliverables

### 1. Generic API Hooks

**Create:** `lib/hooks/use-api-query.ts`

See `reference/hook-specs.md` for exact signature.

Behavior:
- Wraps `apiFetch` with automatic loading/error/data state management
- Fetches on mount and when `key` changes
- Exposes `refetch()` for manual re-fetching
- Handles 401 errors via the existing session bootstrap in `api.ts`
- Deduplicates concurrent requests to the same key (if two components mount
  with the same query, only one request fires)
- Returns `{ data, loading, error, refetch }`

**Create:** `lib/hooks/use-api-mutation.ts`

Behavior:
- Returns `{ mutate, loading, error, data, reset }`
- `mutate(payload)` triggers the API call
- Sets `loading = true` during flight, `error` on failure, `data` on success
- `reset()` clears error and data state

### 2. Type Definitions

**Create:** `lib/types/common.ts`
```typescript
// Pagination
interface PaginatedResponse<T> { items: T[]; total: number; page: number; pageSize: number; }

// API error
interface ApiError { message: string; statusCode: number; }

// Enum-like status types
type LeadStage = 'DRAFT' | 'SUBMITTED' | 'IN_REVIEW' | 'CONFLICT_HOLD' | 'ENGAGED_PENDING' | 'READY_TO_CONVERT' | 'CONVERTED';
type MatterStatus = 'ACTIVE' | 'CLOSED' | 'ON_HOLD' | 'ARCHIVED';
type ConflictStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'CLEARED' | 'POTENTIAL_CONFLICT' | 'CONFIRMED_CONFLICT';
type EngagementStatus = 'DRAFT' | 'IN_REVIEW' | 'SENT' | 'VIEWED' | 'SIGNED' | 'DECLINED' | 'EXPIRED';
type ReviewGateStatus = 'PROPOSED' | 'IN_REVIEW' | 'APPROVED' | 'EXECUTED' | 'RETURNED';
```

**Create:** `lib/types/lead.ts`
```typescript
interface Lead {
  id: string;
  name: string;
  source: string;
  stage: LeadStage;
  type?: string;
  attorneyId?: string;
  attorneyName?: string;
  isPortalOrigin: boolean;
  createdAt: string;
  updatedAt: string;
}

interface IntakeDraft {
  id: string;
  leadId: string;
  client: { firstName: string; lastName: string; email: string; phone: string; company?: string; role?: string; };
  property: { addressLine1: string; city: string; state: string; zip: string; parcelNumber?: string; propertyType?: string; yearBuilt?: string; };
  dispute: { contractDate?: string; contractPrice?: number; defects: Defect[]; damages: Damage[]; liens: Lien[]; insuranceClaims: InsuranceClaim[]; };
  uploads: UploadedFile[];
  createdAt: string;
  updatedAt: string;
}

// ... (full definitions for Defect, Damage, Lien, InsuranceClaim, UploadedFile, etc.)
```

**Create:** `lib/types/matter.ts`
```typescript
interface Matter {
  id: string;
  matterNumber: string;
  name: string;
  practiceArea: string;
  status: MatterStatus;
  caseType?: string;
  participants: Participant[];
  createdAt: string;
  updatedAt: string;
}

interface Participant {
  id: string;
  contactId: string;
  name: string;
  role: string;
  side: 'PLAINTIFF' | 'DEFENDANT' | 'NEUTRAL';
  representationLink?: string;
}
```

**Create:** `lib/types/contact.ts`
```typescript
interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  company?: string;
  type: 'INDIVIDUAL' | 'ORGANIZATION';
  createdAt: string;
  updatedAt: string;
}
```

**Create:** `lib/types/document.ts`
```typescript
interface Document {
  id: string;
  title: string;
  mimeType: string;
  sizeBytes: number;
  matterId?: string;
  retentionPolicy?: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### 3. Domain Hooks

Each hook wraps `useApiQuery` or `useApiMutation` with the correct endpoint, type, and any
domain-specific logic. See `reference/hook-specs.md` for exact signatures.

| Hook | File | Wraps |
|------|------|-------|
| `useLeads(filters?)` | `lib/hooks/use-leads.ts` | `GET /leads` |
| `useLead(id)` | `lib/hooks/use-leads.ts` | `GET /leads/:id` |
| `useCreateLead()` | `lib/hooks/use-leads.ts` | `POST /leads` (mutation) |
| `useMatters(filters?)` | `lib/hooks/use-matters.ts` | `GET /matters` |
| `useMatter(id)` | `lib/hooks/use-matters.ts` | `GET /matters/:id` |
| `useCreateMatter()` | `lib/hooks/use-matters.ts` | `POST /matters` (mutation) |
| `useContacts(filters?)` | `lib/hooks/use-contacts.ts` | `GET /contacts` |
| `useDashboardSnapshot()` | `lib/hooks/use-dashboard.ts` | `GET /dashboard/snapshot` |
| `useDocuments(filters?)` | `lib/hooks/use-documents.ts` | `GET /documents` |
| `useBillingData()` | `lib/hooks/use-billing.ts` | `GET /billing/summary` |
| `useAiJobs(filters?)` | `lib/hooks/use-ai.ts` | `GET /ai/jobs` |
| `useAdminSettings()` | `lib/hooks/use-admin.ts` | `GET /admin/settings` |

### 4. State Components

**Create:** `components/loading-state.tsx`

```typescript
interface LoadingStateProps {
  label?: string; // Default: "Loading..."
}
```

Visual: Centered in parent container. Single horizontal line animation (linear motion only,
per Brand Doc — no shimmer, no pulse, no spinner). Label in `.type-caption` below.

**Create:** `components/error-state.tsx`

```typescript
interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}
```

Visual: Centered in parent. Filing Red 2px left border. Error message in `.type-body`.
"Try again" button (ghost tone, small size) if `onRetry` provided.

**Create:** `components/empty-state.tsx`

```typescript
interface EmptyStateProps {
  message: string;
  action?: { label: string; onClick: () => void; };
}
```

Visual: Centered in parent. Message in `.type-body` using Slate color.
Action button (secondary tone) if provided.

---

## Migration Pattern

When a page is migrated (in PRD-05), the transformation looks like this:

**BEFORE (current pattern):**
```tsx
const [data, setData] = useState<any[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

useEffect(() => {
  apiFetch<any[]>('/matters')
    .then(setData)
    .catch(() => setError('Failed'))
    .finally(() => setLoading(false));
}, []);
```

**AFTER (target pattern):**
```tsx
const { data: matters, loading, error, refetch } = useMatters();

if (loading) return <LoadingState />;
if (error) return <ErrorState message={error.message} onRetry={refetch} />;
if (!matters.length) return <EmptyState message="No matters found." action={{ label: 'Create Matter', onClick: openCreate }} />;
```

---

## Acceptance Criteria

- [ ] `useApiQuery` correctly manages loading → data | error lifecycle
- [ ] `useApiQuery` deduplicates concurrent requests with same key
- [ ] `useApiMutation` returns loading/error/data/reset correctly
- [ ] All type definitions compile with strict TypeScript — no `any`
- [ ] Every domain hook returns typed data (not `any`)
- [ ] `<LoadingState />` renders linear animation (no shimmer/pulse/spinner)
- [ ] `<ErrorState />` renders with Filing Red accent and retry action
- [ ] `<EmptyState />` renders with Slate text and optional action
- [ ] `pnpm --filter web test` passes
- [ ] `pnpm --filter web build` succeeds

# Hook API Specifications

> Exact TypeScript signatures for all custom hooks.
> All hooks live in `apps/web/lib/hooks/`.
> All hooks wrap `apiFetch` from `lib/api.ts` — pages never import `apiFetch` directly.

---

## Generic Hooks

### useApiQuery (`lib/hooks/use-api-query.ts`)

```typescript
interface UseApiQueryOptions<T> {
  /** Unique cache key. If null/undefined, query is disabled (won't fetch). */
  key: string | null;
  /** The API endpoint path (e.g., '/matters') */
  endpoint: string;
  /** Query parameters appended to the endpoint */
  params?: Record<string, string | number | boolean | undefined>;
}

interface UseApiQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

function useApiQuery<T>(options: UseApiQueryOptions<T>): UseApiQueryResult<T>;
```

**Behavior:**
1. On mount (and when `key` changes), call `apiFetch<T>(endpoint + queryString)`
2. Set `loading = true` before fetch, `false` after
3. On success: set `data`, clear `error`
4. On failure: set `error` (as `ApiError`), clear `data`
5. `refetch()`: re-runs the fetch with the same parameters
6. If `key` is null, skip the fetch (useful for conditional queries)
7. Deduplication: if two hooks with the same `key` are mounted simultaneously,
   only one fetch fires. Both receive the same result.

**Implementation notes:**
- Use `useEffect` with `key` as dependency
- Store a simple in-memory cache `Map<string, Promise>` at module level for dedup
- Clean up stale entries after resolution
- Use `AbortController` for cleanup on unmount

### useApiMutation (`lib/hooks/use-api-mutation.ts`)

```typescript
interface UseApiMutationOptions {
  /** The API endpoint path */
  endpoint: string;
  /** HTTP method */
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}

interface UseApiMutationResult<TInput, TOutput> {
  mutate: (payload: TInput) => Promise<TOutput>;
  loading: boolean;
  error: ApiError | null;
  data: TOutput | null;
  reset: () => void;
}

function useApiMutation<TInput, TOutput>(
  options: UseApiMutationOptions
): UseApiMutationResult<TInput, TOutput>;
```

**Behavior:**
1. `mutate(payload)`: calls `apiFetch<TOutput>(endpoint, { method, body: JSON.stringify(payload) })`
2. Sets `loading = true` during flight
3. On success: sets `data`, clears `error`, returns the result
4. On failure: sets `error`, throws (so caller can catch in form handlers)
5. `reset()`: clears `data` and `error` (useful after dismissing error messages)

---

## Domain Hooks

### useLeads (`lib/hooks/use-leads.ts`)

```typescript
import { Lead } from '../types/lead';

interface UseLeadsFilters {
  stage?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

function useLeads(filters?: UseLeadsFilters): UseApiQueryResult<Lead[]>;

function useLead(id: string | null): UseApiQueryResult<Lead>;

function useCreateLead(): UseApiMutationResult<
  { source: string; notes?: string },
  Lead
>;
```

### useMatters (`lib/hooks/use-matters.ts`)

```typescript
import { Matter } from '../types/matter';

interface UseMattersFilters {
  status?: string;
  practiceArea?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

function useMatters(filters?: UseMattersFilters): UseApiQueryResult<Matter[]>;

function useMatter(id: string | null): UseApiQueryResult<Matter>;

function useCreateMatter(): UseApiMutationResult<
  { name: string; matterNumber: string; practiceArea: string; caseType?: string },
  Matter
>;
```

### useContacts (`lib/hooks/use-contacts.ts`)

```typescript
import { Contact } from '../types/contact';

interface UseContactsFilters {
  type?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

function useContacts(filters?: UseContactsFilters): UseApiQueryResult<Contact[]>;

function useCreateContact(): UseApiMutationResult<
  { firstName: string; lastName: string; email?: string; phone?: string; company?: string; type: string },
  Contact
>;
```

### useDashboardSnapshot (`lib/hooks/use-dashboard.ts`)

```typescript
interface DashboardSnapshot {
  openMatters: number;
  contacts: number;
  pendingTasks: number;
  openInvoices: number;
  aiJobs: number;
}

function useDashboardSnapshot(): UseApiQueryResult<DashboardSnapshot>;
```

### useDocuments (`lib/hooks/use-documents.ts`)

```typescript
import { Document } from '../types/document';

interface UseDocumentsFilters {
  matterId?: string;
  search?: string;
  page?: number;
}

function useDocuments(filters?: UseDocumentsFilters): UseApiQueryResult<Document[]>;

function useUploadDocument(): UseApiMutationResult<FormData, Document>;
```

### useBillingData (`lib/hooks/use-billing.ts`)

```typescript
interface BillingSummary {
  totalOutstanding: number;
  totalPaid: number;
  invoices: Invoice[];
  recentPayments: Payment[];
}

interface Invoice {
  id: string;
  matterId: string;
  matterName: string;
  amount: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'OVERDUE';
  dueDate: string;
}

interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  paidAt: string;
}

function useBillingData(): UseApiQueryResult<BillingSummary>;
```

### useAiJobs (`lib/hooks/use-ai.ts`)

```typescript
interface AiJob {
  id: string;
  tool: string;
  matterId?: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  reviewStatus: 'PROPOSED' | 'IN_REVIEW' | 'APPROVED' | 'EXECUTED' | 'RETURNED';
  createdAt: string;
  completedAt?: string;
}

interface StylePack {
  id: string;
  name: string;
  config: Record<string, unknown>;
}

function useAiJobs(filters?: { status?: string; page?: number }): UseApiQueryResult<AiJob[]>;

function useStylePacks(): UseApiQueryResult<StylePack[]>;

function useCreateAiJob(): UseApiMutationResult<
  { tool: string; matterId?: string; parameters?: Record<string, unknown> },
  AiJob
>;
```

### useAdminSettings (`lib/hooks/use-admin.ts`)

```typescript
interface AdminSettings {
  orgName: string;
  timezone: string;
  features: Record<string, boolean>;
  conflictProfiles: ConflictProfile[];
  webhookDeliveries: WebhookDelivery[];
}

interface ConflictProfile {
  id: string;
  name: string;
  threshold: number;
  active: boolean;
}

interface WebhookDelivery {
  id: string;
  url: string;
  event: string;
  status: number;
  deliveredAt: string;
}

function useAdminSettings(): UseApiQueryResult<AdminSettings>;
```

### useAnalystQueue (`lib/hooks/use-analyst.ts`)

```typescript
interface AnalystItem {
  id: string;
  matterId: string;
  matterName: string;
  stage: string;
  bucket: string;
  assignedTo?: string;
  createdAt: string;
}

function useAnalystQueue(filters?: {
  stage?: string;
  bucket?: string;
  search?: string;
}): UseApiQueryResult<AnalystItem[]>;
```

### useAuditorQueue (`lib/hooks/use-auditor.ts`)

```typescript
interface AuditSignal {
  id: string;
  matterId: string;
  severity: string;
  status: string;
  description: string;
  createdAt: string;
}

function useAuditorQueue(filters?: {
  severity?: string;
  status?: string;
}): UseApiQueryResult<AuditSignal[]>;
```

### useReportingData (`lib/hooks/use-reporting.ts`)

```typescript
interface ReportingData {
  summary: { label: string; value: number }[];
  breakdown: { category: string; count: number; amount: number }[];
}

function useReportingData(): UseApiQueryResult<ReportingData>;
```

### usePortalData (`lib/hooks/use-portal.ts`)

```typescript
interface PortalData {
  snapshot: {
    matters: number;
    pendingDocuments: number;
    unreadMessages: number;
  };
  recentDocuments: Document[];
  recentMessages: { id: string; subject: string; sentAt: string }[];
  envelopes: { id: string; status: string; documentName: string }[];
}

function usePortalData(): UseApiQueryResult<PortalData>;
```

---

## GP-01 Specific Hooks

These extend the base `useLeads` hook with GP-01 workflow operations.

### useIntakeDraft (`lib/hooks/use-leads.ts` — add to existing file)

```typescript
function useCreateIntakeDraft(): UseApiMutationResult<
  { leadId: string; draft: IntakeDraft },
  { id: string }
>;
```

### useConflictCheck (`lib/hooks/use-leads.ts`)

```typescript
interface ConflictResult {
  entity: string;
  type: 'CONTACT' | 'MATTER' | 'ORGANIZATION';
  confidence: number;
  rationale: string;
  matterId?: string;
  resolution?: 'CLEARED' | 'POTENTIAL_CONFLICT' | 'CONFIRMED_CONFLICT';
  resolutionNotes?: string;
}

function useRunConflictCheck(): UseApiMutationResult<
  { leadId: string; query: string },
  { id: string; results: ConflictResult[] }
>;

function useResolveConflict(): UseApiMutationResult<
  { leadId: string; resolved: boolean; notes: string },
  { id: string }
>;
```

### useEngagement (`lib/hooks/use-leads.ts`)

```typescript
interface EngagementEnvelope {
  id: string;
  status: EngagementStatus;
  templateId: string;
  createdAt: string;
}

function useGenerateEngagement(): UseApiMutationResult<
  { leadId: string; templateId: string },
  EngagementEnvelope
>;

function useSendEngagement(): UseApiMutationResult<
  { leadId: string; envelopeId: string },
  EngagementEnvelope
>;
```

### useConvertLead (`lib/hooks/use-leads.ts`)

```typescript
function useConvertLead(): UseApiMutationResult<
  { leadId: string; name: string; matterNumber: string; practiceArea: string },
  Matter
>;
```

### useSetupChecklist (`lib/hooks/use-leads.ts`)

```typescript
interface SetupChecklist {
  intakeDraft: boolean;
  conflictResolved: boolean;
  engagementSigned: boolean;
  readyToConvert: boolean;
}

function useSetupChecklist(leadId: string | null): UseApiQueryResult<SetupChecklist>;
```

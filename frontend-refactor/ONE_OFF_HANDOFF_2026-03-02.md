# One-Off Handoff (Frontend Refactor)

This is a temporary handoff for switching to a new chat.
Canonical ops process is still `docs/OPERATIONS_PLAYBOOK.md`.

## Snapshot

- Generated at: `2026-03-02T21:50:39Z`
- Branch: `main`
- Worktree: dirty (expected during ongoing refactor)

## What Was Completed

### Route decomposition to meet size limits

- `apps/web/app/billing/page.tsx`: `585 -> 322`
- `apps/web/app/documents/page.tsx`: `582 -> 243`
- `apps/web/app/matters/page.tsx`: `404 -> 399`
- `apps/web/app/portal/page.tsx`: `479 -> 206`
- `apps/web/app/contacts/page.tsx`: `653 -> 347`
- `apps/web/app/admin/page.tsx`: `765 -> 350`
- `apps/web/app/ai/page.tsx`: `917 -> 347`
- `apps/web/app/matters/[id]/page.tsx`: `2278 -> 238` (completed; composition-only page)

### New extracted logic files

- `apps/web/app/billing/use-billing-page.ts`
- `apps/web/app/documents/use-documents-page.ts`
- `apps/web/app/portal/use-portal-page.ts`
- `apps/web/app/contacts/use-contacts-page.ts`
- `apps/web/app/admin/use-admin-page.ts`
- `apps/web/app/admin/admin-operations-panels.tsx`
- `apps/web/app/ai/types.ts`
- `apps/web/app/ai/utils.ts`
- `apps/web/app/ai/style-pack-manager.tsx`
- `apps/web/app/ai/job-creator-form.tsx`
- `apps/web/app/ai/jobs-table.tsx`
- `apps/web/app/ai/artifact-review-card.tsx`
- `apps/web/app/matters/[id]/types.ts`
- `apps/web/app/matters/[id]/utils.ts`
- `apps/web/app/matters/[id]/billing-panel.tsx`
- `apps/web/app/matters/[id]/communications-panel.tsx`
- `apps/web/app/matters/[id]/documents-panel.tsx`
- `apps/web/app/matters/[id]/tasks-panel.tsx`
- `apps/web/app/matters/[id]/calendar-panel.tsx`
- `apps/web/app/matters/[id]/deadline-rules-panel.tsx`
- `apps/web/app/matters/[id]/overview-panel.tsx`
- `apps/web/app/matters/[id]/participants-panel.tsx`
- `apps/web/app/matters/[id]/timeline-docket-panel.tsx`
- `apps/web/app/matters/[id]/domain-section-completeness-card.tsx`
- `apps/web/app/matters/[id]/ai-workspace-panel.tsx`
- `apps/web/app/matters/[id]/use-matter-dashboard.ts`
- `apps/web/app/matters/[id]/use-matter-overview.ts`

### Supporting style updates

- `apps/web/app/globals.css` updated with `contacts-*` layout utility classes to remove inline style usage from contacts route.
- `apps/web/app/globals.css` updated with `ai-*` layout classes used by the decomposed AI workspace components.
- Matter dashboard panel extraction in this slice did not add new CSS classes; it preserved existing behavior/markup while moving section code into panel files.

## Validation Status

All run in this session:

1. `pnpm --filter web test` -> pass (`70/70`)
2. `pnpm --filter web build` -> pass
3. `pnpm --filter web lint` -> pass with one pre-existing warning:
   - `apps/web/app/auditor/page.tsx:170` (`react-hooks/exhaustive-deps`)

Targeted specs run and passed during refactor:

- `test/billing-page.spec.tsx`
- `test/documents-page.spec.tsx`
- `test/matters-page.spec.tsx`
- `test/portal-page.spec.tsx`
- `test/contacts-page.spec.tsx`
- `test/admin-page.spec.tsx`
- `test/ai-page.spec.tsx`
- `test/matter-dashboard-page.spec.tsx`

## Housekeeping Status

Run in this session:

1. `pnpm ops:housekeeping` -> pass
2. `pnpm ops:preflight` -> fails only on canonical files being dirty:
   - `tools/backlog-sync/session.snapshot.json`
   - `docs/SESSION_HANDOFF.md`

This is expected after housekeeping refresh until those changes are committed/stashed by workflow owner.

## Current Priority Queue

Largest remaining route files:

1. `apps/web/app/matters/page.tsx` (`399` lines)
2. `apps/web/app/admin/page.tsx` (`350` lines)

All `apps/web/app/**/page.tsx` routes are now `<= 399` lines.
Hook decomposition is in progress: overview state/actions are now split into `use-matter-overview.ts`; remaining target is further domain splitting of `use-matter-dashboard.ts`.

## Recommended Next Steps (Next Chat)

1. Run `pnpm ops:preflight` and record output.
2. Continue decomposition for:
   - `apps/web/app/matters/[id]/use-matter-dashboard.ts` (optional domain-hook split for maintainability)
3. After each slice:
   - `pnpm --filter web test <target spec>`
   - `pnpm --filter web lint`
4. After each stable milestone:
   - `pnpm --filter web test`
   - `pnpm --filter web build`
5. End with:
   - `pnpm ops:housekeeping`
   - `pnpm ops:preflight`

## Copy/Paste Prompt For New Chat

```text
Continue the frontend refactor from frontend-refactor/ONE_OFF_HANDOFF_2026-03-02.md.
Start with housekeeping rules (pnpm ops:preflight), then continue maintainability decomposition in apps/web/app/matters/[id]/use-matter-dashboard.ts.
Keep behavior stable, preserve LIC UI constraints, run targeted tests after each slice, and finish with full web test/build + ops:housekeeping/preflight.
```

# PRD-07-PERF-C Parity Evidence: Route Size Budget Enforcement + Intake/Admin Decomposition

Requirement: `PRD-07-PERF-C` (`KAR-131`)

## Scope

This lane reduces oversized web route files by extracting route-local hooks/components and adds route-size guardrails so future regressions fail earlier.

Touched routes:
- `/admin`
- `/intake/[leadId]/convert`
- `/intake/[leadId]/engagement`

## Decomposition Outcome

Route entry files were reduced to thin wrappers:
- `apps/web/app/admin/page.tsx`: `5` lines
- `apps/web/app/intake/[leadId]/convert/page.tsx`: `5` lines
- `apps/web/app/intake/[leadId]/engagement/page.tsx`: `5` lines

Large route-local logic was moved into scoped modules such as:
- `apps/web/app/admin/admin-workspace.tsx`
- `apps/web/app/admin/admin-conflict-panels.tsx`
- `apps/web/app/intake/[leadId]/convert/use-lead-convert-page.ts`
- `apps/web/app/intake/[leadId]/engagement/use-lead-engagement-page.ts`

## Guardrail Coverage

Test file:

```bash
apps/web/test/route-size-budgets.spec.ts
```

Guardrails enforced:
1. Targeted route entry files stay under strict thin-wrapper limits.
2. Extracted route-local modules for the three decomposed surfaces stay under explicit line-count ceilings.
3. All `page.tsx` route entries remain under the broader global ceiling.

## Validation Commands

```bash
pnpm ops:preflight
pnpm --filter web test
pnpm --filter web test test/route-size-budgets.spec.ts
pnpm --filter web lint
pnpm --filter web build
pnpm test:ui-regression
pnpm --filter api test
```

Validation status:
1. `pnpm ops:preflight` passed on branch `lin/KAR-131-route-size-budget-enforcement-and-intake-admin-decomposition`.
2. `pnpm --filter web test` passed with `25` test files and `91` tests.
3. `pnpm --filter web test test/route-size-budgets.spec.ts` passed with `2` route-budget assertions.
4. `pnpm --filter web lint` passed with one unrelated existing warning in `apps/web/app/auditor/page.tsx`.
5. `pnpm --filter web build` passed when rerun in isolation; an earlier concurrent build attempt failed because it raced with the nested `web build` inside `pnpm test:ui-regression`.
6. `pnpm test:ui-regression` passed, including the LIC style guard, the targeted regression suite, and a production `web build`.
7. `pnpm --filter api test` failed in untouched API files because the generated Prisma client is out of sync with the checked-in service layer; this issue remains outside `KAR-131` scope.

## Constraints Observed

1. No intended visible UI change was introduced; the work was limited to decomposition and guardrails.
2. No screenshot evidence was added because no visible UI delta was intended.
3. Existing repository noise remains in `apps/web/app/auditor/page.tsx` (`react-hooks/exhaustive-deps`) and in the API test lane's Prisma typing drift, both outside this issue scope.

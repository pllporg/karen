# Web Smoke Journey Coverage

Requirement: `REQ-OPS-001`  
Scope: verify critical web journey coverage across auth, dashboard, matter creation, and portal messaging.

## Artifact

- New smoke test: `apps/web/test/smoke-user-journey.spec.tsx`

## Coverage Mapping

- Sign-in flow:
  - `POST /auth/login` request from `LoginPage`
  - session token persistence via web auth utility
- Dashboard workflow:
  - summary fetches for matters/contacts/tasks/invoices/AI jobs
  - count rendering assertions for command-center cards
- Matters workflow:
  - list + create flow (`GET /matters`, `POST /matters`)
  - regression check that matter creation triggers list refresh
- Portal workflow:
  - snapshot load (`GET /portal/snapshot`)
  - secure message send (`POST /portal/messages`) and refreshed message rendering

## Verification

- `pnpm --filter web test -- smoke-user-journey.spec.tsx`
- `pnpm test`
- `pnpm build`

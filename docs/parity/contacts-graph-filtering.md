# Contacts Graph + Filtering Coverage

Requirement: `REQ-MAT-002`  
Scope: contact relationship graph filtering + compound contact filters + inline dedupe visibility.

## Implemented Behavior

- `GET /contacts`
  - supports `search` across display name, primary email, and primary phone.
  - supports compound tag filters:
    - `includeTags` (CSV or repeated query params)
    - `excludeTags` (CSV or repeated query params)
    - `tagMode=any|all` for include semantics.
- `GET /contacts/:id/graph`
  - supports `relationshipTypes` filter (CSV or repeated query params).
  - supports `search` filter over related contact display names.
  - returns graph metadata (`availableRelationshipTypes`, `summary`, `filters`) with nodes/edges.

## UI Coverage

- `apps/web/app/contacts/page.tsx` adds:
  - contact search + include/exclude tag inputs + tag mode selector.
  - apply/clear filter controls.
  - dedupe open-count + highest-confidence indicators inline in contact rows.
  - relationship graph panel with:
    - graph search
    - relationship type filter
    - apply/reset controls
    - edge table rendering of filtered relationships.

## Test Evidence

- API:
  - `apps/api/test/contacts-dedupe.spec.ts` validates:
    - list query shape for compound tag filters.
    - graph response shape and filter propagation.
- Web:
  - `apps/web/test/contacts-page.spec.tsx` validates:
    - compound filter request generation.
    - inline dedupe indicator rendering.
    - graph load + relationship/search filter request generation.

# MyCase Import Verification

Requirement: `REQ-PORT-001`  
Scope: verify MyCase ZIP import parity for entity mapping, diagnostic context, and external-reference linkage integrity.

## Verification Coverage

- Regression suite: `apps/api/test/imports.spec.ts`
- Core assertions added:
  - Import processing remains dependency-safe even when ZIP entry order is unsorted (`matter` -> `invoice` -> `task` -> `payment`).
  - Unlinked `notes/messages` rows import successfully with explicit `unlinked_to_matter` warnings that include source row context.
  - End-to-end fixture import persists `ExternalReference` lineage (`externalParentId`, `importBatchId`) and keeps source metadata in `rawSourcePayload` (`__source_file`, `__source_entity`).

## Commands

- `pnpm --filter api test -- imports.spec.ts`

## Result

`REQ-PORT-001` is now treated as verified based on executable importer assertions plus parity artifact documentation.

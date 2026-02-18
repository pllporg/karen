# Clio Import Verification

Requirement: `REQ-PORT-002`  
Scope: verify Clio CSV/XLSX importer parity for mapping coverage, diagnostics quality, and source-lineage integrity.

## Verification Coverage

- Regression suite: `apps/api/test/imports.spec.ts`
- Hardened assertions include:
  - CSV parsing maps all documented entity groups and preserves per-row source lineage (`__source_entity`, `__source_file`, `__source_row_number`) for communications rows.
  - Row-level unresolved-reference failures include detailed error context (`entityType`, `sourceFile`, `sourceEntity`, `externalId`) for deterministic remediation.
  - XLSX unresolved-reference diagnostics preserve workbook sheet context (`sourceFile: <workbook>#<sheet>`) and row number.
  - XLSX import coverage verifies external-reference payload lineage across communication sheets (`Notes`, `Phone_Logs`, `Emails`) with `externalParentId` linkage and source metadata integrity, including source row numbers.
  - Import summary diagnostics continue to report `warningCodeCounts` and `unmappedColumnsBySource` for template drift visibility.

## Commands

- `pnpm --filter api test -- imports.spec.ts`

## Result

`REQ-PORT-002` is verified with executable importer evidence and documented parity traceability.

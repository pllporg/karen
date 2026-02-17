# Export Conformance Coverage (REQ-PORT-004)

This artifact records full-backup export conformance checks for portability parity.

## Contract Coverage

- Required files are enforced for every full backup:
  - `contacts.csv`
  - `matters.csv`
  - `tasks.csv`
  - `events.csv`
  - `time_entries.csv`
  - `invoices.csv`
  - `payments.csv`
  - `messages.csv`
  - `notes.csv`
  - `custom_fields.csv`
  - `documents/manifest.json`
- Required columns are enforced per CSV file via `apps/api/src/exports/full-backup-contract.ts`.
- Manifest schema checks enforce required fields:
  - `documentId`
  - `documentVersionId`
  - `path`
  - `matterId`
  - `title`
- Manifest paths must remain under `documents/` and resolve to an actual ZIP entry.

## Runtime Behavior

- `POST /exports/full-backup` now validates package conformance before completing the job.
- Export job `summaryJson` records:
  - contract version
  - validation result and issues
  - CSV/document/manifest counts
- Missing document blobs are exported as placeholder text files and mapped in `manifest.json` to preserve path integrity.

## Test Evidence

- `apps/api/test/exports-conformance.spec.ts`
  - validates required file/column presence in produced ZIP
  - validates manifest-to-ZIP path linkage
  - validates placeholder-path behavior when document blob retrieval fails
  - validates conformance error reporting for malformed packages
- `apps/api/test/roundtrip.spec.ts`
  - validates generic contacts import can be exported into canonical full backup contacts CSV (roundtrip coherence)

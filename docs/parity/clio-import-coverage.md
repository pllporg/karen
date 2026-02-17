# Clio Template Import Coverage Matrix

Requirement: `REQ-PORT-002`  
Scope: `clio_template` importer parity for CSV and XLSX.

## Supported Tabs / Entity Types

| Clio tab / `entity_type` alias | Entity type | Canonical fields mapped |
| --- | --- | --- |
| `contacts`, `contact`, `people`, `persons` | `contact` | `id`, `display_name`, `name`, `email`, `phone` |
| `companies`, `company`, `organizations` | `contact` | `id`, `display_name`, `name`, `email`, `phone`, `organization`, `legal_name` |
| `matters`, `matter` | `matter` | `id`, `matter_number`, `name`, `practice_area`, `jurisdiction`, `venue` |
| `tasks`, `task` | `task` | `id`, `matter_id`, `title`, `description`, `due_at` |
| `calendar`, `calendar_events`, `events` | `calendar_event` | `id`, `matter_id`, `title`, `type`, `start_at`, `end_at`, `location`, `description` |
| `activities`, `activity`, `time_entries` | `time_entry` | `id`, `matter_id`, `description`, `started_at`, `ended_at`, `minutes`, `rate`, `amount`, `utbms_phase`, `utbms_task` |
| `notes`, `phone_logs`, `emails`, `messages` | `communication_message` | `id`, `matter_id`, `subject`, `title`, `body`, `note`, `occurred_at` |

## CSV and XLSX Parity

- CSV mode: uses `entity_type` per row and applies the same canonical mapping as XLSX tabs.
- XLSX mode: maps each supported sheet name to the same canonical row normalization used in CSV mode.
- Unknown sheets/entity aliases are ignored (no import row generated).

## Diagnostics

Per-row diagnostics are emitted through `ImportItem`:

- `warningsJson` includes:
  - `missing_matter_reference` or `unlinked_to_matter` for relationship gaps.
  - `unmapped_columns` with exact column names that are not currently mapped.
- `errorsJson` includes row-level import failure context from `ImportsService`.

`ImportBatch.summaryJson` includes:

- `warnings`
- `warningCodeCounts`
- `unmappedColumnsBySource`

This allows operators to identify unmapped template columns directly in import results.

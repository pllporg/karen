# MyCase ZIP Import Coverage Matrix

Requirement: `REQ-PORT-001`  
Scope: `mycase_backup_zip` importer coverage and row-level diagnostics.

## File Coverage

| MyCase CSV file (aliases) | Entity type | Canonical fields mapped |
| --- | --- | --- |
| `contacts.csv` (`contact`, `people`, `persons`) | `contact` | `id`, `display_name`, `name`, `email`, `phone` |
| `companies.csv` (`company`, `organizations`, `firms`) | `contact` | `id`, `display_name`, `name`, `email`, `phone`, `organization`, `legal_name` |
| `matters.csv` (`matter`, `cases`, `case`) | `matter` | `id`, `matter_number`, `case_number`, `name`, `practice_area`, `jurisdiction`, `venue` |
| `tasks.csv` (`task`) | `task` | `id`, `matter_id`, `case_id`, `title`, `description`, `due_at` |
| `calendar_events.csv` (`calendar`, `events`, `appointments`) | `calendar_event` | `id`, `matter_id`, `case_id`, `title`, `type`, `start_at`, `end_at`, `location`, `description` |
| `invoices.csv` (`invoice`) | `invoice` | `id`, `matter_id`, `case_id`, `invoice_number`, `issued_at`, `due_at`, `subtotal`, `tax`, `total`, `balance_due` |
| `payments.csv` (`payment`) | `payment` | `id`, `invoice_id`, `amount`, `received_at`, `reference` |
| `time_entries.csv` (`time_logs`, `activities`) | `time_entry` | `id`, `matter_id`, `case_id`, `description`, `started_at`, `ended_at`, `minutes`, `rate`, `amount`, `utbms_phase`, `utbms_task` |
| `notes.csv` (`note`, `case_notes`) | `communication_message` | `id`, `matter_id`, `case_id`, `subject`, `title`, `body`, `note`, `occurred_at` |
| `messages.csv` (`message`, `emails`, `phone_logs`) | `communication_message` | `id`, `matter_id`, `case_id`, `subject`, `title`, `body`, `note`, `occurred_at` |

## Row-Level Diagnostics

Importer writes row-level diagnostics into `ImportItem`:

- `warningsJson`:
  - missing relationship references detected during parse (for example missing `matter_id`/`case_id` on task/calendar/time rows).
  - unlinked communications imported without matter reference.
- `errorsJson`:
  - import failures with row context payload:
    - `entityType`
    - `rowNumber`
    - `sourceFile`
    - `sourceEntity`
    - `externalId`
    - `externalParentId`
    - `availableFields`

## Processing Order

Rows are imported in dependency-safe order:

1. `contact`
2. `matter`
3. `invoice`
4. `task`
5. `calendar_event`
6. `time_entry`
7. `payment`
8. `communication_message`

This prevents false failures when ZIP entry order is not dependency ordered.

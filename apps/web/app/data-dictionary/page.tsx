import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';

const ROWS = [
  {
    file: 'contacts.csv',
    description: 'Unified contacts (person/org), tags, and primary methods.',
    requiredColumns: 'id, organizationId, kind, displayName, primaryEmail, primaryPhone',
  },
  {
    file: 'matters.csv',
    description: 'Matter core data including stage, type, status, and ethical wall flag.',
    requiredColumns: 'id, organizationId, matterNumber, name, practiceArea, status, openedAt',
  },
  {
    file: 'tasks.csv',
    description: 'Task records with due dates, assignees, checklist/dependency JSON.',
    requiredColumns: 'id, organizationId, matterId, title, dueAt, priority, status',
  },
  {
    file: 'events.csv',
    description: 'Calendar/deadline events with attendance and location fields.',
    requiredColumns: 'id, organizationId, matterId, startAt, endAt, type, location',
  },
  {
    file: 'time_entries.csv',
    description: 'Billable/non-billable time capture with UTBMS support fields.',
    requiredColumns: 'id, organizationId, matterId, startedAt, durationMinutes, amount, status',
  },
  {
    file: 'invoices.csv',
    description: 'Invoice header records including totals, balances, and checkout URL.',
    requiredColumns: 'id, organizationId, matterId, invoiceNumber, status, total, balanceDue',
  },
  {
    file: 'payments.csv',
    description: 'Payment records (manual/stripe) linked to invoices.',
    requiredColumns: 'id, organizationId, invoiceId, amount, method, receivedAt',
  },
  {
    file: 'messages.csv',
    description: 'Communications excluding internal notes.',
    requiredColumns: 'id, organizationId, threadId, type, direction, body, occurredAt',
  },
  {
    file: 'notes.csv',
    description: 'Internal notes and memo-style communications.',
    requiredColumns: 'id, organizationId, threadId, type, direction, body, occurredAt',
  },
  {
    file: 'custom_fields.csv',
    description: 'Custom field values by entity with definition linkage.',
    requiredColumns: 'id, organizationId, entityType, entityId, fieldDefinitionId, valueJson',
  },
  {
    file: 'documents/manifest.json',
    description: 'Links document files to records and matter folders.',
    requiredColumns: 'documentId, documentVersionId, path, matterId, title',
  },
];

export default function DataDictionaryPage() {
  return (
    <AppShell>
      <PageHeader title="Data Dictionary" subtitle="Export format reference for migration portability and round-trip mapping." />
      <div className="card">
        <table aria-label="Data table" className="table">
          <thead>
            <tr>
              <th scope="col">File</th>
              <th scope="col">Description</th>
              <th scope="col">Required Columns</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.file}>
                <td>{row.file}</td>
                <td>{row.description}</td>
                <td>{row.requiredColumns}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

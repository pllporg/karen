import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';

const ROWS = [
  ['contacts.csv', 'Unified contacts (person/org), tags, primary methods'],
  ['matters.csv', 'Matter core data including stage, type, status'],
  ['tasks.csv', 'Task records with due dates, status, assignees'],
  ['events.csv', 'Calendar and deadline-related events'],
  ['time_entries.csv', 'Billable/non-billable time capture'],
  ['invoices.csv', 'Invoices and financial totals'],
  ['payments.csv', 'Payment records (manual/stripe)'],
  ['messages.csv', 'Communications excluding internal notes'],
  ['notes.csv', 'Internal notes and memo-style communications'],
  ['custom_fields.csv', 'Custom field values by entity'],
  ['documents/manifest.json', 'Links document files to records and matter folders'],
];

export default function DataDictionaryPage() {
  return (
    <AppShell>
      <PageHeader title="Data Dictionary" subtitle="Export format reference for migration portability and round-trip mapping." />
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>File</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map(([file, description]) => (
              <tr key={file}>
                <td>{file}</td>
                <td>{description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

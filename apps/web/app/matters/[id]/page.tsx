'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '../../../components/app-shell';
import { PageHeader } from '../../../components/page-header';
import { apiFetch } from '../../../lib/api';

type DeadlinePreviewRow = {
  ruleId: string;
  name: string;
  eventType: string;
  computedDate: string;
};

export default function MatterDashboardPage() {
  const params = useParams() as { id: string };
  const matterId = params.id;
  const [dashboard, setDashboard] = useState<any>(null);
  const [rulesPacks, setRulesPacks] = useState<Array<{ id: string; name: string; pack?: { version?: string } }>>([]);
  const [selectedRulesPackId, setSelectedRulesPackId] = useState('');
  const [triggerDate, setTriggerDate] = useState(new Date().toISOString().slice(0, 10));
  const [previewRows, setPreviewRows] = useState<DeadlinePreviewRow[]>([]);
  const [overrideDates, setOverrideDates] = useState<Record<string, string>>({});
  const [overrideReasons, setOverrideReasons] = useState<Record<string, string>>({});
  const [deadlineStatus, setDeadlineStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!matterId) return;
    apiFetch(`/matters/${matterId}/dashboard`).then(setDashboard).catch(() => undefined);
    apiFetch<Array<{ id: string; name: string; pack?: { version?: string } }>>('/calendar/rules-packs')
      .then((packs) => {
        setRulesPacks(packs);
        if (packs.length > 0) {
          setSelectedRulesPackId(packs[0].id);
        }
      })
      .catch(() => undefined);
  }, [matterId]);

  async function previewDeadlines() {
    if (!matterId || !selectedRulesPackId || !triggerDate) return;
    const preview = await apiFetch<{ previewRows: DeadlinePreviewRow[] }>('/calendar/deadline-preview', {
      method: 'POST',
      body: JSON.stringify({
        matterId,
        triggerDate,
        rulesPackId: selectedRulesPackId,
      }),
    });
    setPreviewRows(preview.previewRows || []);
    setDeadlineStatus(`Previewed ${preview.previewRows?.length || 0} deadlines.`);
  }

  async function applyDeadlines() {
    if (!matterId || !selectedRulesPackId || !triggerDate || previewRows.length === 0) return;
    const selections = previewRows.map((row) => ({
      ruleId: row.ruleId,
      apply: true,
      ...(overrideDates[row.ruleId] ? { overrideDate: overrideDates[row.ruleId] } : {}),
      ...(overrideReasons[row.ruleId] ? { overrideReason: overrideReasons[row.ruleId] } : {}),
    }));
    const result = await apiFetch<{ created: Array<{ id: string }> }>('/calendar/deadline-preview/apply', {
      method: 'POST',
      body: JSON.stringify({
        matterId,
        triggerDate,
        rulesPackId: selectedRulesPackId,
        selections,
      }),
    });
    setDeadlineStatus(`Created ${result.created?.length || 0} calendar events from rules pack.`);
    setPreviewRows([]);
    setOverrideDates({});
    setOverrideReasons({});
    setDashboard(await apiFetch(`/matters/${matterId}/dashboard`));
  }

  return (
    <AppShell>
      <PageHeader
        title={dashboard ? `${dashboard.matterNumber} - ${dashboard.name}` : 'Matter Dashboard'}
        subtitle="Overview, participants, timeline, tasks, calendar, communications, documents, billing, and AI workspace"
      />

      {!dashboard ? <div className="card">Loading...</div> : null}

      {dashboard ? (
        <div className="card-grid">
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Overview</h3>
            <p>Practice Area: {dashboard.practiceArea}</p>
            <p>Status: {dashboard.status}</p>
            <p>Venue: {dashboard.venue || '-'}</p>
            <p>Jurisdiction: {dashboard.jurisdiction || '-'}</p>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Domain Section Completeness</h3>
            <p>
              {dashboard.domainSectionCompleteness?.completedCount || 0}/
              {dashboard.domainSectionCompleteness?.totalCount || 0} sections complete
              {' '}({dashboard.domainSectionCompleteness?.completionPercent || 0}%)
            </p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {Object.entries(dashboard.domainSectionCompleteness?.sections || {}).map(([section, done]) => (
                <li key={section}>
                  {section}: {done ? 'Complete' : 'Missing'}
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Participants</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {dashboard.participants?.map((participant: any) => (
                <li key={participant.id}>
                  {participant.contact?.displayName} - {participant.participantRoleKey} ({participant.side || 'N/A'})
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Timeline & Docket</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {dashboard.docketEntries?.map((entry: any) => (
                <li key={entry.id}>{new Date(entry.filedAt).toLocaleDateString()} - {entry.description}</li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Tasks</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {dashboard.tasks?.map((task: any) => (
                <li key={task.id}>{task.title} ({task.status})</li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Calendar</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {dashboard.calendarEvents?.map((event: any) => (
                <li key={event.id}>{new Date(event.startAt).toLocaleDateString()} - {event.type}</li>
              ))}
            </ul>
          </div>

          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ marginTop: 0 }}>Jurisdictional Deadline Rules Pack</h3>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 180px auto auto' }}>
              <select
                className="select"
                aria-label="Rules Pack"
                value={selectedRulesPackId}
                onChange={(event) => setSelectedRulesPackId(event.target.value)}
              >
                <option value="">Select rules pack</option>
                {rulesPacks.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name} {pack.pack?.version ? `(v${pack.pack.version})` : ''}
                  </option>
                ))}
              </select>
              <input
                aria-label="Trigger Date"
                className="input"
                type="date"
                value={triggerDate}
                onChange={(event) => setTriggerDate(event.target.value)}
              />
              <button className="button secondary" type="button" onClick={previewDeadlines}>
                Preview Deadlines
              </button>
              <button className="button" type="button" onClick={applyDeadlines}>
                Apply Selected
              </button>
            </div>
            {deadlineStatus ? <p style={{ marginTop: 8, color: 'var(--lic-text-muted)' }}>{deadlineStatus}</p> : null}
            {previewRows.length > 0 ? (
              <table className="table" style={{ marginTop: 10 }}>
                <thead>
                  <tr>
                    <th>Rule</th>
                    <th>Computed Date</th>
                    <th>Override Date</th>
                    <th>Override Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={row.ruleId}>
                      <td>{row.name}</td>
                      <td>{new Date(row.computedDate).toLocaleDateString()}</td>
                      <td>
                        <input
                          className="input"
                          type="date"
                          aria-label={`Override Date ${row.ruleId}`}
                          value={overrideDates[row.ruleId] || ''}
                          onChange={(event) =>
                            setOverrideDates((current) => ({
                              ...current,
                              [row.ruleId]: event.target.value,
                            }))
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          aria-label={`Override Reason ${row.ruleId}`}
                          placeholder="Required if override date is set"
                          value={overrideReasons[row.ruleId] || ''}
                          onChange={(event) =>
                            setOverrideReasons((current) => ({
                              ...current,
                              [row.ruleId]: event.target.value,
                            }))
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ marginTop: 10 }}>Preview rules to review computed deadlines before creating events.</p>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Communications</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {dashboard.communicationThreads?.map((thread: any) => (
                <li key={thread.id}>{thread.subject || 'Thread'} ({thread.messages?.length || 0} msgs)</li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Documents</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {dashboard.documents?.map((doc: any) => (
                <li key={doc.id}>{doc.title}</li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Billing</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {dashboard.invoices?.map((invoice: any) => (
                <li key={invoice.id}>{invoice.invoiceNumber} - {invoice.status} - ${invoice.balanceDue}</li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>AI Workspace</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {dashboard.aiJobs?.map((job: any) => (
                <li key={job.id}>{job.toolName} - {job.status}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

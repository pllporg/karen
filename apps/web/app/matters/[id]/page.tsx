'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '../../../components/app-shell';
import { PageHeader } from '../../../components/page-header';
import { apiFetch } from '../../../lib/api';

export default function MatterDashboardPage() {
  const params = useParams() as { id: string };
  const matterId = params.id;
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => {
    if (!matterId) return;
    apiFetch(`/matters/${matterId}/dashboard`).then(setDashboard).catch(() => undefined);
  }, [matterId]);

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

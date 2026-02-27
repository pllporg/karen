'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { Lead, listLeads } from '../../lib/intake/leads-api';

export default function IntakeQueuePage() {
  const [rows, setRows] = useState<Lead[]>([]);

  useEffect(() => {
    listLeads().then(setRows).catch(() => undefined);
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Intake Queue"
        subtitle="Lead staging queue. Process records in order and complete setup checkpoints."
        right={<Link className="button" href="/intake/new">New Lead</Link>}
      />
      <table className="table">
        <thead>
          <tr>
            <th>Lead ID</th>
            <th>Source</th>
            <th>Stage</th>
            <th>Updated</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((lead) => (
            <tr key={lead.id}>
              <td className="mono-meta">{lead.id}</td>
              <td>{lead.source}</td>
              <td><span className="badge status-in-review">{lead.stage}</span></td>
              <td className="mono-meta">{new Date(lead.updatedAt).toLocaleString()}</td>
              <td>
                <Link className="button ghost" href={`/intake/${lead.id}/intake`}>Open Staged Route</Link>
              </td>
            </tr>
          ))}
          {!rows.length ? (
            <tr>
              <td colSpan={5} className="mono-meta">No leads in queue.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </AppShell>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { apiFetch } from '../../lib/api';

type Snapshot = {
  matters: number;
  contacts: number;
  tasks: number;
  invoices: number;
  aiJobs: number;
};

export default function DashboardPage() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<Array<unknown>>('/matters'),
      apiFetch<Array<unknown>>('/contacts'),
      apiFetch<Array<unknown>>('/tasks'),
      apiFetch<Array<unknown>>('/billing/invoices'),
      apiFetch<Array<unknown>>('/ai/jobs'),
    ])
      .then(([matters, contacts, tasks, invoices, aiJobs]) => {
        setSnapshot({
          matters: matters.length,
          contacts: contacts.length,
          tasks: tasks.length,
          invoices: invoices.length,
          aiJobs: aiJobs.length,
        });
      })
      .catch(() => {
        setSnapshot({ matters: 0, contacts: 0, tasks: 0, invoices: 0, aiJobs: 0 });
      });
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Matter Operations Dashboard"
        subtitle="Construction litigation operations, billing, documents, and AI workflows in one tenant-isolated workspace."
      />

      <div className="notice" style={{ marginBottom: 14 }}>
        AI outputs are drafts only. Attorney review and approval are required before use.
      </div>

      <div className="card-grid">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Open Matters</h3>
          <p style={{ fontSize: '2rem', margin: 0 }}>{snapshot?.matters ?? '...'}</p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Contacts</h3>
          <p style={{ fontSize: '2rem', margin: 0 }}>{snapshot?.contacts ?? '...'}</p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Tasks</h3>
          <p style={{ fontSize: '2rem', margin: 0 }}>{snapshot?.tasks ?? '...'}</p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Invoices</h3>
          <p style={{ fontSize: '2rem', margin: 0 }}>{snapshot?.invoices ?? '...'}</p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>AI Jobs</h3>
          <p style={{ fontSize: '2rem', margin: 0 }}>{snapshot?.aiJobs ?? '...'}</p>
        </div>
      </div>
    </AppShell>
  );
}

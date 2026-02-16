'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { apiFetch, getSessionToken } from '../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function ImportsPage() {
  const [sourceSystem, setSourceSystem] = useState('mycase_backup_zip');
  const [entityType, setEntityType] = useState('contact');
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<any>(null);
  const [batches, setBatches] = useState<any[]>([]);

  async function loadBatches() {
    setBatches(await apiFetch<any[]>('/imports/batches'));
  }

  useEffect(() => {
    loadBatches().catch(() => undefined);
  }, []);

  async function runImport(e: FormEvent) {
    e.preventDefault();
    if (!file) return;

    const body = new FormData();
    body.set('sourceSystem', sourceSystem);
    if (sourceSystem === 'generic_csv') {
      body.set('entityType', entityType);
    }
    body.set('file', file);

    const token = getSessionToken();
    const response = await fetch(`${API_BASE}/imports/run`, {
      method: 'POST',
      body,
      headers: token ? { 'x-session-token': token } : undefined,
      credentials: 'include',
    });

    if (!response.ok) {
      setResult({ error: await response.text() });
      return;
    }

    setResult(await response.json());
    await loadBatches();
  }

  return (
    <AppShell>
      <PageHeader title="Import Center" subtitle="Plugin architecture: MyCase ZIP, Clio template CSV/XLSX, and generic CSV imports." />
      <div className="card">
        <form onSubmit={runImport} style={{ display: 'grid', gap: 10, gridTemplateColumns: '240px 190px 1fr auto' }}>
          <select className="select" value={sourceSystem} onChange={(e) => setSourceSystem(e.target.value)}>
            <option value="mycase_backup_zip">MyCase Full Backup ZIP</option>
            <option value="clio_template">Clio Migration Template</option>
            <option value="generic_csv">Generic CSV</option>
          </select>
          <select className="select" value={entityType} onChange={(e) => setEntityType(e.target.value)}>
            <option value="contact">Contact</option>
            <option value="matter">Matter</option>
            <option value="task">Task</option>
            <option value="calendar_event">Calendar Event</option>
            <option value="invoice">Invoice</option>
            <option value="payment">Payment</option>
            <option value="time_entry">Time Entry</option>
            <option value="communication_message">Communication</option>
          </select>
          <input className="input" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button className="button" type="submit">Run Import</button>
        </form>
      </div>

      {result ? (
        <div className="card" style={{ marginTop: 14 }}>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(result, null, 2)}</pre>
        </div>
      ) : null}
      <div className="card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Recent Batches</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Batch</th>
              <th>Source</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id}>
                <td>{batch.id.slice(0, 8)}</td>
                <td>{batch.sourceSystem}</td>
                <td>{batch.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

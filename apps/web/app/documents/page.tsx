'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { getSessionToken } from '../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [matterId, setMatterId] = useState('');
  const [title, setTitle] = useState('Inspection Report');
  const [file, setFile] = useState<File | null>(null);
  const [pdfMatterId, setPdfMatterId] = useState('');

  async function load() {
    const token = getSessionToken();
    const response = await fetch(`${API_BASE}/documents`, {
      headers: token ? { 'x-session-token': token } : {},
      credentials: 'include',
    });
    if (!response.ok) return;
    setDocuments(await response.json());
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function upload(e: FormEvent) {
    e.preventDefault();
    if (!file || !matterId) return;

    const form = new FormData();
    form.set('matterId', matterId);
    form.set('title', title);
    form.set('file', file);

    const token = getSessionToken();
    await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: form,
      headers: token ? { 'x-session-token': token } : undefined,
      credentials: 'include',
    });

    setFile(null);
    await load();
  }

  async function generatePdf() {
    if (!pdfMatterId) return;
    const token = getSessionToken();
    await fetch(`${API_BASE}/documents/generate-pdf`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'x-session-token': token } : {}),
      },
      body: JSON.stringify({
        matterId: pdfMatterId,
        title: 'Generated Client Letter',
        lines: ['Attorney Review Required', 'Draft letter body here.'],
      }),
      credentials: 'include',
    });
    await load();
  }

  return (
    <AppShell>
      <PageHeader title="Documents" subtitle="Secure upload/versioning, malware-scan hook, signed links, and share links." />
      <div className="card" style={{ marginBottom: 14 }}>
        <form onSubmit={upload} style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr 1fr auto' }}>
          <input className="input" placeholder="Matter ID" value={matterId} onChange={(e) => setMatterId(e.target.value)} />
          <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="input" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button className="button" type="submit">Upload</button>
        </form>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
          <input className="input" placeholder="Matter ID for generated PDF" value={pdfMatterId} onChange={(e) => setPdfMatterId(e.target.value)} />
          <button className="button secondary" type="button" onClick={generatePdf}>Generate PDF Draft</button>
        </div>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Matter</th>
              <th>Versions</th>
              <th>Shared</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>{doc.title}</td>
                <td>{doc.matterId}</td>
                <td>{doc.versions?.length || 0}</td>
                <td>{doc.sharedWithClient ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { apiFetch } from '../../lib/api';

export default function CommunicationsPage() {
  const [threads, setThreads] = useState<any[]>([]);
  const [threadId, setThreadId] = useState('');
  const [body, setBody] = useState('Called opposing counsel regarding mediation slots.');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  async function load() {
    const data = await apiFetch<any[]>('/communications/threads');
    setThreads(data);
    if (!threadId && data[0]?.id) setThreadId(data[0].id);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function createThread() {
    const created = await apiFetch<any>('/communications/threads', {
      method: 'POST',
      body: JSON.stringify({ subject: 'New Thread' }),
    });
    setThreadId(created.id);
    await load();
  }

  async function addMessage(e: FormEvent) {
    e.preventDefault();
    if (!threadId) return;
    await apiFetch('/communications/messages', {
      method: 'POST',
      body: JSON.stringify({
        threadId,
        type: 'CALL_LOG',
        direction: 'OUTBOUND',
        body,
      }),
    });
    await load();
  }

  async function search() {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchResults(await apiFetch<any[]>(`/communications/search?q=${encodeURIComponent(query)}`));
  }

  return (
    <AppShell>
      <PageHeader title="Communications" subtitle="Manual logs for call/email/text/portal messages with matter-linkable threads." />
      <div className="card" style={{ marginBottom: 14 }}>
        <button className="button secondary" style={{ width: 220 }} onClick={createThread}>Create Thread</button>
      </div>
      <div className="card-grid">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Threads</h3>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {threads.map((thread) => (
              <li key={thread.id} onClick={() => setThreadId(thread.id)} style={{ cursor: 'pointer' }}>
                {thread.subject || thread.id}
              </li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Log Message</h3>
          <form onSubmit={addMessage} style={{ display: 'grid', gap: 10 }}>
            <input className="input" value={threadId} onChange={(e) => setThreadId(e.target.value)} placeholder="Thread ID" />
            <textarea className="textarea" value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
            <button className="button" type="submit">Save Call Log</button>
          </form>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Keyword Search</h3>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr auto' }}>
            <input className="input" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search communications..." />
            <button className="button ghost" onClick={search}>Search</button>
          </div>
          <ul style={{ marginTop: 10, paddingLeft: 18 }}>
            {searchResults.map((row) => (
              <li key={row.id}>{row.subject || 'No subject'} - {String(row.body).slice(0, 80)}</li>
            ))}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}

'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { Button } from '../../components/ui/button';
import { Card, CardGrid } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
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
      <Card style={{ marginBottom: 14 }}>
        <Button tone="secondary" type="button" style={{ width: 220 }} onClick={createThread}>
          Create Thread
        </Button>
      </Card>
      <CardGrid>
        <Card>
          <h3 style={{ marginTop: 0 }}>Threads</h3>
          <p className="mono-meta" role="status" aria-live="polite" style={{ marginBottom: 8 }}>
            Active thread: {threadId || 'None selected'}
          </p>
          <ul className="thread-list">
            {threads.map((thread) => (
              <li key={thread.id}>
                <button
                  className={`thread-select${threadId === thread.id ? ' is-active' : ''}`}
                  type="button"
                  onClick={() => setThreadId(thread.id)}
                  aria-pressed={threadId === thread.id}
                >
                  <span className="thread-subject">{thread.subject || thread.id}</span>
                  <span className="thread-meta mono-meta">{thread.id}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
        <Card>
          <h3 style={{ marginTop: 0 }}>Log Message</h3>
          <form onSubmit={addMessage} style={{ display: 'grid', gap: 10 }}>
            <Input value={threadId} onChange={(e) => setThreadId(e.target.value)} placeholder="Thread ID" />
            <textarea className="textarea" value={body} onChange={(e) => setBody(e.target.value)} rows={4} />
            <Button type="submit">Save Call Log</Button>
          </form>
        </Card>
        <Card>
          <h3 style={{ marginTop: 0 }}>Keyword Search</h3>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr auto' }}>
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search communications..." />
            <Button tone="ghost" type="button" onClick={search}>
              Search
            </Button>
          </div>
          <p className="mono-meta" role="status" aria-live="polite" style={{ marginTop: 8 }}>
            Results: {searchResults.length}
          </p>
          <ul style={{ marginTop: 10, paddingLeft: 18 }}>
            {searchResults.map((row) => (
              <li key={row.id}>{row.subject || 'No subject'} - {String(row.body).slice(0, 80)}</li>
            ))}
          </ul>
        </Card>
      </CardGrid>
    </AppShell>
  );
}

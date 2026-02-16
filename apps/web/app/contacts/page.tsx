'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { apiFetch } from '../../lib/api';

type Contact = {
  id: string;
  kind: 'PERSON' | 'ORGANIZATION';
  displayName: string;
  primaryEmail?: string;
  primaryPhone?: string;
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [dedupe, setDedupe] = useState<Array<{ primaryId: string; duplicateId: string; score: number; reasons: string[] }>>([]);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'PERSON' | 'ORGANIZATION'>('PERSON');

  async function load() {
    const [contactData, dedupeData] = await Promise.all([
      apiFetch<Contact[]>('/contacts'),
      apiFetch<Array<{ primaryId: string; duplicateId: string; score: number; reasons: string[] }>>('/contacts/dedupe/suggestions'),
    ]);
    setContacts(contactData);
    setDedupe(dedupeData);
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function addContact(e: FormEvent) {
    e.preventDefault();
    await apiFetch('/contacts', {
      method: 'POST',
      body: JSON.stringify({ displayName: name, kind }),
    });
    setName('');
    await load();
  }

  async function merge(primaryId: string, duplicateId: string) {
    await apiFetch('/contacts/dedupe/merge', {
      method: 'POST',
      body: JSON.stringify({ primaryId, duplicateId }),
    });
    await load();
  }

  return (
    <AppShell>
      <PageHeader title="Contacts" subtitle="Unified people/organizations, relationship graph, and dedupe suggestions." />

      <div className="card" style={{ marginBottom: 14 }}>
        <form onSubmit={addContact} style={{ display: 'grid', gridTemplateColumns: '1fr 180px 140px', gap: 10 }}>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" />
          <select className="select" value={kind} onChange={(e) => setKind(e.target.value as 'PERSON' | 'ORGANIZATION')}>
            <option value="PERSON">Person</option>
            <option value="ORGANIZATION">Organization</option>
          </select>
          <button className="button" type="submit">Create</button>
        </form>
      </div>

      <div className="card-grid">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Contacts</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Kind</th>
                <th>Email</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td>{contact.displayName}</td>
                  <td>{contact.kind}</td>
                  <td>{contact.primaryEmail || '-'}</td>
                  <td>{contact.primaryPhone || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Dedupe Suggestions</h3>
          {dedupe.length === 0 ? <p>No suggestions</p> : null}
          {dedupe.map((item) => (
            <div key={`${item.primaryId}-${item.duplicateId}`} style={{ marginBottom: 8 }}>
              <div>
                {item.primaryId.slice(0, 8)} ↔ {item.duplicateId.slice(0, 8)} ({Math.round(item.score * 100)}%)
              </div>
              <small style={{ color: 'var(--muted)' }}>{item.reasons.join(', ')}</small>
              <div>
                <button className="button ghost" style={{ marginTop: 6 }} onClick={() => merge(item.primaryId, item.duplicateId)}>
                  Merge
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

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

type DedupeSuggestion = {
  primaryId: string;
  duplicateId: string;
  pairKey: string;
  score: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  decision: 'OPEN' | 'IGNORE' | 'DEFER';
  reasons: string[];
  primary: {
    id: string;
    displayName: string;
    kind: 'PERSON' | 'ORGANIZATION';
    primaryEmail?: string | null;
    primaryPhone?: string | null;
    tags?: string[];
  };
  duplicate: {
    id: string;
    displayName: string;
    kind: 'PERSON' | 'ORGANIZATION';
    primaryEmail?: string | null;
    primaryPhone?: string | null;
    tags?: string[];
  };
  fieldDiffs: Array<{ field: string; primaryValue: string | null; duplicateValue: string | null }>;
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [dedupe, setDedupe] = useState<DedupeSuggestion[]>([]);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'PERSON' | 'ORGANIZATION'>('PERSON');
  const [includeResolved, setIncludeResolved] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);

  async function load() {
    const [contactData, dedupeData] = await Promise.all([
      apiFetch<Contact[]>('/contacts'),
      apiFetch<DedupeSuggestion[]>('/contacts/dedupe/suggestions'),
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

  async function merge(item: DedupeSuggestion) {
    const confirmed = window.confirm(
      `Merge ${item.duplicate.displayName} into ${item.primary.displayName}? This cannot be automatically undone.`,
    );
    if (!confirmed) return;
    const key = `${item.pairKey}:merge`;
    setActionKey(key);
    try {
      await apiFetch('/contacts/dedupe/merge', {
        method: 'POST',
        body: JSON.stringify({ primaryId: item.primaryId, duplicateId: item.duplicateId }),
      });
      await load();
    } finally {
      setActionKey(null);
    }
  }

  async function decision(item: DedupeSuggestion, nextDecision: 'OPEN' | 'IGNORE' | 'DEFER') {
    const label = nextDecision === 'IGNORE' ? 'ignore' : nextDecision === 'DEFER' ? 'defer' : 'reopen';
    const confirmed = window.confirm(
      `Confirm ${label} decision for duplicate pair ${item.primary.displayName} ↔ ${item.duplicate.displayName}?`,
    );
    if (!confirmed) return;
    const key = `${item.pairKey}:${nextDecision}`;
    setActionKey(key);
    try {
      await apiFetch('/contacts/dedupe/decisions', {
        method: 'POST',
        body: JSON.stringify({ primaryId: item.primaryId, duplicateId: item.duplicateId, decision: nextDecision }),
      });
      await load();
    } finally {
      setActionKey(null);
    }
  }

  const visibleDedupe = includeResolved ? dedupe : dedupe.filter((item) => item.decision === 'OPEN');

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
          <label style={{ display: 'inline-flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
            <input type="checkbox" checked={includeResolved} onChange={(e) => setIncludeResolved(e.target.checked)} />
            Show deferred/ignored pairs
          </label>
          {visibleDedupe.length === 0 ? <p>No suggestions</p> : null}
          {visibleDedupe.map((item) => (
            <div key={`${item.primaryId}-${item.duplicateId}`} style={{ marginBottom: 8 }}>
              <div>
                {item.primary.displayName} ↔ {item.duplicate.displayName} ({Math.round(item.score * 100)}%)
              </div>
              <small style={{ color: 'var(--muted)' }}>
                Confidence: {item.confidence} | Status: {item.decision} | {item.reasons.join(', ')}
              </small>
              {item.fieldDiffs.length > 0 ? (
                <table className="table" style={{ marginTop: 6 }}>
                  <thead>
                    <tr>
                      <th>Field</th>
                      <th>Primary</th>
                      <th>Duplicate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.fieldDiffs.map((diff) => (
                      <tr key={`${item.pairKey}:${diff.field}`}>
                        <td>{diff.field}</td>
                        <td>{diff.primaryValue || '-'}</td>
                        <td>{diff.duplicateValue || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <button
                  className="button ghost"
                  onClick={() => merge(item)}
                  disabled={actionKey !== null}
                >
                  {actionKey === `${item.pairKey}:merge` ? 'Merging...' : 'Merge'}
                </button>
                {item.decision === 'OPEN' ? (
                  <>
                    <button
                      className="button ghost"
                      onClick={() => decision(item, 'DEFER')}
                      disabled={actionKey !== null}
                    >
                      {actionKey === `${item.pairKey}:DEFER` ? 'Saving...' : 'Defer'}
                    </button>
                    <button
                      className="button ghost"
                      onClick={() => decision(item, 'IGNORE')}
                      disabled={actionKey !== null}
                    >
                      {actionKey === `${item.pairKey}:IGNORE` ? 'Saving...' : 'Ignore'}
                    </button>
                  </>
                ) : (
                  <button
                    className="button ghost"
                    onClick={() => decision(item, 'OPEN')}
                    disabled={actionKey !== null}
                  >
                    {actionKey === `${item.pairKey}:OPEN` ? 'Saving...' : 'Reopen'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

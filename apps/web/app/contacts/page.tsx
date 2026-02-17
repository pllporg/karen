'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { apiFetch } from '../../lib/api';

type Contact = {
  id: string;
  kind: 'PERSON' | 'ORGANIZATION';
  displayName: string;
  primaryEmail?: string | null;
  primaryPhone?: string | null;
  tags?: string[];
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

type GraphEdge = {
  id: string;
  fromContactId: string;
  toContactId: string;
  relationshipType: string;
  notes?: string | null;
  direction: 'OUTGOING' | 'INCOMING';
  relatedContact: {
    id: string;
    displayName: string;
    kind: 'PERSON' | 'ORGANIZATION';
    primaryEmail?: string | null;
    primaryPhone?: string | null;
    tags?: string[];
  };
};

type ContactGraph = {
  contact: Contact;
  nodes: Contact[];
  edges: GraphEdge[];
  availableRelationshipTypes: string[];
  summary: { nodeCount: number; edgeCount: number };
  filters: {
    relationshipTypes: string[];
    search: string;
  };
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [dedupe, setDedupe] = useState<DedupeSuggestion[]>([]);
  const [graph, setGraph] = useState<ContactGraph | null>(null);
  const [name, setName] = useState('');
  const [kind, setKind] = useState<'PERSON' | 'ORGANIZATION'>('PERSON');
  const [includeResolved, setIncludeResolved] = useState(false);
  const [search, setSearch] = useState('');
  const [includeTagsInput, setIncludeTagsInput] = useState('');
  const [excludeTagsInput, setExcludeTagsInput] = useState('');
  const [tagMode, setTagMode] = useState<'any' | 'all'>('any');
  const [activeGraphContactId, setActiveGraphContactId] = useState<string | null>(null);
  const [graphSearch, setGraphSearch] = useState('');
  const [graphRelationshipType, setGraphRelationshipType] = useState('');
  const [graphLoading, setGraphLoading] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);

  function splitCsv(value: string) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function contactsPath() {
    const params = new URLSearchParams();
    if (search.trim()) params.set('search', search.trim());
    const includeTags = splitCsv(includeTagsInput);
    const excludeTags = splitCsv(excludeTagsInput);
    if (includeTags.length > 0) params.set('includeTags', includeTags.join(','));
    if (excludeTags.length > 0) params.set('excludeTags', excludeTags.join(','));
    if (includeTags.length > 0 || excludeTags.length > 0) params.set('tagMode', tagMode);
    const query = params.toString();
    return query ? `/contacts?${query}` : '/contacts';
  }

  async function load() {
    const [contactData, dedupeData] = await Promise.all([
      apiFetch<Contact[]>(contactsPath()),
      apiFetch<DedupeSuggestion[]>('/contacts/dedupe/suggestions'),
    ]);
    setContacts(contactData);
    setDedupe(dedupeData);
    if (activeGraphContactId && !contactData.some((contact) => contact.id === activeGraphContactId)) {
      setGraph(null);
      setActiveGraphContactId(null);
    }
  }

  useEffect(() => {
    load().catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadGraph(
    contactId: string,
    nextRelationshipType = graphRelationshipType,
    nextSearch = graphSearch,
  ) {
    const params = new URLSearchParams();
    if (nextSearch.trim()) params.set('search', nextSearch.trim());
    if (nextRelationshipType) params.set('relationshipTypes', nextRelationshipType);
    const query = params.toString();
    const path = query ? `/contacts/${contactId}/graph?${query}` : `/contacts/${contactId}/graph`;
    setGraphLoading(true);
    try {
      const graphData = await apiFetch<ContactGraph>(path);
      setGraph(graphData);
      setActiveGraphContactId(contactId);
    } finally {
      setGraphLoading(false);
    }
  }

  async function applyContactFilters(e: FormEvent) {
    e.preventDefault();
    setGraph(null);
    setActiveGraphContactId(null);
    await load();
  }

  async function clearContactFilters() {
    setSearch('');
    setIncludeTagsInput('');
    setExcludeTagsInput('');
    setTagMode('any');
    setGraph(null);
    setActiveGraphContactId(null);
    const [contactData, dedupeData] = await Promise.all([
      apiFetch<Contact[]>('/contacts'),
      apiFetch<DedupeSuggestion[]>('/contacts/dedupe/suggestions'),
    ]);
    setContacts(contactData);
    setDedupe(dedupeData);
  }

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
  const dedupeByContactId = useMemo(() => {
    const index = new Map<string, { openCount: number; highestConfidence: DedupeSuggestion['confidence'] }>();
    const confidenceWeight = (value: DedupeSuggestion['confidence']) => {
      if (value === 'HIGH') return 3;
      if (value === 'MEDIUM') return 2;
      return 1;
    };

    for (const item of dedupe) {
      if (item.decision !== 'OPEN') continue;
      const ids = [item.primaryId, item.duplicateId];
      for (const id of ids) {
        const existing = index.get(id);
        if (!existing) {
          index.set(id, {
            openCount: 1,
            highestConfidence: item.confidence,
          });
          continue;
        }
        existing.openCount += 1;
        if (confidenceWeight(item.confidence) > confidenceWeight(existing.highestConfidence)) {
          existing.highestConfidence = item.confidence;
        }
      }
    }

    return index;
  }, [dedupe]);

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

      <div className="card" style={{ marginBottom: 14 }}>
        <form
          onSubmit={applyContactFilters}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 160px auto auto', gap: 10 }}
        >
          <input
            className="input"
            aria-label="Contact Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name/email/phone"
          />
          <input
            className="input"
            aria-label="Include Tags"
            value={includeTagsInput}
            onChange={(e) => setIncludeTagsInput(e.target.value)}
            placeholder="Include tags (comma-separated)"
          />
          <input
            className="input"
            aria-label="Exclude Tags"
            value={excludeTagsInput}
            onChange={(e) => setExcludeTagsInput(e.target.value)}
            placeholder="Exclude tags (comma-separated)"
          />
          <select
            className="select"
            aria-label="Tag Mode"
            value={tagMode}
            onChange={(e) => setTagMode(e.target.value as 'any' | 'all')}
          >
            <option value="any">Include Any Tag</option>
            <option value="all">Include All Tags</option>
          </select>
          <button className="button secondary" type="submit">Apply Filters</button>
          <button className="button ghost" type="button" onClick={() => clearContactFilters()}>
            Clear
          </button>
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
                <th>Tags</th>
                <th>Dedupe</th>
                <th>Graph</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact) => (
                <tr key={contact.id}>
                  <td>{contact.displayName}</td>
                  <td>{contact.kind}</td>
                  <td>{contact.primaryEmail || '-'}</td>
                  <td>{contact.primaryPhone || '-'}</td>
                  <td>{contact.tags?.length ? contact.tags.join(', ') : '-'}</td>
                  <td>
                    {dedupeByContactId.get(contact.id)
                      ? `${dedupeByContactId.get(contact.id)?.openCount} open (${dedupeByContactId.get(contact.id)?.highestConfidence})`
                      : '-'}
                  </td>
                  <td>
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() => {
                        setGraphSearch('');
                        setGraphRelationshipType('');
                        loadGraph(contact.id, '', '');
                      }}
                      disabled={graphLoading}
                    >
                      {activeGraphContactId === contact.id ? 'Refresh' : 'View Graph'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Relationship Graph</h3>
          {!activeGraphContactId ? (
            <p>Select a contact from the table to view relationship graph details.</p>
          ) : (
            <>
              <div style={{ marginBottom: 8 }}>
                {graphLoading ? (
                  <span>Loading relationship graph...</span>
                ) : (
                  <span>
                    Root: <strong>{graph?.contact.displayName || activeGraphContactId}</strong>
                  </span>
                )}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!activeGraphContactId) return;
                  loadGraph(activeGraphContactId);
                }}
                style={{ display: 'grid', gridTemplateColumns: '1fr 220px auto auto', gap: 8, marginBottom: 10 }}
              >
                <input
                  className="input"
                  aria-label="Graph Search"
                  value={graphSearch}
                  onChange={(e) => setGraphSearch(e.target.value)}
                  placeholder="Search related contact name"
                />
                <select
                  className="select"
                  aria-label="Relationship Type Filter"
                  value={graphRelationshipType}
                  onChange={(e) => setGraphRelationshipType(e.target.value)}
                >
                  <option value="">All Relationship Types</option>
                  {(graph?.availableRelationshipTypes || []).map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <button className="button secondary" type="submit" disabled={graphLoading}>
                  Apply
                </button>
                <button
                  className="button ghost"
                  type="button"
                  disabled={graphLoading}
                  onClick={() => {
                    setGraphSearch('');
                    setGraphRelationshipType('');
                    if (activeGraphContactId) {
                      loadGraph(activeGraphContactId, '', '');
                    }
                  }}
                >
                  Reset
                </button>
              </form>
              <small style={{ color: 'var(--muted)' }}>
                Nodes: {graph?.summary.nodeCount ?? 0} | Edges: {graph?.summary.edgeCount ?? 0}
              </small>
              <table className="table" style={{ marginTop: 8 }}>
                <thead>
                  <tr>
                    <th>Direction</th>
                    <th>Relationship</th>
                    <th>Related Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {(graph?.edges || []).map((edge) => (
                    <tr key={edge.id}>
                      <td>{edge.direction}</td>
                      <td>{edge.relationshipType}</td>
                      <td>{edge.relatedContact.displayName}</td>
                    </tr>
                  ))}
                  {graph && graph.edges.length === 0 ? (
                    <tr>
                      <td colSpan={3}>No matching relationships for current graph filters.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </>
          )}
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

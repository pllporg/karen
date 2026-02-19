'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { ConfirmDialog } from '../../components/confirm-dialog';
import { PageHeader } from '../../components/page-header';
import { ToastStack, type ToastItem } from '../../components/toast-stack';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardGrid } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Table } from '../../components/ui/table';
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

type PendingDedupeAction =
  | {
      kind: 'MERGE';
      item: DedupeSuggestion;
    }
  | {
      kind: 'DECISION';
      item: DedupeSuggestion;
      nextDecision: 'OPEN' | 'IGNORE' | 'DEFER';
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
  const [pendingAction, setPendingAction] = useState<PendingDedupeAction | null>(null);
  const [dedupeError, setDedupeError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  function splitCsv(value: string) {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function formatTimestamp(date: Date) {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(date);
  }

  function pushToast(tone: ToastItem['tone'], title: string, detail: string) {
    setToasts((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
        tone,
        title,
        detail,
        occurredAt: formatTimestamp(new Date()),
      },
    ]);
  }

  function dismissToast(id: string) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
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

  useEffect(() => {
    if (toasts.length === 0) return undefined;
    const timer = window.setTimeout(() => {
      setToasts((current) => current.slice(1));
    }, 4500);
    return () => window.clearTimeout(timer);
  }, [toasts]);

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
    setDedupeError(null);
    setPendingAction({ kind: 'MERGE', item });
  }

  function decision(item: DedupeSuggestion, nextDecision: 'OPEN' | 'IGNORE' | 'DEFER') {
    setDedupeError(null);
    setPendingAction({ kind: 'DECISION', item, nextDecision });
  }

  async function confirmPendingAction() {
    if (!pendingAction) return;
    const currentAction = pendingAction;
    const key =
      currentAction.kind === 'MERGE'
        ? `${currentAction.item.pairKey}:merge`
        : `${currentAction.item.pairKey}:${currentAction.nextDecision}`;
    setPendingAction(null);
    setActionKey(key);
    setDedupeError(null);

    try {
      if (currentAction.kind === 'MERGE') {
        await apiFetch('/contacts/dedupe/merge', {
          method: 'POST',
          body: JSON.stringify({ primaryId: currentAction.item.primaryId, duplicateId: currentAction.item.duplicateId }),
        });
        pushToast(
          'warning',
          'Dedupe Merge Completed',
          `${currentAction.item.duplicate.displayName} merged into ${currentAction.item.primary.displayName}.`,
        );
      } else {
        await apiFetch('/contacts/dedupe/decisions', {
          method: 'POST',
          body: JSON.stringify({
            primaryId: currentAction.item.primaryId,
            duplicateId: currentAction.item.duplicateId,
            decision: currentAction.nextDecision,
          }),
        });
        pushToast(
          'success',
          'Dedupe Decision Recorded',
          `${currentAction.nextDecision} recorded for ${currentAction.item.primary.displayName} ↔ ${currentAction.item.duplicate.displayName}.`,
        );
      }
      await load();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to process dedupe action.';
      setDedupeError(message);
      pushToast('error', 'Dedupe Action Failed', message);
    } finally {
      setActionKey(null);
    }
  }

  const visibleDedupe = includeResolved ? dedupe : dedupe.filter((item) => item.decision === 'OPEN');
  const pendingActionDialog = useMemo(() => {
    if (!pendingAction) return null;

    if (pendingAction.kind === 'MERGE') {
      return {
        title: 'Confirm Dedupe Merge',
        description: `Merge ${pendingAction.item.duplicate.displayName} into ${pendingAction.item.primary.displayName}. This updates participant/contact references and cannot be automatically reversed.`,
        confirmLabel: 'Approve Merge',
        confirmTone: 'danger' as const,
      };
    }

    const decisionLabel =
      pendingAction.nextDecision === 'IGNORE'
        ? 'IGNORE'
        : pendingAction.nextDecision === 'DEFER'
          ? 'DEFER'
          : 'REOPEN';

    return {
      title: 'Confirm Dedupe Decision',
      description: `Apply ${decisionLabel} to duplicate pair ${pendingAction.item.primary.displayName} ↔ ${pendingAction.item.duplicate.displayName}.`,
      confirmLabel: 'Record Decision',
      confirmTone: 'default' as const,
    };
  }, [pendingAction]);

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

      <Card style={{ marginBottom: 14 }}>
        <form onSubmit={addContact} style={{ display: 'grid', gridTemplateColumns: '1fr 180px 140px', gap: 10 }}>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Display name" />
          <Select value={kind} onChange={(e) => setKind(e.target.value as 'PERSON' | 'ORGANIZATION')}>
            <option value="PERSON">Person</option>
            <option value="ORGANIZATION">Organization</option>
          </Select>
          <Button type="submit">Create</Button>
        </form>
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <form
          onSubmit={applyContactFilters}
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 160px auto auto', gap: 10 }}
        >
          <Input
            aria-label="Contact Search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name/email/phone"
          />
          <Input
            aria-label="Include Tags"
            value={includeTagsInput}
            onChange={(e) => setIncludeTagsInput(e.target.value)}
            placeholder="Include tags (comma-separated)"
          />
          <Input
            aria-label="Exclude Tags"
            value={excludeTagsInput}
            onChange={(e) => setExcludeTagsInput(e.target.value)}
            placeholder="Exclude tags (comma-separated)"
          />
          <Select
            aria-label="Tag Mode"
            value={tagMode}
            onChange={(e) => setTagMode(e.target.value as 'any' | 'all')}
          >
            <option value="any">Include Any Tag</option>
            <option value="all">Include All Tags</option>
          </Select>
          <Button tone="secondary" type="submit">
            Apply Filters
          </Button>
          <Button tone="ghost" type="button" onClick={() => clearContactFilters()}>
            Clear
          </Button>
        </form>
      </Card>

      <CardGrid>
        <Card>
          <h3 style={{ marginTop: 0 }}>Contacts</h3>
          <Table>
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
                      ? (
                        <Badge tone="in-review">
                          {dedupeByContactId.get(contact.id)?.openCount} OPEN (
                          {dedupeByContactId.get(contact.id)?.highestConfidence})
                        </Badge>
                        )
                      : '-'}
                  </td>
                  <td>
                    <Button
                      tone="ghost"
                      type="button"
                      onClick={() => {
                        setGraphSearch('');
                        setGraphRelationshipType('');
                        loadGraph(contact.id, '', '');
                      }}
                      disabled={graphLoading}
                    >
                      {activeGraphContactId === contact.id ? 'Refresh' : 'View Graph'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card>

        <Card>
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
                <Input
                  aria-label="Graph Search"
                  value={graphSearch}
                  onChange={(e) => setGraphSearch(e.target.value)}
                  placeholder="Search related contact name"
                />
                <Select
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
                </Select>
                <Button tone="secondary" type="submit" disabled={graphLoading}>
                  Apply
                </Button>
                <Button
                  tone="ghost"
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
                </Button>
              </form>
              <small style={{ color: 'var(--lic-text-muted)' }}>
                Nodes: {graph?.summary.nodeCount ?? 0} | Edges: {graph?.summary.edgeCount ?? 0}
              </small>
              <Table style={{ marginTop: 8 }}>
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
              </Table>
            </>
          )}
        </Card>

        <Card>
          <h3 style={{ marginTop: 0 }}>Dedupe Suggestions</h3>
          {actionKey ? (
            <p className="notice mono-meta" role="status" style={{ marginBottom: 8 }}>
              Processing dedupe action...
            </p>
          ) : null}
          {dedupeError ? (
            <p className="error" role="alert" style={{ marginBottom: 8 }}>
              {dedupeError}
            </p>
          ) : null}
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
              <small style={{ color: 'var(--lic-text-muted)' }}>
                Confidence: {item.confidence} | Status: {item.decision} | {item.reasons.join(', ')}
              </small>
              {item.fieldDiffs.length > 0 ? (
                <Table style={{ marginTop: 6 }}>
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
                </Table>
              ) : null}
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <Button
                  tone="ghost"
                  type="button"
                  onClick={() => merge(item)}
                  disabled={actionKey !== null}
                >
                  {actionKey === `${item.pairKey}:merge` ? 'Merging...' : 'Merge'}
                </Button>
                {item.decision === 'OPEN' ? (
                  <>
                    <Button
                      tone="ghost"
                      type="button"
                      onClick={() => decision(item, 'DEFER')}
                      disabled={actionKey !== null}
                    >
                      {actionKey === `${item.pairKey}:DEFER` ? 'Saving...' : 'Defer'}
                    </Button>
                    <Button
                      tone="ghost"
                      type="button"
                      onClick={() => decision(item, 'IGNORE')}
                      disabled={actionKey !== null}
                    >
                      {actionKey === `${item.pairKey}:IGNORE` ? 'Saving...' : 'Ignore'}
                    </Button>
                  </>
                ) : (
                  <Button
                    tone="ghost"
                    type="button"
                    onClick={() => decision(item, 'OPEN')}
                    disabled={actionKey !== null}
                  >
                    {actionKey === `${item.pairKey}:OPEN` ? 'Saving...' : 'Reopen'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </Card>
      </CardGrid>

      <ConfirmDialog
        open={Boolean(pendingActionDialog)}
        title={pendingActionDialog?.title || 'Confirm Action'}
        description={pendingActionDialog?.description || ''}
        confirmLabel={pendingActionDialog?.confirmLabel || 'Confirm'}
        confirmTone={pendingActionDialog?.confirmTone || 'default'}
        cancelLabel="Return to Review"
        busy={actionKey !== null}
        onCancel={() => setPendingAction(null)}
        onConfirm={confirmPendingAction}
      />
      <ToastStack items={toasts} onDismiss={dismissToast} />
    </AppShell>
  );
}

'use client';

import { AppShell } from '../../components/app-shell';
import { ConfirmDialog } from '../../components/confirm-dialog';
import { PageHeader } from '../../components/page-header';
import { ToastStack } from '../../components/toast-stack';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Card, CardGrid } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { Table } from '../../components/ui/table';
import { useContactsPage } from './use-contacts-page';

export default function ContactsPage() {
  const {
    contacts,
    graph,
    name,
    kind,
    includeResolved,
    search,
    includeTagsInput,
    excludeTagsInput,
    tagMode,
    activeGraphContactId,
    graphSearch,
    graphRelationshipType,
    graphLoading,
    actionKey,
    pendingAction,
    dedupeError,
    toasts,
    visibleDedupe,
    pendingActionDialog,
    dedupeByContactId,
    setName,
    setKind,
    setIncludeResolved,
    setSearch,
    setIncludeTagsInput,
    setExcludeTagsInput,
    setTagMode,
    setGraphSearch,
    setGraphRelationshipType,
    setPendingAction,
    dismissToast,
    loadGraph,
    applyContactFilters,
    clearContactFilters,
    addContact,
    merge,
    decision,
    confirmPendingAction,
  } = useContactsPage();

  return (
    <AppShell>
      <PageHeader title="Contacts" subtitle="Unified people/organizations, relationship graph, and dedupe suggestions." />

      <Card className="mb-3">
        <form
          className="contacts-create-form"
          onSubmit={(event) => {
            event.preventDefault();
            addContact().catch(() => undefined);
          }}
        >
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Display name" />
          <Select value={kind} onChange={(event) => setKind(event.target.value as 'PERSON' | 'ORGANIZATION')}>
            <option value="PERSON">Person</option>
            <option value="ORGANIZATION">Organization</option>
          </Select>
          <Button type="submit">Create</Button>
        </form>
      </Card>

      <Card className="mb-3">
        <form
          className="contacts-filter-form"
          onSubmit={(event) => {
            event.preventDefault();
            applyContactFilters().catch(() => undefined);
          }}
        >
          <Input
            aria-label="Contact Search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name/email/phone"
          />
          <Input
            aria-label="Include Tags"
            value={includeTagsInput}
            onChange={(event) => setIncludeTagsInput(event.target.value)}
            placeholder="Include tags (comma-separated)"
          />
          <Input
            aria-label="Exclude Tags"
            value={excludeTagsInput}
            onChange={(event) => setExcludeTagsInput(event.target.value)}
            placeholder="Exclude tags (comma-separated)"
          />
          <Select aria-label="Tag Mode" value={tagMode} onChange={(event) => setTagMode(event.target.value as 'any' | 'all')}>
            <option value="any">Include Any Tag</option>
            <option value="all">Include All Tags</option>
          </Select>
          <Button tone="secondary" type="submit">
            Apply Filters
          </Button>
          <Button
            tone="ghost"
            type="button"
            onClick={() => {
              clearContactFilters().catch(() => undefined);
            }}
          >
            Clear
          </Button>
        </form>
      </Card>

      <CardGrid>
        <Card>
          <h3>Contacts</h3>
          <Table>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Kind</th>
                <th scope="col">Email</th>
                <th scope="col">Phone</th>
                <th scope="col">Tags</th>
                <th scope="col">Dedupe</th>
                <th scope="col">Graph</th>
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
                    {dedupeByContactId.get(contact.id) ? (
                      <Badge tone="in-review">
                        {dedupeByContactId.get(contact.id)?.openCount} OPEN ({dedupeByContactId.get(contact.id)?.highestConfidence})
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <Button
                      tone="ghost"
                      type="button"
                      onClick={() => {
                        setGraphSearch('');
                        setGraphRelationshipType('');
                        loadGraph(contact.id, '', '').catch(() => undefined);
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
          <h3>Relationship Graph</h3>
          {!activeGraphContactId ? (
            <p>Select a contact from the table to view relationship graph details.</p>
          ) : (
            <>
              <div className="mb-2">
                {graphLoading ? (
                  <span>Loading relationship graph...</span>
                ) : (
                  <span>
                    Root: <strong>{graph?.contact.displayName || activeGraphContactId}</strong>
                  </span>
                )}
              </div>
              <form
                className="contacts-graph-filter-form mb-2"
                onSubmit={(event) => {
                  event.preventDefault();
                  if (!activeGraphContactId) return;
                  loadGraph(activeGraphContactId).catch(() => undefined);
                }}
              >
                <Input
                  aria-label="Graph Search"
                  value={graphSearch}
                  onChange={(event) => setGraphSearch(event.target.value)}
                  placeholder="Search related contact name"
                />
                <Select
                  aria-label="Relationship Type Filter"
                  value={graphRelationshipType}
                  onChange={(event) => setGraphRelationshipType(event.target.value)}
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
                      loadGraph(activeGraphContactId, '', '').catch(() => undefined);
                    }
                  }}
                >
                  Reset
                </Button>
              </form>
              <small className="type-caption muted">
                Nodes: {graph?.summary.nodeCount ?? 0} | Edges: {graph?.summary.edgeCount ?? 0}
              </small>
              <Table className="mt-2">
                <thead>
                  <tr>
                    <th scope="col">Direction</th>
                    <th scope="col">Relationship</th>
                    <th scope="col">Related Contact</th>
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
          <h3>Dedupe Suggestions</h3>
          {actionKey ? (
            <p className="notice mono-meta mb-2" role="status">
              Processing dedupe action...
            </p>
          ) : null}
          {dedupeError ? (
            <p className="error mb-2" role="alert">
              {dedupeError}
            </p>
          ) : null}
          <div className="mb-2">
            <Checkbox checked={includeResolved} onChange={setIncludeResolved} label="Show deferred/ignored pairs" />
          </div>
          {visibleDedupe.length === 0 ? <p>No suggestions</p> : null}
          {visibleDedupe.map((item) => (
            <div key={`${item.primaryId}-${item.duplicateId}`} className="mb-2">
              <div>
                {item.primary.displayName} ↔ {item.duplicate.displayName} ({Math.round(item.score * 100)}%)
              </div>
              <small className="type-caption muted">
                Confidence: {item.confidence} | Status: {item.decision} | {item.reasons.join(', ')}
              </small>
              {item.fieldDiffs.length > 0 ? (
                <Table className="mt-2">
                  <thead>
                    <tr>
                      <th scope="col">Field</th>
                      <th scope="col">Primary</th>
                      <th scope="col">Duplicate</th>
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
              <div className="row-2 mt-2">
                <Button tone="ghost" type="button" onClick={() => merge(item)} disabled={actionKey !== null}>
                  {actionKey === `${item.pairKey}:merge` ? 'Merging...' : 'Merge'}
                </Button>
                {item.decision === 'OPEN' ? (
                  <>
                    <Button tone="ghost" type="button" onClick={() => decision(item, 'DEFER')} disabled={actionKey !== null}>
                      {actionKey === `${item.pairKey}:DEFER` ? 'Saving...' : 'Defer'}
                    </Button>
                    <Button tone="ghost" type="button" onClick={() => decision(item, 'IGNORE')} disabled={actionKey !== null}>
                      {actionKey === `${item.pairKey}:IGNORE` ? 'Saving...' : 'Ignore'}
                    </Button>
                  </>
                ) : (
                  <Button tone="ghost" type="button" onClick={() => decision(item, 'OPEN')} disabled={actionKey !== null}>
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

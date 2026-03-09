'use client';

import { useEffect, useMemo, useState } from 'react';
import { type ToastItem } from '../../components/toast-stack';
import { apiFetch } from '../../lib/api';
import type {
  ContactsCreateFormData,
  ContactsFilterFormData,
  ContactsGraphFilterFormData,
} from '../../lib/schemas/contacts-page';

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

const defaultContactFilters: ContactsFilterFormData = {
  search: '',
  includeTagsInput: '',
  excludeTagsInput: '',
  tagMode: 'any',
};

const defaultGraphFilters: ContactsGraphFilterFormData = {
  graphSearch: '',
  graphRelationshipType: '',
};

export function useContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [dedupe, setDedupe] = useState<DedupeSuggestion[]>([]);
  const [graph, setGraph] = useState<ContactGraph | null>(null);
  const [includeResolved, setIncludeResolved] = useState(false);
  const [contactFilters, setContactFilters] = useState<ContactsFilterFormData>(defaultContactFilters);
  const [activeGraphContactId, setActiveGraphContactId] = useState<string | null>(null);
  const [graphFilters, setGraphFilters] = useState<ContactsGraphFilterFormData>(defaultGraphFilters);
  const [graphLoading, setGraphLoading] = useState(false);
  const [actionKey, setActionKey] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingDedupeAction | null>(null);
  const [dedupeError, setDedupeError] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

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

  async function load(nextFilters = contactFilters) {
    const params = new URLSearchParams();
    if (nextFilters.search.trim()) params.set('search', nextFilters.search.trim());
    const includeTags = splitCsv(nextFilters.includeTagsInput);
    const excludeTags = splitCsv(nextFilters.excludeTagsInput);
    if (includeTags.length > 0) params.set('includeTags', includeTags.join(','));
    if (excludeTags.length > 0) params.set('excludeTags', excludeTags.join(','));
    if (includeTags.length > 0 || excludeTags.length > 0) params.set('tagMode', nextFilters.tagMode);
    const query = params.toString();
    const path = query ? `/contacts?${query}` : '/contacts';
    const [contactData, dedupeData] = await Promise.all([
      apiFetch<Contact[]>(path),
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
    Promise.all([
      apiFetch<Contact[]>('/contacts'),
      apiFetch<DedupeSuggestion[]>('/contacts/dedupe/suggestions'),
    ])
      .then(([contactData, dedupeData]) => {
        setContacts(contactData);
        setDedupe(dedupeData);
      })
      .catch(() => undefined);
  }, []);

  async function loadGraph(
    contactId: string,
    nextRelationshipType = graphFilters.graphRelationshipType,
    nextSearch = graphFilters.graphSearch,
  ) {
    const params = new URLSearchParams();
    if (nextSearch.trim()) params.set('search', nextSearch.trim());
    if (nextRelationshipType) params.set('relationshipTypes', nextRelationshipType);
    const query = params.toString();
    const path = query ? `/contacts/${contactId}/graph?${query}` : `/contacts/${contactId}/graph`;
    setGraphLoading(true);
    setGraphFilters({
      graphSearch: nextSearch,
      graphRelationshipType: nextRelationshipType,
    });
    try {
      const graphData = await apiFetch<ContactGraph>(path);
      setGraph(graphData);
      setActiveGraphContactId(contactId);
    } finally {
      setGraphLoading(false);
    }
  }

  async function applyContactFilters(nextFilters: ContactsFilterFormData) {
    setContactFilters(nextFilters);
    setGraph(null);
    setActiveGraphContactId(null);
    await load(nextFilters);
  }

  async function clearContactFilters() {
    setContactFilters(defaultContactFilters);
    setGraphFilters(defaultGraphFilters);
    setGraph(null);
    setActiveGraphContactId(null);
    await load(defaultContactFilters);
  }

  async function addContact(values: ContactsCreateFormData) {
    await apiFetch('/contacts', {
      method: 'POST',
      body: JSON.stringify({ displayName: values.displayName, kind: values.kind }),
    });
    await load();
  }

  function merge(item: DedupeSuggestion) {
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

  return {
    contacts,
    graph,
    includeResolved,
    activeGraphContactId,
    graphLoading,
    actionKey,
    pendingAction,
    dedupeError,
    toasts,
    visibleDedupe,
    pendingActionDialog,
    dedupeByContactId,
    setIncludeResolved,
    setPendingAction,
    dismissToast,
    loadGraph,
    applyContactFilters,
    clearContactFilters,
    addContact,
    merge,
    decision,
    confirmPendingAction,
  };
}

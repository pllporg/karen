'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch, getSessionToken } from '../../../lib/api';
import {
  COMMUNICATION_DIRECTION_OPTIONS,
  COMMUNICATION_TYPE_OPTIONS,
  CommunicationThread,
  DeadlinePreviewRow,
  PAYMENT_METHOD_OPTIONS,
  ParticipantContactOption,
  ParticipantRoleOption,
  ParticipantSideOption,
  TASK_PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
  TRUST_TRANSACTION_TYPE_OPTIONS,
} from './types';
import { collectTrustAccountOptions, isCounselRole, toDateTimeLocalValue, withTimestamp } from './utils';
import { useMatterOverview } from './use-matter-overview';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export function useMatterDashboard(matterId: string) {
  const [dashboard, setDashboard] = useState<any>(null);
  const [rulesPacks, setRulesPacks] = useState<Array<{ id: string; name: string; pack?: { version?: string } }>>([]);
  const [selectedRulesPackId, setSelectedRulesPackId] = useState('');
  const [triggerDate, setTriggerDate] = useState(new Date().toISOString().slice(0, 10));
  const [previewRows, setPreviewRows] = useState<DeadlinePreviewRow[]>([]);
  const [overrideDates, setOverrideDates] = useState<Record<string, string>>({});
  const [overrideReasons, setOverrideReasons] = useState<Record<string, string>>({});
  const [deadlineStatus, setDeadlineStatus] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueAt, setTaskDueAt] = useState('');
  const [taskPriority, setTaskPriority] = useState<(typeof TASK_PRIORITY_OPTIONS)[number]>('MEDIUM');
  const [taskStatusMessage, setTaskStatusMessage] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [eventType, setEventType] = useState('');
  const [eventStartAt, setEventStartAt] = useState('');
  const [eventEndAt, setEventEndAt] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [calendarStatusMessage, setCalendarStatusMessage] = useState<string | null>(null);
  const [editingCalendarEventId, setEditingCalendarEventId] = useState<string | null>(null);
  const [participantContacts, setParticipantContacts] = useState<ParticipantContactOption[]>([]);
  const [participantRoleOptions, setParticipantRoleOptions] = useState<ParticipantRoleOption[]>([]);
  const [selectedParticipantContactId, setSelectedParticipantContactId] = useState('');
  const [selectedParticipantRoleKey, setSelectedParticipantRoleKey] = useState('');
  const [participantSide, setParticipantSide] = useState<ParticipantSideOption>('NEUTRAL');
  const [participantIsPrimary, setParticipantIsPrimary] = useState(false);
  const [participantRepresentedByContactId, setParticipantRepresentedByContactId] = useState('');
  const [participantLawFirmContactId, setParticipantLawFirmContactId] = useState('');
  const [participantNotes, setParticipantNotes] = useState('');
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [participantStatusMessage, setParticipantStatusMessage] = useState<string | null>(null);
  const [selectedCommunicationThreadId, setSelectedCommunicationThreadId] = useState('__new__');
  const [newCommunicationThreadSubject, setNewCommunicationThreadSubject] = useState('');
  const [communicationType, setCommunicationType] =
    useState<(typeof COMMUNICATION_TYPE_OPTIONS)[number]>('CALL_LOG');
  const [communicationDirection, setCommunicationDirection] =
    useState<(typeof COMMUNICATION_DIRECTION_OPTIONS)[number]>('INBOUND');
  const [communicationSubject, setCommunicationSubject] = useState('');
  const [communicationBody, setCommunicationBody] = useState('');
  const [communicationParticipantContactId, setCommunicationParticipantContactId] = useState('');
  const [communicationOccurredAt, setCommunicationOccurredAt] = useState(new Date().toISOString().slice(0, 16));
  const [communicationStatusMessage, setCommunicationStatusMessage] = useState<string | null>(null);
  const [editingCommunicationId, setEditingCommunicationId] = useState<string | null>(null);
  const [documentTitle, setDocumentTitle] = useState('Matter Document');
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentVersionFiles, setDocumentVersionFiles] = useState<Record<string, File | null>>({});
  const [documentStatusMessage, setDocumentStatusMessage] = useState<string | null>(null);
  const [timeEntryDescription, setTimeEntryDescription] = useState('');
  const [timeEntryStartAt, setTimeEntryStartAt] = useState(new Date().toISOString().slice(0, 16));
  const [timeEntryEndAt, setTimeEntryEndAt] = useState(new Date(Date.now() + 30 * 60000).toISOString().slice(0, 16));
  const [timeEntryRate, setTimeEntryRate] = useState('350');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseIncurredAt, setExpenseIncurredAt] = useState(new Date().toISOString().slice(0, 16));
  const [invoiceLineDescription, setInvoiceLineDescription] = useState('Matter services');
  const [invoiceLineQuantity, setInvoiceLineQuantity] = useState('1');
  const [invoiceLineUnitPrice, setInvoiceLineUnitPrice] = useState('425');
  const [invoiceDueAt, setInvoiceDueAt] = useState('');
  const [invoicePaymentAmountById, setInvoicePaymentAmountById] = useState<Record<string, string>>({});
  const [invoicePaymentReferenceById, setInvoicePaymentReferenceById] = useState<Record<string, string>>({});
  const [invoicePaymentMethodById, setInvoicePaymentMethodById] = useState<
    Record<string, (typeof PAYMENT_METHOD_OPTIONS)[number]>
  >({});
  const [trustAccountId, setTrustAccountId] = useState('');
  const [trustTransactionType, setTrustTransactionType] =
    useState<(typeof TRUST_TRANSACTION_TYPE_OPTIONS)[number]>('DEPOSIT');
  const [trustTransactionAmount, setTrustTransactionAmount] = useState('');
  const [trustTransactionDescription, setTrustTransactionDescription] = useState('');
  const [billingStatusMessage, setBillingStatusMessage] = useState<string | null>(null);
  const trustAccountOptions = useMemo(() => collectTrustAccountOptions(dashboard), [dashboard]);

  const refreshDashboard = useCallback(async () => {
    if (!matterId) {
      return;
    }
    const nextDashboard = await apiFetch<any>(`/matters/${matterId}/dashboard`);
    setDashboard(nextDashboard);
    const threadIds = (nextDashboard.communicationThreads || []).map((thread: CommunicationThread) => thread.id);
    setSelectedCommunicationThreadId((current) => {
      if (threadIds.length === 0) {
        return '__new__';
      }
      if (current && current !== '__new__' && threadIds.includes(current)) {
        return current;
      }
      return threadIds[0];
    });
    setTrustAccountId((current) => {
      if (current) {
        return current;
      }
      const nextTrustAccounts = collectTrustAccountOptions(nextDashboard);
      return nextTrustAccounts[0]?.id || '';
    });
  }, [matterId]);

  const {
    editingOverview,
    setEditingOverview,
    overviewName,
    setOverviewName,
    overviewMatterNumber,
    setOverviewMatterNumber,
    overviewPracticeArea,
    setOverviewPracticeArea,
    overviewStatus,
    setOverviewStatus,
    overviewVenue,
    setOverviewVenue,
    overviewJurisdiction,
    setOverviewJurisdiction,
    overviewOpenedAt,
    setOverviewOpenedAt,
    overviewClosedAt,
    setOverviewClosedAt,
    overviewStatusMessage,
    syncOverviewFromDashboard,
    cancelOverviewEdit: cancelOverviewEditState,
    updateMatterOverview,
  } = useMatterOverview(matterId, refreshDashboard);

  useEffect(() => {
    if (!dashboard) {
      return;
    }
    syncOverviewFromDashboard(dashboard);
  }, [dashboard, syncOverviewFromDashboard]);

  useEffect(() => {
    if (!matterId) return;
    refreshDashboard().catch(() => undefined);
    apiFetch<Array<{ id: string; name: string; pack?: { version?: string } }>>('/calendar/rules-packs')
      .then((packs) => {
        setRulesPacks(packs);
        if (packs.length > 0) {
          setSelectedRulesPackId(packs[0].id);
        }
      })
      .catch(() => undefined);
    apiFetch<ParticipantContactOption[]>('/contacts')
      .then((contacts) => {
        setParticipantContacts(contacts);
        if (contacts.length > 0) {
          setSelectedParticipantContactId((current) => current || contacts[0].id);
        }
      })
      .catch(() => undefined);
    apiFetch<ParticipantRoleOption[]>(`/matters/${matterId}/participant-roles`)
      .then((roles) => {
        setParticipantRoleOptions(roles);
        if (roles.length > 0) {
          setSelectedParticipantRoleKey((current) => current || roles[0].key);
          setParticipantSide((current) =>
            current || (roles[0].sideDefault as ParticipantSideOption | null) || 'NEUTRAL',
          );
        }
      })
      .catch(() => undefined);
  }, [matterId, refreshDashboard]);

  const selectedParticipantRole = participantRoleOptions.find((role) => role.key === selectedParticipantRoleKey);
  const participantRoleIsCounsel = isCounselRole(selectedParticipantRole?.key, selectedParticipantRole?.label);

  useEffect(() => {
    if (!selectedParticipantRole) {
      return;
    }

    if (!editingParticipantId && selectedParticipantRole.sideDefault) {
      setParticipantSide(selectedParticipantRole.sideDefault as ParticipantSideOption);
    }

    if (participantRoleIsCounsel) {
      setParticipantRepresentedByContactId('');
    } else {
      setParticipantLawFirmContactId('');
    }
  }, [selectedParticipantRole, participantRoleIsCounsel, editingParticipantId]);

  async function previewDeadlines() {
    if (!matterId || !selectedRulesPackId || !triggerDate) return;
    const preview = await apiFetch<{ previewRows: DeadlinePreviewRow[] }>('/calendar/deadline-preview', {
      method: 'POST',
      body: JSON.stringify({
        matterId,
        triggerDate,
        rulesPackId: selectedRulesPackId,
      }),
    });
    setPreviewRows(preview.previewRows || []);
    setDeadlineStatus(`Previewed ${preview.previewRows?.length || 0} deadlines.`);
  }

  async function applyDeadlines() {
    if (!matterId || !selectedRulesPackId || !triggerDate || previewRows.length === 0) return;
    const selections = previewRows.map((row) => ({
      ruleId: row.ruleId,
      apply: true,
      ...(overrideDates[row.ruleId] ? { overrideDate: overrideDates[row.ruleId] } : {}),
      ...(overrideReasons[row.ruleId] ? { overrideReason: overrideReasons[row.ruleId] } : {}),
    }));
    const result = await apiFetch<{ created: Array<{ id: string }> }>('/calendar/deadline-preview/apply', {
      method: 'POST',
      body: JSON.stringify({
        matterId,
        triggerDate,
        rulesPackId: selectedRulesPackId,
        selections,
      }),
    });
    setDeadlineStatus(`Created ${result.created?.length || 0} calendar events from rules pack.`);
    setPreviewRows([]);
    setOverrideDates({});
    setOverrideReasons({});
    await refreshDashboard();
  }

  function cancelOverviewEdit() {
    cancelOverviewEditState(dashboard);
  }

  async function createOrUpdateTask() {
    if (!matterId || !taskTitle.trim()) {
      setTaskStatusMessage('Task title is required.');
      return;
    }

    if (editingTaskId) {
      await apiFetch(`/tasks/${editingTaskId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: taskTitle.trim(),
          ...(taskDueAt ? { dueAt: new Date(taskDueAt).toISOString() } : {}),
          priority: taskPriority,
        }),
      });
      setTaskStatusMessage('Task updated.');
      setEditingTaskId(null);
    } else {
      await apiFetch('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          matterId,
          title: taskTitle.trim(),
          ...(taskDueAt ? { dueAt: new Date(taskDueAt).toISOString() } : {}),
          priority: taskPriority,
        }),
      });
      setTaskStatusMessage('Task created.');
    }

    setTaskTitle('');
    setTaskDueAt('');
    setTaskPriority('MEDIUM');
    await refreshDashboard();
  }

  async function updateTaskStatus(taskId: string, status: string) {
    if (!TASK_STATUS_OPTIONS.includes(status as (typeof TASK_STATUS_OPTIONS)[number])) {
      return;
    }

    await apiFetch(`/tasks/${taskId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });

    setTaskStatusMessage(`Task status updated to ${status}.`);
    await refreshDashboard();
  }

  function startEditingTask(task: {
    id: string;
    title: string;
    dueAt?: string | null;
    priority?: (typeof TASK_PRIORITY_OPTIONS)[number];
  }) {
    setEditingTaskId(task.id);
    setTaskTitle(task.title || '');
    setTaskDueAt(toDateTimeLocalValue(task.dueAt));
    setTaskPriority(task.priority || 'MEDIUM');
    setTaskStatusMessage(`Editing task ${task.id}.`);
  }

  function cancelEditingTask() {
    setEditingTaskId(null);
    setTaskTitle('');
    setTaskDueAt('');
    setTaskPriority('MEDIUM');
    setTaskStatusMessage('Task edit cancelled.');
  }

  async function deleteTask(taskId: string) {
    await apiFetch(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
    if (editingTaskId === taskId) {
      setEditingTaskId(null);
      setTaskTitle('');
      setTaskDueAt('');
      setTaskPriority('MEDIUM');
    }
    setTaskStatusMessage('Task removed.');
    await refreshDashboard();
  }

  async function createOrUpdateCalendarEvent() {
    if (!matterId || !eventType.trim() || !eventStartAt) {
      setCalendarStatusMessage('Event type and start time are required.');
      return;
    }

    if (editingCalendarEventId) {
      await apiFetch(`/calendar/events/${editingCalendarEventId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          type: eventType.trim(),
          startAt: new Date(eventStartAt).toISOString(),
          ...(eventEndAt ? { endAt: new Date(eventEndAt).toISOString() } : { clearEndAt: true }),
          ...(eventLocation.trim() ? { location: eventLocation.trim() } : {}),
        }),
      });
      setCalendarStatusMessage('Calendar event updated.');
      setEditingCalendarEventId(null);
    } else {
      await apiFetch('/calendar/events', {
        method: 'POST',
        body: JSON.stringify({
          matterId,
          type: eventType.trim(),
          startAt: new Date(eventStartAt).toISOString(),
          ...(eventEndAt ? { endAt: new Date(eventEndAt).toISOString() } : {}),
          ...(eventLocation.trim() ? { location: eventLocation.trim() } : {}),
        }),
      });
      setCalendarStatusMessage('Calendar event created.');
    }

    setEventType('');
    setEventStartAt('');
    setEventEndAt('');
    setEventLocation('');
    await refreshDashboard();
  }

  function startEditingCalendarEvent(event: {
    id: string;
    type: string;
    startAt: string;
    endAt?: string | null;
    location?: string | null;
  }) {
    setEditingCalendarEventId(event.id);
    setEventType(event.type || '');
    setEventStartAt(toDateTimeLocalValue(event.startAt));
    setEventEndAt(toDateTimeLocalValue(event.endAt));
    setEventLocation(event.location || '');
    setCalendarStatusMessage(`Editing calendar event ${event.id}.`);
  }

  function cancelEditingCalendarEvent() {
    setEditingCalendarEventId(null);
    setEventType('');
    setEventStartAt('');
    setEventEndAt('');
    setEventLocation('');
    setCalendarStatusMessage('Calendar event edit cancelled.');
  }

  async function deleteCalendarEvent(eventId: string) {
    await apiFetch(`/calendar/events/${eventId}`, {
      method: 'DELETE',
    });
    if (editingCalendarEventId === eventId) {
      setEditingCalendarEventId(null);
      setEventType('');
      setEventStartAt('');
      setEventEndAt('');
      setEventLocation('');
    }
    setCalendarStatusMessage('Calendar event removed.');
    await refreshDashboard();
  }

  async function exportCalendarIcs() {
    if (!matterId) {
      return;
    }

    const token = getSessionToken();
    const response = await fetch(`${API_BASE}/calendar/events/${matterId}/ics`, {
      method: 'GET',
      headers: token ? { 'x-session-token': token } : undefined,
      credentials: 'include',
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status} ${response.statusText}: ${text}`);
    }

    const blob = await response.blob();
    const disposition = response.headers.get('content-disposition') || '';
    const filenameMatch = disposition.match(/filename="?([^";]+)"?/i);
    const filename = filenameMatch?.[1] || `${matterId}.ics`;
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    setCalendarStatusMessage(`Calendar ICS exported: ${filename}.`);
  }

  function resetParticipantForm() {
    setEditingParticipantId(null);
    setParticipantIsPrimary(false);
    setParticipantRepresentedByContactId('');
    setParticipantLawFirmContactId('');
    setParticipantNotes('');
    const defaultRole = participantRoleOptions.find((role) => role.key === selectedParticipantRoleKey) || participantRoleOptions[0];
    if (defaultRole) {
      setSelectedParticipantRoleKey(defaultRole.key);
      setParticipantSide((defaultRole.sideDefault as ParticipantSideOption | null) || 'NEUTRAL');
    }
  }

  async function createOrUpdateParticipant() {
    if (!matterId || !selectedParticipantContactId || !selectedParticipantRoleKey || !participantSide) {
      setParticipantStatusMessage('Contact and participant role are required.');
      return;
    }

    const payload = {
      contactId: selectedParticipantContactId,
      participantRoleKey: selectedParticipantRoleKey,
      side: participantSide,
      isPrimary: participantIsPrimary,
      representedByContactId: participantRoleIsCounsel ? null : participantRepresentedByContactId || null,
      lawFirmContactId: participantRoleIsCounsel ? participantLawFirmContactId || null : null,
      notes: participantNotes.trim() ? participantNotes.trim() : null,
    };

    if (editingParticipantId) {
      await apiFetch(`/matters/${matterId}/participants/${editingParticipantId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });
      setParticipantStatusMessage('Participant updated.');
    } else {
      await apiFetch(`/matters/${matterId}/participants`, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setParticipantStatusMessage('Participant added.');
    }

    resetParticipantForm();
    await refreshDashboard();
  }

  function startEditingParticipant(participant: {
    id: string;
    contactId: string;
    participantRoleKey: string;
    side?: ParticipantSideOption | null;
    isPrimary?: boolean;
    representedByContactId?: string | null;
    lawFirmContactId?: string | null;
    representedByContact?: { id: string } | null;
    lawFirmContact?: { id: string } | null;
    notes?: string | null;
  }) {
    setEditingParticipantId(participant.id);
    setSelectedParticipantContactId(participant.contactId);
    setSelectedParticipantRoleKey(participant.participantRoleKey);
    setParticipantSide(participant.side || 'NEUTRAL');
    setParticipantIsPrimary(Boolean(participant.isPrimary));
    setParticipantRepresentedByContactId(participant.representedByContact?.id || participant.representedByContactId || '');
    setParticipantLawFirmContactId(participant.lawFirmContact?.id || participant.lawFirmContactId || '');
    setParticipantNotes(participant.notes || '');
    setParticipantStatusMessage(`Editing participant ${participant.id}.`);
  }

  function cancelEditingParticipant() {
    resetParticipantForm();
    setParticipantStatusMessage('Participant edit cancelled.');
  }

  async function removeParticipant(participantId: string) {
    if (!matterId) {
      return;
    }

    await apiFetch(`/matters/${matterId}/participants/${participantId}`, {
      method: 'DELETE',
    });

    if (editingParticipantId === participantId) {
      resetParticipantForm();
    }
    setParticipantStatusMessage('Participant removed.');
    await refreshDashboard();
  }

  async function logCommunicationEntry() {
    if (!matterId) {
      return;
    }

    const normalizedBody = communicationBody.trim();
    if (!normalizedBody) {
      setCommunicationStatusMessage('Communication body is required.');
      return;
    }

    const normalizedSubject = communicationSubject.trim();
    const normalizedThreadSubject = newCommunicationThreadSubject.trim();
    const isNewThread = selectedCommunicationThreadId === '__new__';

    if (editingCommunicationId) {
      if (isNewThread) {
        setCommunicationStatusMessage('Select an existing thread while editing a communication entry.');
        return;
      }

      await apiFetch(`/matters/${matterId}/communications/${editingCommunicationId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          threadId: selectedCommunicationThreadId,
          type: communicationType,
          direction: communicationDirection,
          subject: normalizedSubject,
          body: normalizedBody,
          participantContactId: communicationParticipantContactId,
          ...(communicationOccurredAt ? { occurredAt: new Date(communicationOccurredAt).toISOString() } : {}),
        }),
      });

      setCommunicationStatusMessage('Communication entry updated.');
      setEditingCommunicationId(null);
    } else {
      await apiFetch(`/matters/${matterId}/communications/log`, {
        method: 'POST',
        body: JSON.stringify({
          ...(isNewThread
            ? {
                threadSubject: normalizedThreadSubject || normalizedSubject || `${communicationType} log`,
              }
            : {
                threadId: selectedCommunicationThreadId,
              }),
          type: communicationType,
          direction: communicationDirection,
          ...(normalizedSubject ? { subject: normalizedSubject } : {}),
          body: normalizedBody,
          ...(communicationParticipantContactId ? { participantContactId: communicationParticipantContactId } : {}),
          ...(communicationOccurredAt ? { occurredAt: new Date(communicationOccurredAt).toISOString() } : {}),
        }),
      });

      setCommunicationStatusMessage('Communication entry logged.');
    }

    setCommunicationSubject('');
    setCommunicationBody('');
    setCommunicationParticipantContactId('');
    setCommunicationOccurredAt(new Date().toISOString().slice(0, 16));
    setNewCommunicationThreadSubject('');
    await refreshDashboard();
  }

  function startEditingCommunication(row: {
    id: string;
    threadId: string;
    type: (typeof COMMUNICATION_TYPE_OPTIONS)[number];
    direction: (typeof COMMUNICATION_DIRECTION_OPTIONS)[number];
    subject: string;
    body: string;
    occurredAt: string;
    participantContactId?: string;
  }) {
    setEditingCommunicationId(row.id);
    setSelectedCommunicationThreadId(row.threadId);
    setCommunicationType(row.type);
    setCommunicationDirection(row.direction);
    setCommunicationSubject(row.subject);
    setCommunicationBody(row.body);
    setCommunicationParticipantContactId(row.participantContactId || '');
    setCommunicationOccurredAt(new Date(row.occurredAt).toISOString().slice(0, 16));
    setCommunicationStatusMessage(`Editing communication entry ${row.id}.`);
  }

  function cancelEditingCommunication() {
    setEditingCommunicationId(null);
    setCommunicationSubject('');
    setCommunicationBody('');
    setCommunicationParticipantContactId('');
    setCommunicationOccurredAt(new Date().toISOString().slice(0, 16));
    setCommunicationStatusMessage('Communication edit cancelled.');
  }

  async function deleteCommunicationEntry(messageId: string) {
    if (!matterId) {
      return;
    }

    await apiFetch(`/matters/${matterId}/communications/${messageId}`, {
      method: 'DELETE',
    });

    if (editingCommunicationId === messageId) {
      setEditingCommunicationId(null);
      setCommunicationSubject('');
      setCommunicationBody('');
      setCommunicationParticipantContactId('');
      setCommunicationOccurredAt(new Date().toISOString().slice(0, 16));
    }

    setCommunicationStatusMessage('Communication entry removed.');
    await refreshDashboard();
  }

  async function uploadDocumentForm(path: string, formData: FormData) {
    const token = getSessionToken();
    const response = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      body: formData,
      headers: token ? { 'x-session-token': token } : undefined,
      credentials: 'include',
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`${response.status} ${response.statusText}: ${text}`);
    }
    return response.status === 204 ? null : response.json();
  }

  async function uploadMatterDocument() {
    if (!matterId || !documentTitle.trim() || !documentFile) {
      setDocumentStatusMessage('Document title and file are required.');
      return;
    }

    const formData = new FormData();
    formData.set('matterId', matterId);
    formData.set('title', documentTitle.trim());
    formData.set('file', documentFile);

    await uploadDocumentForm('/documents/upload', formData);
    setDocumentTitle('Matter Document');
    setDocumentFile(null);
    setDocumentStatusMessage('Document uploaded.');
    await refreshDashboard();
  }

  async function uploadMatterDocumentVersion(documentId: string) {
    const file = documentVersionFiles[documentId];
    if (!file) {
      setDocumentStatusMessage('Select a version file before uploading.');
      return;
    }

    const formData = new FormData();
    formData.set('file', file);
    await uploadDocumentForm(`/documents/${documentId}/versions`, formData);
    setDocumentVersionFiles((current) => ({
      ...current,
      [documentId]: null,
    }));
    setDocumentStatusMessage('Document version uploaded.');
    await refreshDashboard();
  }

  async function toggleMatterDocumentSharing(documentId: string, sharedWithClient: boolean) {
    await apiFetch(`/documents/${documentId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        sharedWithClient: !sharedWithClient,
      }),
    });
    setDocumentStatusMessage(sharedWithClient ? 'Client sharing disabled.' : 'Client sharing enabled.');
    await refreshDashboard();
  }

  async function createMatterDocumentShareLink(documentId: string) {
    const share = await apiFetch<{ url: string; expiresAt: string }>(`/documents/${documentId}/share-link`, {
      method: 'POST',
      body: JSON.stringify({
        expiresInHours: 72,
      }),
    });
    setDocumentStatusMessage(`Share link issued (expires ${new Date(share.expiresAt).toLocaleString()}): ${share.url}`);
  }

  async function issueLatestDocumentDownload(documentId: string, latestVersionId?: string | null) {
    if (!latestVersionId) {
      setDocumentStatusMessage(`No versions available for ${documentId}.`);
      return;
    }
    const download = await apiFetch<{ url: string }>(`/documents/versions/${latestVersionId}/download-url`);
    setDocumentStatusMessage(`Signed download URL issued: ${download.url}`);
  }

  async function createMatterTimeEntry() {
    if (!matterId || !timeEntryStartAt || !timeEntryEndAt) {
      setBillingStatusMessage('Time entry start/end are required.');
      return;
    }

    const created = await apiFetch<any>('/billing/time-entries', {
      method: 'POST',
      body: JSON.stringify({
        matterId,
        ...(timeEntryDescription.trim() ? { description: timeEntryDescription.trim() } : {}),
        startedAt: new Date(timeEntryStartAt).toISOString(),
        endedAt: new Date(timeEntryEndAt).toISOString(),
        ...(timeEntryRate.trim() ? { billableRate: Number(timeEntryRate) } : {}),
      }),
    });

    setTimeEntryDescription('');
    setBillingStatusMessage(
      withTimestamp(
        `Time entry created (${created.durationMinutes} minutes, $${Number(created.amount || 0).toFixed(2)}).`,
      ),
    );
    await refreshDashboard();
  }

  async function createMatterExpense() {
    if (!matterId || !expenseDescription.trim() || !expenseAmount.trim() || !expenseIncurredAt) {
      setBillingStatusMessage('Expense description, amount, and incurred time are required.');
      return;
    }

    await apiFetch('/billing/expenses', {
      method: 'POST',
      body: JSON.stringify({
        matterId,
        description: expenseDescription.trim(),
        amount: Number(expenseAmount),
        incurredAt: new Date(expenseIncurredAt).toISOString(),
      }),
    });

    setExpenseDescription('');
    setExpenseAmount('');
    setBillingStatusMessage(withTimestamp('Expense created.'));
    await refreshDashboard();
  }

  async function createMatterInvoice() {
    if (!matterId || !invoiceLineDescription.trim() || !invoiceLineQuantity.trim() || !invoiceLineUnitPrice.trim()) {
      setBillingStatusMessage('Invoice line description, quantity, and unit price are required.');
      return;
    }

    const quantity = Number(invoiceLineQuantity);
    const unitPrice = Number(invoiceLineUnitPrice);
    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
      setBillingStatusMessage('Invoice quantity and unit price must be valid numbers.');
      return;
    }

    const created = await apiFetch<any>('/billing/invoices', {
      method: 'POST',
      body: JSON.stringify({
        matterId,
        ...(invoiceDueAt ? { dueAt: new Date(invoiceDueAt).toISOString() } : {}),
        lineItems: [
          {
            description: invoiceLineDescription.trim(),
            quantity,
            unitPrice,
          },
        ],
      }),
    });

    setBillingStatusMessage(
      withTimestamp(`Invoice ${created.invoiceNumber} created (balance $${Number(created.balanceDue || 0).toFixed(2)}).`),
    );
    await refreshDashboard();
  }

  async function createInvoiceCheckoutLink(invoiceId: string) {
    const checkout = await apiFetch<{ url?: string | null; warning?: string | null }>(`/billing/invoices/${invoiceId}/checkout`, {
      method: 'POST',
    });
    if (checkout.url) {
      setBillingStatusMessage(withTimestamp(`Checkout link issued for invoice ${invoiceId}: ${checkout.url}`));
      return;
    }
    setBillingStatusMessage(withTimestamp(checkout.warning || `Checkout link not generated for invoice ${invoiceId}.`));
  }

  async function recordInvoicePayment(invoiceId: string) {
    const amountRaw = invoicePaymentAmountById[invoiceId];
    const method = invoicePaymentMethodById[invoiceId] || 'MANUAL';
    const amount = Number(amountRaw);

    if (!amountRaw || !Number.isFinite(amount) || amount <= 0) {
      setBillingStatusMessage('Payment amount must be greater than zero.');
      return;
    }

    await apiFetch(`/billing/invoices/${invoiceId}/payments`, {
      method: 'POST',
      body: JSON.stringify({
        amount,
        method,
        ...(invoicePaymentReferenceById[invoiceId]?.trim()
          ? { reference: invoicePaymentReferenceById[invoiceId].trim() }
          : {}),
      }),
    });

    setInvoicePaymentAmountById((current) => ({ ...current, [invoiceId]: '' }));
    setInvoicePaymentReferenceById((current) => ({ ...current, [invoiceId]: '' }));
    setBillingStatusMessage(withTimestamp(`Payment recorded for invoice ${invoiceId}.`));
    await refreshDashboard();
  }

  async function createMatterTrustTransaction() {
    if (!matterId || !trustAccountId.trim() || !trustTransactionAmount.trim()) {
      setBillingStatusMessage('Trust account and amount are required for trust transactions.');
      return;
    }

    const amount = Number(trustTransactionAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setBillingStatusMessage('Trust transaction amount must be greater than zero.');
      return;
    }

    await apiFetch('/billing/trust/transactions', {
      method: 'POST',
      body: JSON.stringify({
        matterId,
        trustAccountId: trustAccountId.trim(),
        type: trustTransactionType,
        amount,
        ...(trustTransactionDescription.trim() ? { description: trustTransactionDescription.trim() } : {}),
      }),
    });

    setTrustTransactionAmount('');
    setTrustTransactionDescription('');
    setBillingStatusMessage(withTimestamp(`Trust transaction ${trustTransactionType} posted.`));
    await refreshDashboard();
  }

  const communicationRows = dashboard
    ? (dashboard.communicationThreads || [])
        .flatMap((thread: CommunicationThread) =>
          (thread.messages || []).map((message) => ({
            ...message,
            threadId: thread.id,
            threadSubject: thread.subject || thread.id,
            subject: message.subject || '',
            participantContactId: message.participants?.[0]?.contact?.id || message.participants?.[0]?.contactId || '',
            participantContactName: message.participants?.[0]?.contact?.displayName || '',
          })),
        )
        .sort(
          (left: { occurredAt: string }, right: { occurredAt: string }) =>
            new Date(right.occurredAt).getTime() - new Date(left.occurredAt).getTime(),
        )
    : [];

  return {
    dashboard,
    editingOverview,
    setEditingOverview,
    overviewName,
    setOverviewName,
    overviewMatterNumber,
    setOverviewMatterNumber,
    overviewPracticeArea,
    setOverviewPracticeArea,
    overviewStatus,
    setOverviewStatus,
    overviewVenue,
    setOverviewVenue,
    overviewJurisdiction,
    setOverviewJurisdiction,
    overviewOpenedAt,
    setOverviewOpenedAt,
    overviewClosedAt,
    setOverviewClosedAt,
    overviewStatusMessage,
    rulesPacks,
    selectedRulesPackId,
    setSelectedRulesPackId,
    triggerDate,
    setTriggerDate,
    previewRows,
    overrideDates,
    setOverrideDates,
    overrideReasons,
    setOverrideReasons,
    deadlineStatus,
    taskTitle,
    setTaskTitle,
    taskDueAt,
    setTaskDueAt,
    taskPriority,
    setTaskPriority,
    taskStatusMessage,
    editingTaskId,
    eventType,
    setEventType,
    eventStartAt,
    setEventStartAt,
    eventEndAt,
    setEventEndAt,
    eventLocation,
    setEventLocation,
    calendarStatusMessage,
    editingCalendarEventId,
    participantContacts,
    participantRoleOptions,
    selectedParticipantContactId,
    setSelectedParticipantContactId,
    selectedParticipantRoleKey,
    setSelectedParticipantRoleKey,
    participantSide,
    setParticipantSide,
    participantIsPrimary,
    setParticipantIsPrimary,
    participantRepresentedByContactId,
    setParticipantRepresentedByContactId,
    participantLawFirmContactId,
    setParticipantLawFirmContactId,
    participantNotes,
    setParticipantNotes,
    editingParticipantId,
    participantStatusMessage,
    participantRoleIsCounsel,
    selectedCommunicationThreadId,
    setSelectedCommunicationThreadId,
    newCommunicationThreadSubject,
    setNewCommunicationThreadSubject,
    communicationType,
    setCommunicationType,
    communicationDirection,
    setCommunicationDirection,
    communicationSubject,
    setCommunicationSubject,
    communicationBody,
    setCommunicationBody,
    communicationParticipantContactId,
    setCommunicationParticipantContactId,
    communicationOccurredAt,
    setCommunicationOccurredAt,
    communicationStatusMessage,
    editingCommunicationId,
    communicationRows,
    documentTitle,
    setDocumentTitle,
    setDocumentFile,
    setDocumentVersionFiles,
    documentStatusMessage,
    timeEntryDescription,
    setTimeEntryDescription,
    timeEntryStartAt,
    setTimeEntryStartAt,
    timeEntryEndAt,
    setTimeEntryEndAt,
    timeEntryRate,
    setTimeEntryRate,
    expenseDescription,
    setExpenseDescription,
    expenseAmount,
    setExpenseAmount,
    expenseIncurredAt,
    setExpenseIncurredAt,
    invoiceLineDescription,
    setInvoiceLineDescription,
    invoiceLineQuantity,
    setInvoiceLineQuantity,
    invoiceLineUnitPrice,
    setInvoiceLineUnitPrice,
    invoiceDueAt,
    setInvoiceDueAt,
    invoicePaymentAmountById,
    setInvoicePaymentAmountById,
    invoicePaymentReferenceById,
    setInvoicePaymentReferenceById,
    invoicePaymentMethodById,
    setInvoicePaymentMethodById,
    trustAccountId,
    setTrustAccountId,
    trustTransactionType,
    setTrustTransactionType,
    trustTransactionAmount,
    setTrustTransactionAmount,
    trustTransactionDescription,
    setTrustTransactionDescription,
    billingStatusMessage,
    trustAccountOptions,
    previewDeadlines,
    applyDeadlines,
    cancelOverviewEdit,
    updateMatterOverview,
    createOrUpdateTask,
    updateTaskStatus,
    startEditingTask,
    cancelEditingTask,
    deleteTask,
    createOrUpdateCalendarEvent,
    startEditingCalendarEvent,
    cancelEditingCalendarEvent,
    deleteCalendarEvent,
    exportCalendarIcs,
    createOrUpdateParticipant,
    startEditingParticipant,
    cancelEditingParticipant,
    removeParticipant,
    logCommunicationEntry,
    startEditingCommunication,
    cancelEditingCommunication,
    deleteCommunicationEntry,
    uploadMatterDocument,
    uploadMatterDocumentVersion,
    toggleMatterDocumentSharing,
    createMatterDocumentShareLink,
    issueLatestDocumentDownload,
    createMatterTimeEntry,
    createMatterExpense,
    createMatterInvoice,
    createInvoiceCheckoutLink,
    recordInvoicePayment,
    createMatterTrustTransaction,
  };
}

'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { apiFetch, getSessionToken } from '../../../lib/api';
import {
  matterCalendarEventSchema,
  matterCommunicationSchema,
  matterParticipantSchema,
  matterTaskSchema,
  type MatterCalendarEventFormData,
  type MatterCommunicationFormData,
  type MatterParticipantFormData,
  type MatterTaskFormData,
} from '../../../lib/schemas/matter-dashboard';
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
  const [taskStatusMessage, setTaskStatusMessage] = useState<string | null>(null);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [calendarStatusMessage, setCalendarStatusMessage] = useState<string | null>(null);
  const [editingCalendarEventId, setEditingCalendarEventId] = useState<string | null>(null);
  const [participantContacts, setParticipantContacts] = useState<ParticipantContactOption[]>([]);
  const [participantRoleOptions, setParticipantRoleOptions] = useState<ParticipantRoleOption[]>([]);
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [participantStatusMessage, setParticipantStatusMessage] = useState<string | null>(null);
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
  const taskForm = useForm<MatterTaskFormData>({
    resolver: zodResolver(matterTaskSchema),
    mode: 'onBlur',
    defaultValues: {
      title: '',
      dueAt: '',
      priority: 'MEDIUM',
    },
  });
  const calendarEventForm = useForm<MatterCalendarEventFormData>({
    resolver: zodResolver(matterCalendarEventSchema),
    mode: 'onBlur',
    defaultValues: {
      type: '',
      startAt: '',
      endAt: '',
      location: '',
    },
  });
  const participantForm = useForm<MatterParticipantFormData>({
    resolver: zodResolver(matterParticipantSchema),
    mode: 'onBlur',
    defaultValues: {
      contactId: '',
      participantRoleKey: '',
      side: 'NEUTRAL',
      isPrimary: false,
      representedByContactId: '',
      lawFirmContactId: '',
      notes: '',
    },
  });
  const communicationForm = useForm<MatterCommunicationFormData>({
    resolver: zodResolver(matterCommunicationSchema),
    mode: 'onBlur',
    defaultValues: {
      threadId: '__new__',
      threadSubject: '',
      type: 'CALL_LOG',
      direction: 'INBOUND',
      participantContactId: '',
      occurredAt: new Date().toISOString().slice(0, 16),
      subject: '',
      body: '',
    },
  });
  const selectedParticipantContactId = useWatch({ control: participantForm.control, name: 'contactId' }) || '';
  const selectedParticipantRoleKey = useWatch({ control: participantForm.control, name: 'participantRoleKey' }) || '';
  const participantSide = (useWatch({ control: participantForm.control, name: 'side' }) || 'NEUTRAL') as ParticipantSideOption;
  const participantIsPrimary = Boolean(useWatch({ control: participantForm.control, name: 'isPrimary' }));
  const participantRepresentedByContactId =
    useWatch({ control: participantForm.control, name: 'representedByContactId' }) || '';
  const participantLawFirmContactId = useWatch({ control: participantForm.control, name: 'lawFirmContactId' }) || '';
  const participantNotes = useWatch({ control: participantForm.control, name: 'notes' }) || '';
  const selectedCommunicationThreadId = useWatch({ control: communicationForm.control, name: 'threadId' }) || '__new__';

  const refreshDashboard = useCallback(async () => {
    if (!matterId) {
      return;
    }
    const nextDashboard = await apiFetch<any>(`/matters/${matterId}/dashboard`);
    setDashboard(nextDashboard);
    const threadIds = (nextDashboard.communicationThreads || []).map((thread: CommunicationThread) => thread.id);
    const currentThreadId = communicationForm.getValues('threadId');
    const nextThreadId =
      threadIds.length === 0
        ? '__new__'
        : currentThreadId && currentThreadId !== '__new__' && threadIds.includes(currentThreadId)
          ? currentThreadId
          : threadIds[0];
    communicationForm.setValue('threadId', nextThreadId, { shouldDirty: false });
    setTrustAccountId((current) => {
      if (current) {
        return current;
      }
      const nextTrustAccounts = collectTrustAccountOptions(nextDashboard);
      return nextTrustAccounts[0]?.id || '';
    });
  }, [communicationForm, matterId]);

  const {
    editingOverview,
    overviewForm,
    overviewStatusMessage,
    syncOverviewFromDashboard,
    startOverviewEdit,
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
        if (contacts.length > 0 && !participantForm.getValues('contactId')) {
          participantForm.setValue('contactId', contacts[0].id, { shouldDirty: false });
        }
      })
      .catch(() => undefined);
    apiFetch<ParticipantRoleOption[]>(`/matters/${matterId}/participant-roles`)
      .then((roles) => {
        setParticipantRoleOptions(roles);
        if (roles.length > 0) {
          if (!participantForm.getValues('participantRoleKey')) {
            participantForm.setValue('participantRoleKey', roles[0].key, { shouldDirty: false });
          }
          if (!participantForm.getValues('side')) {
            participantForm.setValue('side', (roles[0].sideDefault as ParticipantSideOption | null) || 'NEUTRAL', {
              shouldDirty: false,
            });
          }
        }
      })
      .catch(() => undefined);
  }, [matterId, participantForm, refreshDashboard]);

  const selectedParticipantRole = useMemo(
    () => participantRoleOptions.find((role) => role.key === selectedParticipantRoleKey),
    [participantRoleOptions, selectedParticipantRoleKey],
  );
  const participantRoleIsCounsel = isCounselRole(selectedParticipantRole?.key, selectedParticipantRole?.label);

  useEffect(() => {
    if (!selectedParticipantRole) {
      return;
    }

    if (!editingParticipantId && selectedParticipantRole.sideDefault) {
      participantForm.setValue('side', selectedParticipantRole.sideDefault as ParticipantSideOption, { shouldDirty: true });
    }

    if (participantRoleIsCounsel) {
      participantForm.setValue('representedByContactId', '', { shouldDirty: true });
    } else {
      participantForm.setValue('lawFirmContactId', '', { shouldDirty: true });
    }
  }, [editingParticipantId, participantForm, participantRoleIsCounsel, selectedParticipantRole]);

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

  const createOrUpdateTask = taskForm.handleSubmit(
    async (values) => {
      if (!matterId) {
        return;
      }

      if (editingTaskId) {
        await apiFetch(`/tasks/${editingTaskId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            title: values.title.trim(),
            ...(values.dueAt ? { dueAt: new Date(values.dueAt).toISOString() } : {}),
            priority: values.priority,
          }),
        });
        setTaskStatusMessage('Task updated.');
        setEditingTaskId(null);
      } else {
        await apiFetch('/tasks', {
          method: 'POST',
          body: JSON.stringify({
            matterId,
            title: values.title.trim(),
            ...(values.dueAt ? { dueAt: new Date(values.dueAt).toISOString() } : {}),
            priority: values.priority,
          }),
        });
        setTaskStatusMessage('Task created.');
      }

      taskForm.reset({
        title: '',
        dueAt: '',
        priority: 'MEDIUM',
      });
      await refreshDashboard();
    },
    async () => {
      setTaskStatusMessage(null);
    },
  );

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
    taskForm.reset({
      title: task.title || '',
      dueAt: toDateTimeLocalValue(task.dueAt),
      priority: task.priority || 'MEDIUM',
    });
    setTaskStatusMessage(`Editing task ${task.id}.`);
  }

  function cancelEditingTask() {
    setEditingTaskId(null);
    taskForm.reset({
      title: '',
      dueAt: '',
      priority: 'MEDIUM',
    });
    setTaskStatusMessage('Task edit cancelled.');
  }

  async function deleteTask(taskId: string) {
    await apiFetch(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
    if (editingTaskId === taskId) {
      setEditingTaskId(null);
      taskForm.reset({
        title: '',
        dueAt: '',
        priority: 'MEDIUM',
      });
    }
    setTaskStatusMessage('Task removed.');
    await refreshDashboard();
  }

  const createOrUpdateCalendarEvent = calendarEventForm.handleSubmit(async (values) => {
    if (!matterId) {
      return;
    }

    if (editingCalendarEventId) {
      await apiFetch(`/calendar/events/${editingCalendarEventId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          type: values.type.trim(),
          startAt: new Date(values.startAt).toISOString(),
          ...(values.endAt ? { endAt: new Date(values.endAt).toISOString() } : { clearEndAt: true }),
          ...(values.location?.trim() ? { location: values.location.trim() } : {}),
        }),
      });
      setCalendarStatusMessage('Calendar event updated.');
      setEditingCalendarEventId(null);
    } else {
      await apiFetch('/calendar/events', {
        method: 'POST',
        body: JSON.stringify({
          matterId,
          type: values.type.trim(),
          startAt: new Date(values.startAt).toISOString(),
          ...(values.endAt ? { endAt: new Date(values.endAt).toISOString() } : {}),
          ...(values.location?.trim() ? { location: values.location.trim() } : {}),
        }),
      });
      setCalendarStatusMessage('Calendar event created.');
    }

    calendarEventForm.reset({
      type: '',
      startAt: '',
      endAt: '',
      location: '',
    });
    await refreshDashboard();
  });

  function startEditingCalendarEvent(event: {
    id: string;
    type: string;
    startAt: string;
    endAt?: string | null;
    location?: string | null;
  }) {
    setEditingCalendarEventId(event.id);
    calendarEventForm.reset({
      type: event.type || '',
      startAt: toDateTimeLocalValue(event.startAt),
      endAt: toDateTimeLocalValue(event.endAt),
      location: event.location || '',
    });
    setCalendarStatusMessage(`Editing calendar event ${event.id}.`);
  }

  function cancelEditingCalendarEvent() {
    setEditingCalendarEventId(null);
    calendarEventForm.reset({
      type: '',
      startAt: '',
      endAt: '',
      location: '',
    });
    setCalendarStatusMessage('Calendar event edit cancelled.');
  }

  async function deleteCalendarEvent(eventId: string) {
    await apiFetch(`/calendar/events/${eventId}`, {
      method: 'DELETE',
    });
    if (editingCalendarEventId === eventId) {
      setEditingCalendarEventId(null);
      calendarEventForm.reset({
        type: '',
        startAt: '',
        endAt: '',
        location: '',
      });
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
    const defaultRole = participantRoleOptions.find((role) => role.key === selectedParticipantRoleKey) || participantRoleOptions[0];
    participantForm.reset({
      contactId: participantContacts[0]?.id || '',
      participantRoleKey: defaultRole?.key || '',
      side: (defaultRole?.sideDefault as ParticipantSideOption | null) || 'NEUTRAL',
      isPrimary: false,
      representedByContactId: '',
      lawFirmContactId: '',
      notes: '',
    });
  }

  const createOrUpdateParticipant = participantForm.handleSubmit(async (values) => {
    if (!matterId) {
      return;
    }
    const payload = {
      contactId: values.contactId,
      participantRoleKey: values.participantRoleKey,
      side: values.side,
      isPrimary: values.isPrimary,
      representedByContactId: participantRoleIsCounsel ? null : values.representedByContactId || null,
      lawFirmContactId: participantRoleIsCounsel ? values.lawFirmContactId || null : null,
      notes: values.notes?.trim() ? values.notes.trim() : null,
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
  });

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
    participantForm.reset({
      contactId: participant.contactId,
      participantRoleKey: participant.participantRoleKey,
      side: participant.side || 'NEUTRAL',
      isPrimary: Boolean(participant.isPrimary),
      representedByContactId: participant.representedByContact?.id || participant.representedByContactId || '',
      lawFirmContactId: participant.lawFirmContact?.id || participant.lawFirmContactId || '',
      notes: participant.notes || '',
    });
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

  function onParticipantRoleChange(nextRoleKey: string) {
    const role = participantRoleOptions.find((option) => option.key === nextRoleKey);
    if (!editingParticipantId && role?.sideDefault) {
      participantForm.setValue('side', role.sideDefault as ParticipantSideOption, { shouldDirty: true });
    }
  }

  function onParticipantSideChange(nextSide: ParticipantSideOption) {
    participantForm.setValue('side', nextSide, { shouldDirty: true, shouldValidate: true });
  }

  const logCommunicationEntry = communicationForm.handleSubmit(
    async (values) => {
      if (!matterId) {
        return;
      }

      const normalizedBody = values.body.trim();
      const normalizedSubject = values.subject?.trim() || '';
      const normalizedThreadSubject = values.threadSubject?.trim() || '';
      const isNewThread = values.threadId === '__new__';

      if (editingCommunicationId) {
        if (isNewThread) {
          setCommunicationStatusMessage('Select an existing thread while editing a communication entry.');
          return;
        }

        await apiFetch(`/matters/${matterId}/communications/${editingCommunicationId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            threadId: values.threadId,
            type: values.type,
            direction: values.direction,
            subject: normalizedSubject,
            body: normalizedBody,
            participantContactId: values.participantContactId,
            ...(values.occurredAt ? { occurredAt: new Date(values.occurredAt).toISOString() } : {}),
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
                  threadSubject: normalizedThreadSubject || normalizedSubject || `${values.type} log`,
                }
              : {
                  threadId: values.threadId,
                }),
            type: values.type,
            direction: values.direction,
            ...(normalizedSubject ? { subject: normalizedSubject } : {}),
            body: normalizedBody,
            ...(values.participantContactId ? { participantContactId: values.participantContactId } : {}),
            ...(values.occurredAt ? { occurredAt: new Date(values.occurredAt).toISOString() } : {}),
          }),
        });

        setCommunicationStatusMessage('Communication entry logged.');
      }

      communicationForm.reset({
        threadId: values.threadId,
        threadSubject: '',
        type: values.type,
        direction: values.direction,
        participantContactId: '',
        occurredAt: new Date().toISOString().slice(0, 16),
        subject: '',
        body: '',
      });
      await refreshDashboard();
    },
    async () => {
      setCommunicationStatusMessage(null);
    },
  );

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
    communicationForm.reset({
      threadId: row.threadId,
      threadSubject: '',
      type: row.type,
      direction: row.direction,
      participantContactId: row.participantContactId || '',
      occurredAt: new Date(row.occurredAt).toISOString().slice(0, 16),
      subject: row.subject,
      body: row.body,
    });
    setCommunicationStatusMessage(`Editing communication entry ${row.id}.`);
  }

  function cancelEditingCommunication() {
    setEditingCommunicationId(null);
    communicationForm.reset({
      threadId: communicationForm.getValues('threadId'),
      threadSubject: '',
      type: communicationForm.getValues('type'),
      direction: communicationForm.getValues('direction'),
      participantContactId: '',
      occurredAt: new Date().toISOString().slice(0, 16),
      subject: '',
      body: '',
    });
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
      communicationForm.reset({
        threadId: communicationForm.getValues('threadId'),
        threadSubject: '',
        type: communicationForm.getValues('type'),
        direction: communicationForm.getValues('direction'),
        participantContactId: '',
        occurredAt: new Date().toISOString().slice(0, 16),
        subject: '',
        body: '',
      });
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

  const communicationRows = useMemo(
    () =>
      dashboard
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
        : [],
    [dashboard],
  );

  return {
    dashboard,
    editingOverview,
    overviewForm,
    overviewStatusMessage,
    startOverviewEdit: () => startOverviewEdit(dashboard),
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
    taskForm,
    taskStatusMessage,
    editingTaskId,
    calendarEventForm,
    calendarStatusMessage,
    editingCalendarEventId,
    participantContacts,
    participantRoleOptions,
    participantForm,
    selectedParticipantContactId,
    selectedParticipantRoleKey,
    participantSide,
    participantIsPrimary,
    participantRepresentedByContactId,
    participantLawFirmContactId,
    participantNotes,
    editingParticipantId,
    participantStatusMessage,
    participantRoleIsCounsel,
    communicationForm,
    selectedCommunicationThreadId,
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
    onParticipantRoleChange,
    onParticipantSideChange,
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

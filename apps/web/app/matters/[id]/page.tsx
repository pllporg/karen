'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '../../../components/app-shell';
import { PageHeader } from '../../../components/page-header';
import { apiFetch, getSessionToken } from '../../../lib/api';

type DeadlinePreviewRow = {
  ruleId: string;
  name: string;
  eventType: string;
  computedDate: string;
};

type ParticipantContactOption = {
  id: string;
  displayName: string;
  kind: 'PERSON' | 'ORGANIZATION';
};

type ParticipantRoleOption = {
  id: string;
  key: string;
  label: string;
  sideDefault: 'CLIENT_SIDE' | 'OPPOSING_SIDE' | 'NEUTRAL' | 'COURT' | null;
};

type CommunicationThread = {
  id: string;
  subject?: string | null;
  messages?: Array<{
    id: string;
    type: 'EMAIL' | 'SMS' | 'CALL_LOG' | 'PORTAL_MESSAGE' | 'INTERNAL_NOTE';
    direction: 'INBOUND' | 'OUTBOUND' | 'INTERNAL';
    subject?: string | null;
    body: string;
    occurredAt: string;
    participants?: Array<{
      id: string;
      role: 'FROM' | 'TO' | 'CC' | 'BCC' | 'OTHER';
      contact?: {
        id: string;
        displayName: string;
      } | null;
      contactId?: string | null;
    }>;
  }>;
};

const TASK_STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELED'] as const;
const TASK_PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
const COMMUNICATION_TYPE_OPTIONS = ['EMAIL', 'SMS', 'CALL_LOG', 'PORTAL_MESSAGE', 'INTERNAL_NOTE'] as const;
const COMMUNICATION_DIRECTION_OPTIONS = ['INBOUND', 'OUTBOUND', 'INTERNAL'] as const;
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

function toDateTimeLocalValue(value?: string | null) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 16);
}

export default function MatterDashboardPage() {
  const params = useParams() as { id: string };
  const matterId = params.id;
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

  async function refreshDashboard() {
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
  }

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
        }
      })
      .catch(() => undefined);
  }, [matterId]);

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

  async function addParticipant() {
    if (!matterId || !selectedParticipantContactId || !selectedParticipantRoleKey) {
      setParticipantStatusMessage('Contact and participant role are required.');
      return;
    }

    await apiFetch(`/matters/${matterId}/participants`, {
      method: 'POST',
      body: JSON.stringify({
        contactId: selectedParticipantContactId,
        participantRoleKey: selectedParticipantRoleKey,
      }),
    });

    setParticipantStatusMessage('Participant added.');
    await refreshDashboard();
  }

  async function removeParticipant(participantId: string) {
    if (!matterId) {
      return;
    }

    await apiFetch(`/matters/${matterId}/participants/${participantId}`, {
      method: 'DELETE',
    });

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
    participantContactId: string;
  }) {
    setEditingCommunicationId(row.id);
    setSelectedCommunicationThreadId(row.threadId);
    setCommunicationType(row.type);
    setCommunicationDirection(row.direction);
    setCommunicationSubject(row.subject);
    setCommunicationBody(row.body);
    setCommunicationParticipantContactId(row.participantContactId);
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

  return (
    <AppShell>
      <PageHeader
        title={dashboard ? `${dashboard.matterNumber} - ${dashboard.name}` : 'Matter Dashboard'}
        subtitle="Overview, participants, timeline, tasks, calendar, communications, documents, billing, and AI workspace"
      />

      {!dashboard ? <div className="card">Loading...</div> : null}

      {dashboard ? (
        <div className="card-grid">
          <div className="card">
            <h3 style={{ marginTop: 0 }}>Overview</h3>
            <p>Practice Area: {dashboard.practiceArea}</p>
            <p>Status: {dashboard.status}</p>
            <p>Venue: {dashboard.venue || '-'}</p>
            <p>Jurisdiction: {dashboard.jurisdiction || '-'}</p>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Domain Section Completeness</h3>
            <p>
              {dashboard.domainSectionCompleteness?.completedCount || 0}/
              {dashboard.domainSectionCompleteness?.totalCount || 0} sections complete
              {' '}({dashboard.domainSectionCompleteness?.completionPercent || 0}%)
            </p>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {Object.entries(dashboard.domainSectionCompleteness?.sections || {}).map(([section, done]) => (
                <li key={section}>
                  {section}: {done ? 'Complete' : 'Missing'}
                </li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Participants</h3>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr auto' }}>
              <select
                className="select"
                aria-label="Participant Contact"
                value={selectedParticipantContactId}
                onChange={(event) => setSelectedParticipantContactId(event.target.value)}
              >
                <option value="">Select contact</option>
                {participantContacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.displayName}
                  </option>
                ))}
              </select>
              <select
                className="select"
                aria-label="Participant Role"
                value={selectedParticipantRoleKey}
                onChange={(event) => setSelectedParticipantRoleKey(event.target.value)}
              >
                <option value="">Select role</option>
                {participantRoleOptions.map((role) => (
                  <option key={role.id} value={role.key}>
                    {role.label}
                  </option>
                ))}
              </select>
              <button className="button" type="button" onClick={addParticipant}>
                Add Participant
              </button>
            </div>
            {participantStatusMessage ? (
              <p style={{ marginTop: 8, color: 'var(--lic-text-muted)' }}>{participantStatusMessage}</p>
            ) : null}
            <table className="table" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>Contact</th>
                  <th>Role</th>
                  <th>Side</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {(dashboard.participants || []).map((participant: any) => (
                  <tr key={participant.id}>
                    <td>{participant.contact?.displayName || participant.contactId}</td>
                    <td>{participant.participantRoleDefinition?.label || participant.participantRoleKey}</td>
                    <td>{participant.side || 'N/A'}</td>
                    <td>
                      <button
                        type="button"
                        className="button danger"
                        aria-label={`Remove Participant ${participant.id}`}
                        onClick={() => removeParticipant(participant.id)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Timeline & Docket</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {dashboard.docketEntries?.map((entry: any) => (
                <li key={entry.id}>{new Date(entry.filedAt).toLocaleDateString()} - {entry.description}</li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Tasks</h3>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 180px 140px auto' }}>
              <input
                className="input"
                aria-label="Task Title"
                placeholder="Task title"
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
              />
              <input
                className="input"
                aria-label="Task Due At"
                type="datetime-local"
                value={taskDueAt}
                onChange={(event) => setTaskDueAt(event.target.value)}
              />
              <select
                className="select"
                aria-label="Task Priority"
                value={taskPriority}
                onChange={(event) => setTaskPriority(event.target.value as (typeof TASK_PRIORITY_OPTIONS)[number])}
              >
                {TASK_PRIORITY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <button className="button" type="button" onClick={createOrUpdateTask}>
                {editingTaskId ? 'Save Task Edit' : 'Add Task'}
              </button>
            </div>
            {editingTaskId ? (
              <div style={{ marginTop: 8 }}>
                <button className="button secondary" type="button" onClick={cancelEditingTask}>
                  Cancel Task Edit
                </button>
              </div>
            ) : null}
            {taskStatusMessage ? <p style={{ marginTop: 8, color: 'var(--lic-text-muted)' }}>{taskStatusMessage}</p> : null}
            <table className="table" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Due</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(dashboard.tasks || []).map((task: any) => (
                  <tr key={task.id}>
                    <td>{task.title}</td>
                    <td>
                      <select
                        className="select"
                        aria-label={`Task Status ${task.id}`}
                        value={task.status}
                        onChange={(event) => updateTaskStatus(task.id, event.target.value)}
                      >
                        {TASK_STATUS_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{task.dueAt ? new Date(task.dueAt).toLocaleString() : '-'}</td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="button secondary"
                        type="button"
                        aria-label={`Edit Task ${task.id}`}
                        onClick={() =>
                          startEditingTask({
                            id: task.id,
                            title: task.title,
                            dueAt: task.dueAt,
                            priority: task.priority,
                          })
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="button secondary"
                        type="button"
                        aria-label={`Delete Task ${task.id}`}
                        onClick={() => deleteTask(task.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Calendar</h3>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 180px 180px 1fr auto' }}>
              <input
                className="input"
                aria-label="Calendar Event Type"
                placeholder="Event type"
                value={eventType}
                onChange={(event) => setEventType(event.target.value)}
              />
              <input
                className="input"
                aria-label="Calendar Event Start"
                type="datetime-local"
                value={eventStartAt}
                onChange={(event) => setEventStartAt(event.target.value)}
              />
              <input
                className="input"
                aria-label="Calendar Event End"
                type="datetime-local"
                value={eventEndAt}
                onChange={(event) => setEventEndAt(event.target.value)}
              />
              <input
                className="input"
                aria-label="Calendar Event Location"
                placeholder="Location (optional)"
                value={eventLocation}
                onChange={(event) => setEventLocation(event.target.value)}
              />
              <button className="button" type="button" onClick={createOrUpdateCalendarEvent}>
                {editingCalendarEventId ? 'Save Event Edit' : 'Add Event'}
              </button>
            </div>
            {editingCalendarEventId ? (
              <div style={{ marginTop: 8 }}>
                <button className="button secondary" type="button" onClick={cancelEditingCalendarEvent}>
                  Cancel Event Edit
                </button>
              </div>
            ) : null}
            {calendarStatusMessage ? (
              <p style={{ marginTop: 8, color: 'var(--lic-text-muted)' }}>{calendarStatusMessage}</p>
            ) : null}
            <table className="table" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Location</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(dashboard.calendarEvents || []).map((event: any) => (
                  <tr key={event.id}>
                    <td>{event.type}</td>
                    <td>{new Date(event.startAt).toLocaleString()}</td>
                    <td>{event.endAt ? new Date(event.endAt).toLocaleString() : '-'}</td>
                    <td>{event.location || '-'}</td>
                    <td style={{ display: 'flex', gap: 8 }}>
                      <button
                        className="button secondary"
                        type="button"
                        aria-label={`Edit Calendar Event ${event.id}`}
                        onClick={() =>
                          startEditingCalendarEvent({
                            id: event.id,
                            type: event.type,
                            startAt: event.startAt,
                            endAt: event.endAt,
                            location: event.location,
                          })
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="button secondary"
                        type="button"
                        aria-label={`Delete Calendar Event ${event.id}`}
                        onClick={() => deleteCalendarEvent(event.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {(dashboard.calendarEvents || []).length === 0 ? (
                  <tr>
                    <td colSpan={5}>No calendar events for this matter yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="card" style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ marginTop: 0 }}>Jurisdictional Deadline Rules Pack</h3>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 180px auto auto' }}>
              <select
                className="select"
                aria-label="Rules Pack"
                value={selectedRulesPackId}
                onChange={(event) => setSelectedRulesPackId(event.target.value)}
              >
                <option value="">Select rules pack</option>
                {rulesPacks.map((pack) => (
                  <option key={pack.id} value={pack.id}>
                    {pack.name} {pack.pack?.version ? `(v${pack.pack.version})` : ''}
                  </option>
                ))}
              </select>
              <input
                aria-label="Trigger Date"
                className="input"
                type="date"
                value={triggerDate}
                onChange={(event) => setTriggerDate(event.target.value)}
              />
              <button className="button secondary" type="button" onClick={previewDeadlines}>
                Preview Deadlines
              </button>
              <button className="button" type="button" onClick={applyDeadlines}>
                Apply Selected
              </button>
            </div>
            {deadlineStatus ? <p style={{ marginTop: 8, color: 'var(--lic-text-muted)' }}>{deadlineStatus}</p> : null}
            {previewRows.length > 0 ? (
              <table className="table" style={{ marginTop: 10 }}>
                <thead>
                  <tr>
                    <th>Rule</th>
                    <th>Computed Date</th>
                    <th>Override Date</th>
                    <th>Override Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={row.ruleId}>
                      <td>{row.name}</td>
                      <td>{new Date(row.computedDate).toLocaleDateString()}</td>
                      <td>
                        <input
                          className="input"
                          type="date"
                          aria-label={`Override Date ${row.ruleId}`}
                          value={overrideDates[row.ruleId] || ''}
                          onChange={(event) =>
                            setOverrideDates((current) => ({
                              ...current,
                              [row.ruleId]: event.target.value,
                            }))
                          }
                        />
                      </td>
                      <td>
                        <input
                          className="input"
                          aria-label={`Override Reason ${row.ruleId}`}
                          placeholder="Required if override date is set"
                          value={overrideReasons[row.ruleId] || ''}
                          onChange={(event) =>
                            setOverrideReasons((current) => ({
                              ...current,
                              [row.ruleId]: event.target.value,
                            }))
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p style={{ marginTop: 10 }}>Preview rules to review computed deadlines before creating events.</p>
            )}
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Communications</h3>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr 1fr auto' }}>
              <select
                className="select"
                aria-label="Communication Thread"
                value={selectedCommunicationThreadId}
                onChange={(event) => setSelectedCommunicationThreadId(event.target.value)}
              >
                <option value="__new__">Create new thread</option>
                {(dashboard.communicationThreads || []).map((thread: CommunicationThread) => (
                  <option key={thread.id} value={thread.id}>
                    {thread.subject || thread.id}
                  </option>
                ))}
              </select>
              <select
                className="select"
                aria-label="Communication Type"
                value={communicationType}
                onChange={(event) => setCommunicationType(event.target.value as (typeof COMMUNICATION_TYPE_OPTIONS)[number])}
              >
                {COMMUNICATION_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                className="select"
                aria-label="Communication Direction"
                value={communicationDirection}
                onChange={(event) => setCommunicationDirection(event.target.value as (typeof COMMUNICATION_DIRECTION_OPTIONS)[number])}
              >
                {COMMUNICATION_DIRECTION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <select
                className="select"
                aria-label="Communication Contact"
                value={communicationParticipantContactId}
                onChange={(event) => setCommunicationParticipantContactId(event.target.value)}
              >
                <option value="">No contact participant</option>
                {participantContacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.displayName}
                  </option>
                ))}
              </select>
              <button className="button" type="button" onClick={logCommunicationEntry}>
                {editingCommunicationId ? 'Save Communication Edit' : 'Log Communication'}
              </button>
            </div>
            {editingCommunicationId ? (
              <div style={{ marginTop: 8 }}>
                <button className="button secondary" type="button" onClick={cancelEditingCommunication}>
                  Cancel Communication Edit
                </button>
              </div>
            ) : null}
            {selectedCommunicationThreadId === '__new__' ? (
              <input
                className="input"
                style={{ marginTop: 8 }}
                aria-label="Communication Thread Subject"
                placeholder="Thread subject"
                value={newCommunicationThreadSubject}
                onChange={(event) => setNewCommunicationThreadSubject(event.target.value)}
              />
            ) : null}
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '220px 1fr', marginTop: 8 }}>
              <input
                className="input"
                aria-label="Communication Occurred At"
                type="datetime-local"
                value={communicationOccurredAt}
                onChange={(event) => setCommunicationOccurredAt(event.target.value)}
              />
              <input
                className="input"
                aria-label="Communication Subject"
                placeholder="Subject (optional)"
                value={communicationSubject}
                onChange={(event) => setCommunicationSubject(event.target.value)}
              />
            </div>
            <textarea
              className="textarea"
              style={{ marginTop: 8 }}
              aria-label="Communication Body"
              rows={3}
              placeholder="Log details"
              value={communicationBody}
              onChange={(event) => setCommunicationBody(event.target.value)}
            />
            {communicationStatusMessage ? (
              <p style={{ marginTop: 8, color: 'var(--lic-text-muted)' }}>{communicationStatusMessage}</p>
            ) : null}
            <table className="table" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>Occurred</th>
                  <th>Thread</th>
                  <th>Type</th>
                  <th>Direction</th>
                  <th>Participant</th>
                  <th>Summary</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {communicationRows.map((message: any) => (
                  <tr key={message.id}>
                    <td>{new Date(message.occurredAt).toLocaleString()}</td>
                    <td>{message.threadSubject}</td>
                    <td>{message.type}</td>
                    <td>{message.direction}</td>
                    <td>{message.participantContactName || '-'}</td>
                    <td>{message.subject || String(message.body || '').slice(0, 90)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          type="button"
                          className="button secondary"
                          aria-label={`Edit Communication ${message.id}`}
                          onClick={() =>
                            startEditingCommunication({
                              id: message.id,
                              threadId: message.threadId,
                              type: message.type,
                              direction: message.direction,
                              subject: message.subject || '',
                              body: message.body || '',
                              occurredAt: message.occurredAt,
                              participantContactId: message.participantContactId || '',
                            })
                          }
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="button danger"
                          aria-label={`Delete Communication ${message.id}`}
                          onClick={() => deleteCommunicationEntry(message.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {communicationRows.length === 0 ? (
                  <tr>
                    <td colSpan={7}>No communications logged for this matter yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Documents</h3>
            <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr auto' }}>
              <input
                className="input"
                aria-label="Matter Document Title"
                placeholder="Document title"
                value={documentTitle}
                onChange={(event) => setDocumentTitle(event.target.value)}
              />
              <input
                className="input"
                aria-label="Matter Document File"
                type="file"
                onChange={(event) => setDocumentFile(event.target.files?.[0] || null)}
              />
              <button className="button" type="button" onClick={uploadMatterDocument}>
                Upload Document
              </button>
            </div>
            {documentStatusMessage ? (
              <p style={{ marginTop: 8, color: 'var(--lic-text-muted)' }}>{documentStatusMessage}</p>
            ) : null}
            <table className="table" style={{ marginTop: 10 }}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Versions</th>
                  <th>Shared</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {(dashboard.documents || []).map((doc: any) => (
                  <tr key={doc.id}>
                    <td>{doc.title}</td>
                    <td>{doc.versions?.length || 0}</td>
                    <td>{doc.sharedWithClient ? 'Yes' : 'No'}</td>
                    <td>
                      <div style={{ display: 'grid', gap: 8 }}>
                        <input
                          className="input"
                          aria-label={`Document Version File ${doc.id}`}
                          type="file"
                          onChange={(event) =>
                            setDocumentVersionFiles((current) => ({
                              ...current,
                              [doc.id]: event.target.files?.[0] || null,
                            }))
                          }
                        />
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <button
                            className="button secondary"
                            type="button"
                            aria-label={`Upload Document Version ${doc.id}`}
                            onClick={() => uploadMatterDocumentVersion(doc.id)}
                          >
                            Upload Version
                          </button>
                          <button
                            className="button secondary"
                            type="button"
                            aria-label={`Toggle Document Sharing ${doc.id}`}
                            onClick={() => toggleMatterDocumentSharing(doc.id, Boolean(doc.sharedWithClient))}
                          >
                            {doc.sharedWithClient ? 'Disable Sharing' : 'Enable Sharing'}
                          </button>
                          <button
                            className="button secondary"
                            type="button"
                            aria-label={`Create Document Share Link ${doc.id}`}
                            onClick={() => createMatterDocumentShareLink(doc.id)}
                          >
                            Create Share Link
                          </button>
                          <button
                            className="button secondary"
                            type="button"
                            aria-label={`Issue Document Download URL ${doc.id}`}
                            onClick={() => issueLatestDocumentDownload(doc.id, doc.versions?.[0]?.id || null)}
                          >
                            Download Latest
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
                {(dashboard.documents || []).length === 0 ? (
                  <tr>
                    <td colSpan={4}>No documents for this matter yet.</td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>Billing</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {dashboard.invoices?.map((invoice: any) => (
                <li key={invoice.id}>{invoice.invoiceNumber} - {invoice.status} - ${invoice.balanceDue}</li>
              ))}
            </ul>
          </div>

          <div className="card">
            <h3 style={{ marginTop: 0 }}>AI Workspace</h3>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {dashboard.aiJobs?.map((job: any) => (
                <li key={job.id}>{job.toolName} - {job.status}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

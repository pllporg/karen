import { Dispatch, SetStateAction } from 'react';
import {
  COMMUNICATION_DIRECTION_OPTIONS,
  COMMUNICATION_TYPE_OPTIONS,
  CommunicationThread,
  ParticipantContactOption,
} from './types';

type CommunicationRow = {
  id: string;
  occurredAt: string;
  threadId: string;
  threadSubject: string;
  type: (typeof COMMUNICATION_TYPE_OPTIONS)[number];
  direction: (typeof COMMUNICATION_DIRECTION_OPTIONS)[number];
  participantContactId?: string;
  participantContactName?: string;
  subject: string;
  body: string;
};

type CommunicationsPanelProps = {
  dashboard: any;
  participantContacts: ParticipantContactOption[];
  selectedCommunicationThreadId: string;
  setSelectedCommunicationThreadId: Dispatch<SetStateAction<string>>;
  newCommunicationThreadSubject: string;
  setNewCommunicationThreadSubject: Dispatch<SetStateAction<string>>;
  communicationType: (typeof COMMUNICATION_TYPE_OPTIONS)[number];
  setCommunicationType: Dispatch<SetStateAction<(typeof COMMUNICATION_TYPE_OPTIONS)[number]>>;
  communicationDirection: (typeof COMMUNICATION_DIRECTION_OPTIONS)[number];
  setCommunicationDirection: Dispatch<SetStateAction<(typeof COMMUNICATION_DIRECTION_OPTIONS)[number]>>;
  communicationSubject: string;
  setCommunicationSubject: Dispatch<SetStateAction<string>>;
  communicationBody: string;
  setCommunicationBody: Dispatch<SetStateAction<string>>;
  communicationParticipantContactId: string;
  setCommunicationParticipantContactId: Dispatch<SetStateAction<string>>;
  communicationOccurredAt: string;
  setCommunicationOccurredAt: Dispatch<SetStateAction<string>>;
  communicationStatusMessage: string | null;
  editingCommunicationId: string | null;
  communicationRows: CommunicationRow[];
  logCommunicationEntry: () => Promise<void>;
  cancelEditingCommunication: () => void;
  deleteCommunicationEntry: (messageId: string) => Promise<void>;
  startEditingCommunication: (row: {
    id: string;
    threadId: string;
    type: (typeof COMMUNICATION_TYPE_OPTIONS)[number];
    direction: (typeof COMMUNICATION_DIRECTION_OPTIONS)[number];
    subject: string;
    body: string;
    occurredAt: string;
    participantContactId?: string;
  }) => void;
};

export function CommunicationsPanel({
  dashboard,
  participantContacts,
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
  logCommunicationEntry,
  cancelEditingCommunication,
  deleteCommunicationEntry,
  startEditingCommunication,
}: CommunicationsPanelProps) {
  return (
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
          onChange={(event) =>
            setCommunicationDirection(event.target.value as (typeof COMMUNICATION_DIRECTION_OPTIONS)[number])
          }
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
          {communicationRows.map((message) => (
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
  );
}

import type { FormEventHandler } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Button } from '../../../components/ui/button';
import { FormField } from '../../../components/ui/form-field';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import type { MatterCommunicationFormData } from '../../../lib/schemas/matter-dashboard';
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
  register: UseFormRegister<MatterCommunicationFormData>;
  errors: FieldErrors<MatterCommunicationFormData>;
  isSubmitting: boolean;
  selectedCommunicationThreadId: string;
  communicationStatusMessage: string | null;
  editingCommunicationId: string | null;
  communicationRows: CommunicationRow[];
  logCommunicationEntry: FormEventHandler<HTMLFormElement>;
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
  register,
  errors,
  isSubmitting,
  selectedCommunicationThreadId,
  communicationStatusMessage,
  editingCommunicationId,
  communicationRows,
  logCommunicationEntry,
  cancelEditingCommunication,
  deleteCommunicationEntry,
  startEditingCommunication,
}: CommunicationsPanelProps) {
  const threadRegistration = register('threadId');
  const threadSubjectRegistration = register('threadSubject');
  const typeRegistration = register('type');
  const directionRegistration = register('direction');
  const participantContactRegistration = register('participantContactId');
  const occurredAtRegistration = register('occurredAt');
  const subjectRegistration = register('subject');
  const bodyRegistration = register('body');

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Communications</h3>
      <form onSubmit={logCommunicationEntry}>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 1fr 1fr auto' }}>
          <FormField label="Communication Thread" name="communication-thread" error={errors.threadId?.message} required>
            <Select
              aria-label="Communication Thread"
              {...threadRegistration}
              value={selectedCommunicationThreadId}
              invalid={!!errors.threadId}
            >
              <option value="__new__">Create new thread</option>
              {(dashboard.communicationThreads || []).map((thread: CommunicationThread) => (
                <option key={thread.id} value={thread.id}>
                  {thread.subject || thread.id}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Communication Type" name="communication-type" error={errors.type?.message} required>
            <Select aria-label="Communication Type" {...typeRegistration} invalid={!!errors.type}>
              {COMMUNICATION_TYPE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Communication Direction" name="communication-direction" error={errors.direction?.message} required>
            <Select aria-label="Communication Direction" {...directionRegistration} invalid={!!errors.direction}>
              {COMMUNICATION_DIRECTION_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Communication Contact" name="communication-contact" error={errors.participantContactId?.message}>
            <Select aria-label="Communication Contact" {...participantContactRegistration} invalid={!!errors.participantContactId}>
              <option value="">No contact participant</option>
              {participantContacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.displayName}
                </option>
              ))}
            </Select>
          </FormField>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Working...' : editingCommunicationId ? 'Save Communication Edit' : 'Log Communication'}
          </Button>
        </div>
      {editingCommunicationId ? (
        <div style={{ marginTop: 8 }}>
          <Button tone="secondary" type="button" onClick={cancelEditingCommunication}>
            Cancel Communication Edit
          </Button>
        </div>
      ) : null}
      {selectedCommunicationThreadId === '__new__' ? (
        <FormField
          label="Communication Thread Subject"
          name="communication-thread-subject"
          error={errors.threadSubject?.message}
        >
          <Input
            style={{ marginTop: 8 }}
            aria-label="Communication Thread Subject"
            placeholder="Thread subject"
            {...threadSubjectRegistration}
            invalid={!!errors.threadSubject}
          />
        </FormField>
      ) : null}
      <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '220px 1fr', marginTop: 8 }}>
        <FormField label="Communication Occurred At" name="communication-occurred-at" error={errors.occurredAt?.message}>
          <Input
            aria-label="Communication Occurred At"
            type="datetime-local"
            {...occurredAtRegistration}
            invalid={!!errors.occurredAt}
          />
        </FormField>
        <FormField label="Communication Subject" name="communication-subject" error={errors.subject?.message}>
          <Input
            aria-label="Communication Subject"
            placeholder="Subject (optional)"
            {...subjectRegistration}
            invalid={!!errors.subject}
          />
        </FormField>
      </div>
      <FormField label="Communication Body" name="communication-body" error={errors.body?.message} required>
        <textarea
          className="textarea"
          style={{ marginTop: 8 }}
          aria-label="Communication Body"
          rows={3}
          placeholder="Log details"
          {...bodyRegistration}
        />
      </FormField>
      </form>
      {communicationStatusMessage ? (
        <p style={{ marginTop: 8, color: 'var(--lic-text-muted)' }}>{communicationStatusMessage}</p>
      ) : null}
      <table aria-label="Data table" className="table" style={{ marginTop: 10 }}>
        <thead>
          <tr>
            <th scope="col">Occurred</th>
            <th scope="col">Thread</th>
            <th scope="col">Type</th>
            <th scope="col">Direction</th>
            <th scope="col">Participant</th>
            <th scope="col">Summary</th>
            <th scope="col">Action</th>
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
                  <Button
                    type="button"
                    tone="secondary"
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
                  </Button>
                  <Button
                    type="button"
                    tone="danger"
                    aria-label={`Delete Communication ${message.id}`}
                    onClick={() => deleteCommunicationEntry(message.id)}
                  >
                    Delete
                  </Button>
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

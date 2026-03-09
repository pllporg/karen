import type { ChangeEvent, FormEventHandler } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Button } from '../../../components/ui/button';
import { FormField } from '../../../components/ui/form-field';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import type { MatterParticipantFormData } from '../../../lib/schemas/matter-dashboard';
import { PARTICIPANT_SIDE_OPTIONS, ParticipantContactOption, ParticipantRoleOption, ParticipantSideOption } from './types';

type ParticipantsPanelProps = {
  dashboard: any;
  participantContacts: ParticipantContactOption[];
  participantRoleOptions: ParticipantRoleOption[];
  register: UseFormRegister<MatterParticipantFormData>;
  errors: FieldErrors<MatterParticipantFormData>;
  isSubmitting: boolean;
  selectedParticipantContactId: string;
  selectedParticipantRoleKey: string;
  participantSide: ParticipantSideOption;
  participantIsPrimary: boolean;
  participantRepresentedByContactId: string;
  participantLawFirmContactId: string;
  participantNotes: string;
  participantRoleIsCounsel: boolean;
  participantStatusMessage: string | null;
  editingParticipantId: string | null;
  createOrUpdateParticipant: FormEventHandler<HTMLFormElement>;
  cancelEditingParticipant: () => void;
  onParticipantRoleChange: (value: string) => void;
  onParticipantSideChange: (value: ParticipantSideOption) => void;
  startEditingParticipant: (participant: {
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
  }) => void;
  removeParticipant: (participantId: string) => Promise<void>;
};

export function ParticipantsPanel({
  dashboard,
  participantContacts,
  participantRoleOptions,
  register,
  errors,
  isSubmitting,
  selectedParticipantContactId,
  selectedParticipantRoleKey,
  participantSide,
  participantIsPrimary,
  participantRepresentedByContactId,
  participantLawFirmContactId,
  participantNotes,
  participantRoleIsCounsel,
  participantStatusMessage,
  editingParticipantId,
  createOrUpdateParticipant,
  cancelEditingParticipant,
  onParticipantRoleChange,
  onParticipantSideChange,
  startEditingParticipant,
  removeParticipant,
}: ParticipantsPanelProps) {
  const participantContactRegistration = register('contactId');
  const participantRoleRegistration = register('participantRoleKey');
  const participantSideRegistration = register('side');
  const participantPrimaryRegistration = register('isPrimary');
  const participantRepresentedByRegistration = register('representedByContactId');
  const participantLawFirmRegistration = register('lawFirmContactId');
  const participantNotesRegistration = register('notes');

  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Participants</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        <form
          style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}
          onSubmit={createOrUpdateParticipant}
        >
          <FormField label="Participant Contact" name="participant-contact" error={errors.contactId?.message} required>
            <Select
              aria-label="Participant Contact"
              {...participantContactRegistration}
              value={selectedParticipantContactId}
              invalid={!!errors.contactId}
            >
              <option value="">Select contact</option>
              {participantContacts.map((contact) => (
                <option key={contact.id} value={contact.id}>
                  {contact.displayName}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Participant Role" name="participant-role" error={errors.participantRoleKey?.message} required>
            <Select
              aria-label="Participant Role"
              {...participantRoleRegistration}
              value={selectedParticipantRoleKey}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                participantRoleRegistration.onChange(event);
                onParticipantRoleChange(event.target.value);
              }}
              invalid={!!errors.participantRoleKey}
            >
              <option value="">Select role</option>
              {participantRoleOptions.map((role) => (
                <option key={role.id} value={role.key}>
                  {role.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Participant Side" name="participant-side" error={errors.side?.message} required>
            <Select
              aria-label="Participant Side"
              {...participantSideRegistration}
              value={participantSide}
              onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                participantSideRegistration.onChange(event);
                onParticipantSideChange(event.target.value as ParticipantSideOption);
              }}
              invalid={!!errors.side}
            >
              {PARTICIPANT_SIDE_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="stack-1">
            <label htmlFor="participant-is-primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <input
                id="participant-is-primary"
                type="checkbox"
                aria-label="Participant Is Primary"
                {...participantPrimaryRegistration}
                checked={participantIsPrimary}
              />
              Primary participant
            </label>
          </div>
          <FormField
            label="Participant Represented By Contact"
            name="participant-represented-by"
            error={errors.representedByContactId?.message}
          >
            <Select
              aria-label="Participant Represented By Contact"
              {...participantRepresentedByRegistration}
              value={participantRepresentedByContactId}
              disabled={participantRoleIsCounsel}
              invalid={!!errors.representedByContactId}
            >
              <option value="">
                {participantRoleIsCounsel ? 'Represented-by disabled for counsel roles' : 'No represented-by contact'}
              </option>
              {participantContacts
                .filter((contact) => contact.id !== selectedParticipantContactId)
                .map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.displayName}
                  </option>
                ))}
            </Select>
          </FormField>
          <FormField
            label="Participant Law Firm Contact"
            name="participant-law-firm"
            error={errors.lawFirmContactId?.message}
          >
            <Select
              aria-label="Participant Law Firm Contact"
              {...participantLawFirmRegistration}
              value={participantLawFirmContactId}
              disabled={!participantRoleIsCounsel}
              invalid={!!errors.lawFirmContactId}
            >
              <option value="">
                {participantRoleIsCounsel ? 'No law firm contact' : 'Law-firm mapping only for counsel roles'}
              </option>
              {participantContacts
                .filter((contact) => contact.id !== selectedParticipantContactId)
                .map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.displayName}
                  </option>
                ))}
            </Select>
          </FormField>
          <FormField label="Participant Notes" name="participant-notes" error={errors.notes?.message}>
            <Input
              aria-label="Participant Notes"
              placeholder="Participant notes"
              {...participantNotesRegistration}
              value={participantNotes}
              invalid={!!errors.notes}
            />
          </FormField>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Working...' : editingParticipantId ? 'Save Participant Edit' : 'Add Participant'}
            </Button>
            {editingParticipantId ? (
              <Button tone="secondary" type="button" onClick={cancelEditingParticipant}>
                Cancel Participant Edit
              </Button>
            ) : null}
          </div>
        </form>
      </div>
      {participantStatusMessage ? (
        <p style={{ marginTop: 8, color: 'var(--lic-text-muted)' }}>{participantStatusMessage}</p>
      ) : null}
      <table aria-label="Data table" className="table" style={{ marginTop: 10 }}>
        <thead>
          <tr>
            <th scope="col">Contact</th>
            <th scope="col">Role</th>
            <th scope="col">Side</th>
            <th scope="col">Primary</th>
            <th scope="col">Represented By</th>
            <th scope="col">Law Firm</th>
            <th scope="col">Notes</th>
            <th scope="col">Action</th>
          </tr>
        </thead>
        <tbody>
          {(dashboard.participants || []).map((participant: any) => (
            <tr key={participant.id}>
              <td>{participant.contact?.displayName || participant.contactId}</td>
              <td>{participant.participantRoleDefinition?.label || participant.participantRoleKey}</td>
              <td>{participant.side || 'N/A'}</td>
              <td>{participant.isPrimary ? 'YES' : 'NO'}</td>
              <td>{participant.representedByContact?.displayName || participant.representedByContactId || '-'}</td>
              <td>{participant.lawFirmContact?.displayName || participant.lawFirmContactId || '-'}</td>
              <td>{participant.notes || '-'}</td>
              <td>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Button
                    type="button"
                    tone="secondary"
                    aria-label={`Edit Participant ${participant.id}`}
                    onClick={() => startEditingParticipant(participant)}
                  >
                    Edit
                  </Button>
                  <Button
                    type="button"
                    tone="danger"
                    aria-label={`Remove Participant ${participant.id}`}
                    onClick={() => removeParticipant(participant.id)}
                  >
                    Remove
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

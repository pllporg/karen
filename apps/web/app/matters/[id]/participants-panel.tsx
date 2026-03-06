import { Dispatch, SetStateAction } from 'react';
import { PARTICIPANT_SIDE_OPTIONS, ParticipantContactOption, ParticipantRoleOption, ParticipantSideOption } from './types';

type ParticipantsPanelProps = {
  dashboard: any;
  participantContacts: ParticipantContactOption[];
  participantRoleOptions: ParticipantRoleOption[];
  selectedParticipantContactId: string;
  setSelectedParticipantContactId: Dispatch<SetStateAction<string>>;
  selectedParticipantRoleKey: string;
  setSelectedParticipantRoleKey: Dispatch<SetStateAction<string>>;
  participantSide: ParticipantSideOption;
  setParticipantSide: Dispatch<SetStateAction<ParticipantSideOption>>;
  participantIsPrimary: boolean;
  setParticipantIsPrimary: Dispatch<SetStateAction<boolean>>;
  participantRepresentedByContactId: string;
  setParticipantRepresentedByContactId: Dispatch<SetStateAction<string>>;
  participantLawFirmContactId: string;
  setParticipantLawFirmContactId: Dispatch<SetStateAction<string>>;
  participantNotes: string;
  setParticipantNotes: Dispatch<SetStateAction<string>>;
  participantRoleIsCounsel: boolean;
  participantStatusMessage: string | null;
  editingParticipantId: string | null;
  createOrUpdateParticipant: () => Promise<void>;
  cancelEditingParticipant: () => void;
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
  participantRoleIsCounsel,
  participantStatusMessage,
  editingParticipantId,
  createOrUpdateParticipant,
  cancelEditingParticipant,
  startEditingParticipant,
  removeParticipant,
}: ParticipantsPanelProps) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Participants</h3>
      <div style={{ display: 'grid', gap: 8 }}>
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
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
            onChange={(event) => {
              const nextRoleKey = event.target.value;
              setSelectedParticipantRoleKey(nextRoleKey);
              const role = participantRoleOptions.find((option) => option.key === nextRoleKey);
              if (role?.sideDefault) {
                setParticipantSide(role.sideDefault as ParticipantSideOption);
              }
            }}
          >
            <option value="">Select role</option>
            {participantRoleOptions.map((role) => (
              <option key={role.id} value={role.key}>
                {role.label}
              </option>
            ))}
          </select>
          <select
            className="select"
            aria-label="Participant Side"
            value={participantSide}
            onChange={(event) => setParticipantSide(event.target.value as ParticipantSideOption)}
          >
            {PARTICIPANT_SIDE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input
              type="checkbox"
              aria-label="Participant Is Primary"
              checked={participantIsPrimary}
              onChange={(event) => setParticipantIsPrimary(event.target.checked)}
            />
            Primary participant
          </label>
          <select
            className="select"
            aria-label="Participant Represented By Contact"
            value={participantRepresentedByContactId}
            onChange={(event) => setParticipantRepresentedByContactId(event.target.value)}
            disabled={participantRoleIsCounsel}
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
          </select>
          <select
            className="select"
            aria-label="Participant Law Firm Contact"
            value={participantLawFirmContactId}
            onChange={(event) => setParticipantLawFirmContactId(event.target.value)}
            disabled={!participantRoleIsCounsel}
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
          </select>
          <input
            className="input"
            aria-label="Participant Notes"
            value={participantNotes}
            onChange={(event) => setParticipantNotes(event.target.value)}
            placeholder="Participant notes"
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="button" type="button" onClick={createOrUpdateParticipant}>
              {editingParticipantId ? 'Save Participant Edit' : 'Add Participant'}
            </button>
            {editingParticipantId ? (
              <button className="button secondary" type="button" onClick={cancelEditingParticipant}>
                Cancel Participant Edit
              </button>
            ) : null}
          </div>
        </div>
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
            <th>Primary</th>
            <th>Represented By</th>
            <th>Law Firm</th>
            <th>Notes</th>
            <th>Action</th>
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
                  <button
                    type="button"
                    className="button secondary"
                    aria-label={`Edit Participant ${participant.id}`}
                    onClick={() => startEditingParticipant(participant)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="button danger"
                    aria-label={`Remove Participant ${participant.id}`}
                    onClick={() => removeParticipant(participant.id)}
                  >
                    Remove
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

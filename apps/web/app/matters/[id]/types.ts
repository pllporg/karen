export type DeadlinePreviewRow = {
  ruleId: string;
  name: string;
  eventType: string;
  computedDate: string;
};

export type ParticipantContactOption = {
  id: string;
  displayName: string;
  kind: 'PERSON' | 'ORGANIZATION';
};

export type ParticipantRoleOption = {
  id: string;
  key: string;
  label: string;
  sideDefault: 'CLIENT_SIDE' | 'OPPOSING_SIDE' | 'NEUTRAL' | 'COURT' | null;
};

export type ParticipantSideOption = 'CLIENT_SIDE' | 'OPPOSING_SIDE' | 'NEUTRAL' | 'COURT';

export type CommunicationThread = {
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

export type TrustAccountOption = {
  id: string;
  label: string;
};

export const TASK_STATUS_OPTIONS = ['TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'CANCELED'] as const;
export const TASK_PRIORITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;
export const COMMUNICATION_TYPE_OPTIONS = ['EMAIL', 'SMS', 'CALL_LOG', 'PORTAL_MESSAGE', 'INTERNAL_NOTE'] as const;
export const COMMUNICATION_DIRECTION_OPTIONS = ['INBOUND', 'OUTBOUND', 'INTERNAL'] as const;
export const MATTER_STATUS_OPTIONS = ['OPEN', 'PENDING', 'CLOSED', 'ARCHIVED'] as const;
export const PARTICIPANT_SIDE_OPTIONS = ['CLIENT_SIDE', 'OPPOSING_SIDE', 'NEUTRAL', 'COURT'] as const;
export const PAYMENT_METHOD_OPTIONS = ['MANUAL', 'CHECK', 'ACH', 'CASH', 'STRIPE'] as const;
export const TRUST_TRANSACTION_TYPE_OPTIONS = ['DEPOSIT', 'WITHDRAWAL', 'TRANSFER', 'ADJUSTMENT'] as const;

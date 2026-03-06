import { apiFetch } from '../api';
import type { ConflictCheckPayload } from './conflict-check';
import { buildIntakeDraftData, IntakeWizardFormState } from './intake-wizard-adapter';
import type { EngagementStatus } from '../types/common';

export type Lead = {
  id: string;
  source: string;
  stage: string;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Checklist = {
  leadId: string;
  intakeDraftCreated: boolean;
  conflictChecked: boolean;
  engagementGenerated: boolean;
  engagementSent: boolean;
  convertible: boolean;
  intakeDraft: boolean;
  conflictResolved: boolean;
  engagementSigned: boolean;
  readyToConvert: boolean;
  conversionPreview?: {
    clientName?: string;
    clientEmail?: string;
    clientPhone?: string;
    propertyAddress?: string;
    suggestedMatterName: string;
    suggestedMatterNumber: string;
    defaultParticipants: Array<{
      name: string;
      roleKey: string;
      side: 'CLIENT_SIDE' | 'OPPOSING_SIDE' | 'NEUTRAL' | 'COURT';
      isPrimary: boolean;
      existingContactId?: string;
    }>;
  };
};

export type ConflictCheckRecord = {
  id: string;
  queryText: string;
  resultJson?: ConflictCheckPayload | Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
};

export type EngagementEnvelopeRecord = {
  id: string;
  status: EngagementStatus | 'PENDING_SIGNATURE' | 'VOIDED' | 'ERROR';
  externalId?: string | null;
  provider: string;
  payloadJson?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
};

export function listLeads() {
  return apiFetch<Lead[]>('/leads');
}

export function getLead(leadId: string) {
  return apiFetch<Lead>(`/leads/${leadId}`);
}

export function createLead(payload: { source: string; notes?: string }) {
  return apiFetch<Lead>('/leads', { method: 'POST', body: JSON.stringify(payload) });
}

export function createIntakeDraft(leadId: string, form: IntakeWizardFormState) {
  return apiFetch<{ id: string }>(`/leads/${leadId}/intake-drafts`, {
    method: 'POST',
    body: JSON.stringify({
      intakeFormDefinitionId: 'construction-intake-v1',
      dataJson: buildIntakeDraftData(form),
    }),
  });
}

export function runConflictCheck(leadId: string, queryText: string, resultJson?: ConflictCheckPayload) {
  return apiFetch<ConflictCheckRecord>(`/leads/${leadId}/conflict-check`, {
    method: 'POST',
    body: JSON.stringify({ queryText, resultJson }),
  });
}

export function resolveConflict(leadId: string, resolved: boolean, resolutionNotes: string) {
  return apiFetch<ConflictCheckRecord>(`/leads/${leadId}/conflict-resolution`, {
    method: 'POST',
    body: JSON.stringify({ resolved, resolutionNotes }),
  });
}

export function generateEngagement(
  leadId: string,
  engagementLetterTemplateId: string,
  payloadJson?: Record<string, unknown>,
) {
  return apiFetch<EngagementEnvelopeRecord>(`/leads/${leadId}/engagement/generate`, {
    method: 'POST',
    body: JSON.stringify({ engagementLetterTemplateId, provider: 'INTERNAL', payloadJson }),
  });
}

export function sendEngagement(leadId: string, envelopeId: string) {
  return apiFetch<EngagementEnvelopeRecord>(`/leads/${leadId}/engagement/send`, {
    method: 'POST',
    body: JSON.stringify({ envelopeId }),
  });
}

export function getLatestEngagementEnvelope(leadId: string) {
  return apiFetch<EngagementEnvelopeRecord | null>(`/leads/${leadId}/engagement/latest`);
}

export function convertLead(
  leadId: string,
  payload: {
    name: string;
    matterNumber: string;
    practiceArea: string;
    jurisdiction?: string;
    venue?: string;
    ethicalWallEnabled?: boolean;
    ethicalWallNotes?: string;
    deniedUserIds?: string[];
    participants?: Array<{
      name: string;
      roleKey: string;
      side: 'CLIENT_SIDE' | 'OPPOSING_SIDE' | 'NEUTRAL' | 'COURT';
      isPrimary?: boolean;
      notes?: string;
      existingContactId?: string;
      representedByContactId?: string;
      representedByName?: string;
      lawFirmContactId?: string;
      lawFirmName?: string;
    }>;
  },
) {
  return apiFetch<{ leadId: string; matter: { id: string; name: string; matterNumber: string } }>(`/leads/${leadId}/convert`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getSetupChecklist(leadId: string) {
  return apiFetch<Checklist>(`/leads/${leadId}/setup-checklist`);
}

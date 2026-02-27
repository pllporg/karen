import { apiFetch } from '../api';
import { buildIntakeDraftData, IntakeWizardFormState } from './intake-wizard-adapter';

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
  intakeDraft: boolean;
  conflictResolved: boolean;
  engagementSigned: boolean;
  readyToConvert: boolean;
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

export function runConflictCheck(leadId: string, queryText: string) {
  return apiFetch<{ id: string }>(`/leads/${leadId}/conflict-check`, {
    method: 'POST',
    body: JSON.stringify({ queryText }),
  });
}

export function resolveConflict(leadId: string, resolved: boolean, resolutionNotes: string) {
  return apiFetch<{ id: string }>(`/leads/${leadId}/conflict-resolution`, {
    method: 'POST',
    body: JSON.stringify({ resolved, resolutionNotes }),
  });
}

export function generateEngagement(leadId: string, engagementLetterTemplateId: string) {
  return apiFetch<{ id: string }>(`/leads/${leadId}/engagement/generate`, {
    method: 'POST',
    body: JSON.stringify({ engagementLetterTemplateId, provider: 'INTERNAL' }),
  });
}

export function sendEngagement(leadId: string, envelopeId: string) {
  return apiFetch<{ id: string }>(`/leads/${leadId}/engagement/send`, {
    method: 'POST',
    body: JSON.stringify({ envelopeId }),
  });
}

export function convertLead(
  leadId: string,
  payload: { name: string; matterNumber: string; practiceArea: string; jurisdiction?: string; venue?: string },
) {
  return apiFetch<{ id: string }>(`/leads/${leadId}/convert`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function getSetupChecklist(leadId: string) {
  return apiFetch<Checklist>(`/leads/${leadId}/setup-checklist`);
}

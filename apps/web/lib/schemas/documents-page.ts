import { z } from 'zod';
import { optionalString, requiredString } from './common';

export const retentionScopeSchema = z.enum(['ALL_DOCUMENTS', 'MATTER', 'CATEGORY']);
export const retentionTriggerSchema = z.enum(['DOCUMENT_UPLOADED', 'MATTER_CLOSED']);

function hasFile(value: unknown): value is { length: number } {
  if (!value || typeof value !== 'object') return false;
  return 'length' in value && typeof value.length === 'number' && value.length > 0;
}

export const uploadDocumentWorkflowSchema = z.object({
  matterId: optionalString,
  title: requiredString,
  file: z.custom<FileList>((value) => hasFile(value), 'Select a file.'),
});

export type UploadDocumentWorkflowFormData = z.infer<typeof uploadDocumentWorkflowSchema>;

export const generatePdfWorkflowSchema = z.object({
  matterId: optionalString,
});

export type GeneratePdfWorkflowFormData = z.infer<typeof generatePdfWorkflowSchema>;

export const retentionWorkflowSchema = z.object({
  policyName: requiredString,
  policyScope: retentionScopeSchema,
  policyTrigger: retentionTriggerSchema,
  policyRetentionDays: requiredString,
  selectedPolicyId: optionalString,
});

export type RetentionWorkflowFormData = z.infer<typeof retentionWorkflowSchema>;

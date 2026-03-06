import { z } from 'zod';
import { optionalString, requiredString } from './common';

const optionalFileList = z
  .custom<unknown>(
    (value) => value === undefined || value === null || (typeof value === 'object' && 'length' in (value as object)),
    'Select a file.',
  )
  .optional();

export const portalMessageSchema = z.object({
  matterId: requiredString,
  message: requiredString,
  attachmentTitle: optionalString,
  attachmentFile: optionalFileList,
});

export type PortalMessageFormData = z.infer<typeof portalMessageSchema>;

export const portalWorkflowSchema = z.object({
  matterId: z.string(),
  intakeFormDefinitionId: z.string(),
  engagementLetterTemplateId: z.string(),
  eSignProvider: z.enum(['stub', 'sandbox']),
});

export type PortalWorkflowFormData = z.infer<typeof portalWorkflowSchema>;

import { z } from 'zod';
import { optionalPositiveNumber, requiredEmail, requiredString } from './common';

export const generateEngagementSchema = z.object({
  templateId: requiredString,
  feeType: z.enum(['CONTINGENCY', 'HOURLY', 'FLAT'], {
    errorMap: () => ({ message: 'Select a fee type.' }),
  }),
  rate: optionalPositiveNumber,
  retainerAmount: optionalPositiveNumber,
});

export type GenerateEngagementFormData = z.infer<typeof generateEngagementSchema>;

export const sendEngagementSchema = z.object({
  recipientName: requiredString,
  recipientEmail: requiredEmail,
  secondaryRecipients: z
    .array(
      z.object({
        name: requiredString,
        email: requiredEmail,
      }),
    )
    .default([]),
});

export type SendEngagementFormData = z.infer<typeof sendEngagementSchema>;

// Current route-specific envelope actions.
export const generateEnvelopeSchema = z.object({
  templateId: requiredString,
});

export const sendEnvelopeSchema = z.object({
  envelopeId: requiredString,
});

export type GenerateEnvelopeFormData = z.infer<typeof generateEnvelopeSchema>;
export type SendEnvelopeFormData = z.infer<typeof sendEnvelopeSchema>;

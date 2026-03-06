import { z } from 'zod';
import { optionalDate, optionalString, requiredString } from './common';

export const createInvoiceSchema = z.object({
  matterId: optionalString,
});

export type CreateInvoiceFormData = z.infer<typeof createInvoiceSchema>;

export const createReconciliationRunSchema = z.object({
  trustAccountId: optionalString,
  statementStartAt: optionalDate,
  statementEndAt: optionalDate,
});

export type CreateReconciliationRunFormData = z.infer<typeof createReconciliationRunSchema>;

export const createLedesProfileSchema = z.object({
  name: requiredString,
});

export type CreateLedesProfileFormData = z.infer<typeof createLedesProfileSchema>;

export const createLedesJobSchema = z.object({
  profileId: z.string().min(1, 'Select a LEDES profile before running export.'),
  invoiceId: optionalString,
});

export type CreateLedesJobFormData = z.infer<typeof createLedesJobSchema>;

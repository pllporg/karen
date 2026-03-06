import { z } from 'zod';
import { optionalString, requiredString } from './common';

export const createLeadSchema = z.object({
  source: requiredString,
  notes: optionalString,
});

export type CreateLeadFormData = z.infer<typeof createLeadSchema>;

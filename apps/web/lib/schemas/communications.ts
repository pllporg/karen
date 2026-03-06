import { z } from 'zod';
import { requiredString } from './common';

export const createCommunicationMessageSchema = z.object({
  threadId: requiredString,
  body: requiredString,
});

export type CreateCommunicationMessageFormData = z.infer<typeof createCommunicationMessageSchema>;

export const communicationSearchSchema = z.object({
  query: z.string(),
});

export type CommunicationSearchFormData = z.infer<typeof communicationSearchSchema>;

import { z } from 'zod';
import { optionalString, requiredString } from './common';

export const createMatterSchema = z.object({
  name: requiredString,
  matterNumber: requiredString,
  practiceArea: requiredString,
  caseType: optionalString,
});

export type CreateMatterFormData = z.infer<typeof createMatterSchema>;

export const convertLeadSchema = z.object({
  name: requiredString,
  matterNumber: requiredString,
  practiceArea: requiredString,
  caseType: optionalString,
});

export type ConvertLeadFormData = z.infer<typeof convertLeadSchema>;

export const participantSchema = z.object({
  name: requiredString,
  role: z.enum(
    ['CLIENT', 'OPPOSING_PARTY', 'OPPOSING_COUNSEL', 'EXPERT', 'WITNESS', 'MEDIATOR', 'JUDGE', 'OTHER'],
    {
      errorMap: () => ({ message: 'Select a role.' }),
    },
  ),
  side: z.enum(['PLAINTIFF', 'DEFENDANT', 'NEUTRAL'], {
    errorMap: () => ({ message: 'Select a side.' }),
  }),
  contactId: optionalString,
});

export type ParticipantFormData = z.infer<typeof participantSchema>;

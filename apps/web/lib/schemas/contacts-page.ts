import { z } from 'zod';
import { requiredString } from './common';

export const contactsCreateSchema = z.object({
  displayName: requiredString,
  kind: z.enum(['PERSON', 'ORGANIZATION'], {
    errorMap: () => ({ message: 'Select a contact kind.' }),
  }),
});

export const contactsFilterSchema = z.object({
  search: z.string(),
  includeTagsInput: z.string(),
  excludeTagsInput: z.string(),
  tagMode: z.enum(['any', 'all']),
});

export const contactsGraphFilterSchema = z.object({
  graphSearch: z.string(),
  graphRelationshipType: z.string(),
});

export type ContactsCreateFormData = z.infer<typeof contactsCreateSchema>;
export type ContactsFilterFormData = z.infer<typeof contactsFilterSchema>;
export type ContactsGraphFilterFormData = z.infer<typeof contactsGraphFilterSchema>;

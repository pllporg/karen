import { z } from 'zod';
import { optionalEmail, optionalPhone, optionalString, requiredString } from './common';

export const createContactSchema = z.object({
  firstName: requiredString,
  lastName: requiredString,
  email: optionalEmail,
  phone: optionalPhone,
  company: optionalString,
  type: z.enum(['INDIVIDUAL', 'ORGANIZATION'], {
    errorMap: () => ({ message: 'Select a contact type.' }),
  }),
});

export type CreateContactFormData = z.infer<typeof createContactSchema>;

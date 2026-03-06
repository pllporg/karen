import { z } from 'zod';
import { requiredEmail, requiredString } from './common';

export const inviteUserSchema = z.object({
  email: requiredEmail,
  role: z.enum(['ADMIN', 'ATTORNEY', 'PARALEGAL', 'STAFF'], {
    errorMap: () => ({ message: 'Select a role.' }),
  }),
  name: requiredString,
});

export type InviteUserFormData = z.infer<typeof inviteUserSchema>;

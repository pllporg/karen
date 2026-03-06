import { z } from 'zod';
import { optionalString, requiredString } from './common';

export const uploadDocumentSchema = z.object({
  title: requiredString,
  matterId: optionalString,
  category: optionalString,
});

export type UploadDocumentFormData = z.infer<typeof uploadDocumentSchema>;

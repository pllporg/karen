import { z } from 'zod';
import { optionalString, requiredString } from './common';

export const runConflictCheckSchema = z.object({
  queryText: requiredString,
});

export type RunConflictCheckFormData = z.infer<typeof runConflictCheckSchema>;

export const conflictResolutionSchema = z
  .object({
    resolution: z.enum(['CLEARED', 'POTENTIAL_CONFLICT', 'CONFIRMED_CONFLICT'], {
      errorMap: () => ({ message: 'Select a resolution.' }),
    }),
    notes: optionalString,
  })
  .refine(
    (data) => {
      if (data.resolution === 'CLEARED') return true;
      return Boolean(data.notes && data.notes.trim().length);
    },
    { message: 'Notes are required for potential or confirmed conflicts.', path: ['notes'] },
  );

export type ConflictResolutionFormData = z.infer<typeof conflictResolutionSchema>;

export const resolveConflictSchema = z.object({
  resolutionNotes: requiredString,
});

export type ResolveConflictFormData = z.infer<typeof resolveConflictSchema>;

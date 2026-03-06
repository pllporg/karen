import { z } from 'zod';
import { requiredString } from './common';

const numericThreshold = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .refine((value) => !Number.isNaN(Number(value)), `${label} must be a number.`);

export const customFieldConfigSchema = z.object({
  key: requiredString,
  label: requiredString,
});

export const sectionConfigSchema = z.object({
  name: requiredString,
});

export const participantRoleConfigSchema = z.object({
  key: requiredString,
  label: requiredString,
  sideDefault: z.enum(['CLIENT_SIDE', 'OPPOSING_SIDE', 'NEUTRAL', 'COURT']),
});

export const conflictProfileConfigSchema = z.object({
  name: requiredString,
  warnThreshold: numericThreshold('Warn threshold'),
  blockThreshold: numericThreshold('Block threshold'),
});

export const adminConflictCheckSchema = z.object({
  queryText: requiredString,
  profileId: z.string(),
});

export const adminConflictResolutionSchema = z.object({
  decision: z.enum(['CLEAR', 'WAIVE', 'BLOCK']),
  rationale: requiredString,
});

export type CustomFieldConfigFormData = z.infer<typeof customFieldConfigSchema>;
export type SectionConfigFormData = z.infer<typeof sectionConfigSchema>;
export type ParticipantRoleConfigFormData = z.infer<typeof participantRoleConfigSchema>;
export type ConflictProfileConfigFormData = z.infer<typeof conflictProfileConfigSchema>;
export type AdminConflictCheckFormData = z.infer<typeof adminConflictCheckSchema>;
export type AdminConflictResolutionFormData = z.infer<typeof adminConflictResolutionSchema>;

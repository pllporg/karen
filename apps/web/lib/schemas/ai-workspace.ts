import { z } from 'zod';
import { optionalString } from './common';

const aiToolOptions = [
  'case_summary',
  'timeline_extraction',
  'intake_evaluation',
  'demand_letter',
  'preservation_notice',
  'complaint_skeleton',
  'client_status_update',
  'discovery_generate',
  'discovery_response',
  'deadline_extraction',
  'next_best_action',
] as const;

export const aiJobCreateSchema = z.object({
  matterId: z.string().trim().min(1, 'Select a matter.'),
  toolName: z.enum(aiToolOptions),
  stylePackId: optionalString,
});

export const stylePackCreateSchema = z.object({
  name: z.string().trim().min(1, 'Enter a style pack name.'),
  description: optionalString,
});

export type AiJobCreateFormData = z.infer<typeof aiJobCreateSchema>;
export type StylePackCreateFormData = z.infer<typeof stylePackCreateSchema>;

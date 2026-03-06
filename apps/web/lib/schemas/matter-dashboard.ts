import { z } from 'zod';
import { optionalDate, requiredString } from './common';

export const matterTaskPriorityOptions = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

export const matterTaskSchema = z.object({
  title: requiredString,
  dueAt: optionalDate,
  priority: z.enum(matterTaskPriorityOptions),
});

export type MatterTaskFormData = z.infer<typeof matterTaskSchema>;

export const matterCalendarEventSchema = z.object({
  type: requiredString,
  startAt: requiredString,
  endAt: optionalDate,
  location: z.string().optional().or(z.literal('')),
});

export type MatterCalendarEventFormData = z.infer<typeof matterCalendarEventSchema>;

export const participantSideOptions = ['CLIENT_SIDE', 'OPPOSING_SIDE', 'NEUTRAL', 'COURT'] as const;

export const matterParticipantSchema = z.object({
  contactId: requiredString,
  participantRoleKey: requiredString,
  side: z.enum(participantSideOptions),
  isPrimary: z.boolean(),
  representedByContactId: z.string().optional().or(z.literal('')),
  lawFirmContactId: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export type MatterParticipantFormData = z.infer<typeof matterParticipantSchema>;

export const matterCommunicationTypeOptions = ['EMAIL', 'SMS', 'CALL_LOG', 'PORTAL_MESSAGE', 'INTERNAL_NOTE'] as const;
export const matterCommunicationDirectionOptions = ['INBOUND', 'OUTBOUND', 'INTERNAL'] as const;

export const matterCommunicationSchema = z.object({
  threadId: requiredString,
  threadSubject: z.string().optional().or(z.literal('')),
  type: z.enum(matterCommunicationTypeOptions),
  direction: z.enum(matterCommunicationDirectionOptions),
  participantContactId: z.string().optional().or(z.literal('')),
  occurredAt: optionalDate,
  subject: z.string().optional().or(z.literal('')),
  body: requiredString,
});

export type MatterCommunicationFormData = z.infer<typeof matterCommunicationSchema>;

import { z } from 'zod';
import { optionalDate, optionalString, requiredString } from './common';

export const matterOverviewStatusOptions = ['OPEN', 'PENDING', 'CLOSED', 'ARCHIVED'] as const;

export const matterOverviewSchema = z.object({
  name: requiredString,
  matterNumber: requiredString,
  practiceArea: requiredString,
  status: z.enum(matterOverviewStatusOptions),
  venue: optionalString,
  jurisdiction: optionalString,
  openedAt: optionalDate,
  closedAt: optionalDate,
});

export type MatterOverviewFormData = z.infer<typeof matterOverviewSchema>;

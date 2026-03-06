import { z } from 'zod';
import { optionalString, requiredString } from './common';

export const mattersPageSchema = z.object({
  matterNumber: requiredString,
  name: requiredString,
  practiceArea: requiredString,
  propertyAddress: optionalString,
  propertyCity: optionalString,
  propertyState: optionalString,
  parcelNumber: optionalString,
  contractPrice: optionalString,
  contractDate: optionalString,
  defectCategory: optionalString,
  defectSeverity: optionalString,
  defectDescription: optionalString,
  damageCategory: optionalString,
  repairEstimate: optionalString,
  lienClaimantName: optionalString,
  lienAmount: optionalString,
  lienStatus: optionalString,
  claimNumber: optionalString,
  policyNumber: optionalString,
  insurerName: optionalString,
  adjusterName: optionalString,
  expertName: optionalString,
  expertScope: optionalString,
  milestoneName: optionalString,
});

export type MattersPageFormData = z.infer<typeof mattersPageSchema>;

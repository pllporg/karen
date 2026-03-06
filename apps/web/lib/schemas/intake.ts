import { z } from 'zod';
import {
  optionalDate,
  optionalPhone,
  optionalPositiveNumber,
  optionalString,
  requiredEmail,
  requiredString,
} from './common';

export const intakeClientSchema = z.object({
  firstName: requiredString,
  lastName: requiredString,
  email: requiredEmail,
  phone: optionalPhone,
  company: optionalString,
  role: optionalString,
});

export type IntakeClientFormData = z.infer<typeof intakeClientSchema>;

export const intakePropertySchema = z.object({
  addressLine1: requiredString,
  city: requiredString,
  state: requiredString,
  zip: requiredString,
  parcelNumber: optionalString,
  propertyType: optionalString,
  yearBuilt: optionalString,
});

export type IntakePropertyFormData = z.infer<typeof intakePropertySchema>;

export const defectSchema = z.object({
  category: requiredString,
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    errorMap: () => ({ message: 'Select a severity level.' }),
  }),
  description: optionalString,
});

export const damageSchema = z.object({
  category: requiredString,
  repairEstimate: optionalPositiveNumber,
});

export const lienSchema = z.object({
  claimantName: requiredString,
  amount: optionalPositiveNumber,
  status: optionalString,
});

export const insuranceClaimSchema = z.object({
  claimNumber: optionalString,
  policyNumber: optionalString,
  insurerName: optionalString,
  adjusterName: optionalString,
  status: optionalString,
});

export const intakeDisputeSchema = z.object({
  contractDate: optionalDate,
  contractPrice: optionalPositiveNumber,
  defects: z.array(defectSchema).default([]),
  damages: z.array(damageSchema).default([]),
  liens: z.array(lienSchema).default([]),
  insuranceClaims: z.array(insuranceClaimSchema).default([]),
});

export type IntakeDisputeFormData = z.infer<typeof intakeDisputeSchema>;

export const fullIntakeSchema = z.object({
  client: intakeClientSchema,
  property: intakePropertySchema,
  dispute: intakeDisputeSchema,
});

export type FullIntakeFormData = z.infer<typeof fullIntakeSchema>;

// Current adapter-backed intake draft form (flat shape used by Leads API adapter).
export const intakeDraftAdapterSchema = z.object({
  propertyAddress: requiredString,
  propertyCity: requiredString,
  propertyState: requiredString,
  parcelNumber: z.string(),
  contractDate: z.string(),
  contractPrice: z.string(),
  defectCategory: requiredString,
  defectSeverity: requiredString,
  defectDescription: z.string(),
  damageCategory: requiredString,
  repairEstimate: z.string(),
  lienClaimantName: z.string(),
  lienAmount: z.string(),
  lienStatus: z.string(),
  claimNumber: z.string(),
  policyNumber: z.string(),
  insurerName: z.string(),
  adjusterName: z.string(),
  expertName: z.string(),
  expertScope: z.string(),
  milestoneName: z.string(),
});

export type IntakeDraftAdapterFormData = z.infer<typeof intakeDraftAdapterSchema>;

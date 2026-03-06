import { z } from 'zod';
import { runConflictCheckSchema, resolveConflictSchema } from './conflict';
import { generateEnvelopeSchema, sendEnvelopeSchema } from './engagement';
import { convertLeadSchema as matterConvertLeadSchema } from './matter';

const requiredText = (label: string) => z.string().trim().min(1, `${label} is required.`);
const optionalText = () => z.string().trim().optional().or(z.literal(''));

export const createLeadSchema = z.object({
  source: requiredText('Lead source'),
  notes: z.string().trim().max(2000, 'Processing notes must be 2000 characters or fewer.'),
});

export const intakeClientSchema = z.object({
  firstName: requiredText('First name'),
  lastName: requiredText('Last name'),
  email: requiredText('Email').email('Email must be valid.'),
  phone: optionalText(),
  company: optionalText(),
  role: optionalText(),
  linkedContactId: optionalText(),
});

export const intakePropertySchema = z.object({
  addressLine1: requiredText('Property address'),
  city: requiredText('Property city'),
  state: requiredText('Property state').min(2, 'Property state must be at least 2 characters.'),
  zip: requiredText('ZIP code').regex(/^\d{5}(?:-\d{4})?$/, 'ZIP code must be valid.'),
  parcelNumber: optionalText(),
  propertyType: optionalText(),
  yearBuilt: optionalText().refine(
    (value) => !value || /^\d{4}$/.test(value),
    'Year built must be a four-digit year.',
  ),
});

export const intakeDefectSchema = z.object({
  category: requiredText('Defect category'),
  severity: requiredText('Defect severity'),
  description: requiredText('Defect description'),
});

export const intakeDamageSchema = z.object({
  category: requiredText('Damage category'),
  amount: requiredText('Damage amount').refine((value) => !Number.isNaN(Number(value)), 'Damage amount must be numeric.'),
  description: optionalText(),
});

export const intakeUploadSchema = z.object({
  id: requiredText('Upload id'),
  name: requiredText('File name'),
  sizeBytes: z.number().nonnegative(),
  category: requiredText('Upload category'),
  status: z.enum(['UPLOADING', 'COMPLETE', 'ERROR']),
});

export const intakeDisputeSchema = z.object({
  contractDate: requiredText('Contract date'),
  contractPrice: requiredText('Contract price').refine((value) => !Number.isNaN(Number(value)), 'Contract price must be numeric.'),
  defects: z.array(intakeDefectSchema).min(1, 'At least one defect is required.'),
  damages: z.array(intakeDamageSchema).min(1, 'At least one damage entry is required.'),
});

export const intakeWizardSchema = z.object({
  client: intakeClientSchema,
  property: intakePropertySchema,
  dispute: intakeDisputeSchema,
  uploads: z.array(intakeUploadSchema),
});

export type IntakeWizardStepKey = 'client' | 'property' | 'dispute' | 'uploads' | 'review';

export const conflictCheckSchema = runConflictCheckSchema;
export const conflictResolutionSchema = resolveConflictSchema;
export const engagementGenerateSchema = generateEnvelopeSchema;
export const engagementSendSchema = sendEnvelopeSchema;
export const leadConvertSchema = matterConvertLeadSchema;

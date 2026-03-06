import { z } from 'zod';
import type { IntakeWizardFormState } from '../intake/intake-wizard-adapter';

const requiredText = (label: string) => z.string().trim().min(1, `${label} is required.`);
const numberText = (label: string) =>
  requiredText(label).refine((value) => !Number.isNaN(Number(value)), `${label} must be a number.`);

export const createLeadSchema = z.object({
  source: requiredText('Lead source'),
  notes: z.string().trim().max(2000, 'Processing notes must be 2000 characters or fewer.'),
});

export const intakeDraftSchema = z.object({
  propertyAddress: requiredText('Property address'),
  propertyCity: requiredText('Property city'),
  propertyState: requiredText('Property state').min(2, 'Property state must be at least 2 characters.'),
  parcelNumber: requiredText('Parcel number'),
  contractDate: requiredText('Contract date'),
  contractPrice: numberText('Contract price'),
  defectCategory: requiredText('Defect category'),
  defectSeverity: requiredText('Defect severity'),
  defectDescription: requiredText('Defect description'),
  damageCategory: requiredText('Damage category'),
  repairEstimate: numberText('Repair estimate'),
  lienClaimantName: requiredText('Lien claimant name'),
  lienAmount: numberText('Lien amount'),
  lienStatus: requiredText('Lien status'),
  claimNumber: requiredText('Claim number'),
  policyNumber: requiredText('Policy number'),
  insurerName: requiredText('Insurer name'),
  adjusterName: requiredText('Adjuster name'),
  expertName: requiredText('Expert name'),
  expertScope: requiredText('Expert scope'),
  milestoneName: z.string().trim().max(200, 'Milestone name must be 200 characters or fewer.'),
});

export const conflictCheckSchema = z.object({
  queryText: requiredText('Conflict query'),
});

export const conflictResolutionSchema = z.object({
  resolutionNotes: requiredText('Resolution notes'),
});

export const engagementGenerateSchema = z.object({
  templateId: requiredText('Template ID'),
});

export const engagementSendSchema = z.object({
  envelopeId: requiredText('Envelope ID'),
});

export const leadConvertSchema = z.object({
  name: requiredText('Matter name'),
  matterNumber: requiredText('Matter number'),
  practiceArea: requiredText('Practice area'),
});

export type IntakeDraftFieldConfig = {
  name: keyof IntakeWizardFormState;
  label: string;
  hint?: string;
  multiline?: boolean;
};

export const intakeDraftFields: IntakeDraftFieldConfig[] = [
  { name: 'propertyAddress', label: 'Property Address', hint: 'Primary site address for the residential project.' },
  { name: 'propertyCity', label: 'Property City' },
  { name: 'propertyState', label: 'Property State', hint: 'Postal abbreviation or jurisdiction code.' },
  { name: 'parcelNumber', label: 'Parcel Number' },
  { name: 'contractDate', label: 'Contract Date', hint: 'Use YYYY-MM-DD format.' },
  { name: 'contractPrice', label: 'Contract Price' },
  { name: 'defectCategory', label: 'Defect Category' },
  { name: 'defectSeverity', label: 'Defect Severity' },
  { name: 'defectDescription', label: 'Defect Description', multiline: true },
  { name: 'damageCategory', label: 'Damage Category' },
  { name: 'repairEstimate', label: 'Repair Estimate' },
  { name: 'lienClaimantName', label: 'Lien Claimant Name' },
  { name: 'lienAmount', label: 'Lien Amount' },
  { name: 'lienStatus', label: 'Lien Status' },
  { name: 'claimNumber', label: 'Claim Number' },
  { name: 'policyNumber', label: 'Policy Number' },
  { name: 'insurerName', label: 'Insurer Name' },
  { name: 'adjusterName', label: 'Adjuster Name' },
  { name: 'expertName', label: 'Expert Name' },
  { name: 'expertScope', label: 'Expert Scope', multiline: true },
  { name: 'milestoneName', label: 'Milestone Name', hint: 'Optional initial milestone for intake tracking.' },
];

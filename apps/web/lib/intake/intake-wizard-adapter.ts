export type IntakeWizardFormState = {
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  parcelNumber: string;
  contractDate: string;
  contractPrice: string;
  defectCategory: string;
  defectSeverity: string;
  defectDescription: string;
  damageCategory: string;
  repairEstimate: string;
  lienClaimantName: string;
  lienAmount: string;
  lienStatus: string;
  claimNumber: string;
  policyNumber: string;
  insurerName: string;
  adjusterName: string;
  expertName: string;
  expertScope: string;
  milestoneName: string;
};

export const defaultIntakeWizardForm: IntakeWizardFormState = {
  propertyAddress: '1234 Orchard Lane',
  propertyCity: 'Pasadena',
  propertyState: 'CA',
  parcelNumber: 'APN-1234-99',
  contractDate: '2025-10-01',
  contractPrice: '125000',
  defectCategory: 'Water Intrusion',
  defectSeverity: 'High',
  defectDescription: 'Leak at kitchen window framing and drywall.',
  damageCategory: 'Repair Estimate',
  repairEstimate: '28500',
  lienClaimantName: 'Sunset Carpentry LLC',
  lienAmount: '14250',
  lienStatus: 'RECORDED',
  claimNumber: 'CLM-77821',
  policyNumber: 'HO-445-992',
  insurerName: 'Blue Harbor Insurance',
  adjusterName: 'Jordan Adjuster',
  expertName: 'Dr. Maya Expert',
  expertScope: 'Forensic causation and repair-cost reasonableness analysis.',
  milestoneName: 'Initial inspection complete',
};

export function buildIntakeDraftData(form: IntakeWizardFormState) {
  return {
    property: {
      addressLine1: form.propertyAddress,
      city: form.propertyCity,
      state: form.propertyState,
      parcelNumber: form.parcelNumber,
    },
    contract: {
      contractDate: form.contractDate,
      contractPrice: Number(form.contractPrice || 0),
    },
    defects: [{ category: form.defectCategory, severity: form.defectSeverity, description: form.defectDescription }],
    damages: [{ category: form.damageCategory, repairEstimate: Number(form.repairEstimate || 0) }],
    liens: [{ claimantName: form.lienClaimantName, amount: Number(form.lienAmount || 0), status: form.lienStatus }],
    insuranceClaims: [
      {
        claimNumber: form.claimNumber,
        policyNumber: form.policyNumber,
        insurerName: form.insurerName,
        adjusterName: form.adjusterName,
        status: 'OPEN',
      },
    ],
    expertEngagements: [{ expertName: form.expertName, scope: form.expertScope, status: 'ENGAGED' }],
    milestones: form.milestoneName ? [{ name: form.milestoneName, status: 'OPEN' }] : [],
  };
}

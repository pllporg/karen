'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { Button } from '../../components/ui/button';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { apiFetch } from '../../lib/api';
import { mattersPageSchema, type MattersPageFormData } from '../../lib/schemas/matters-page';

type Matter = {
  id: string;
  matterNumber: string;
  name: string;
  practiceArea: string;
  status: string;
};
type IntakeDraftSummary = {
  id: string;
  label: string;
  savedAt: string;
  matterNumber?: string | null;
  name?: string | null;
};
type IntakeDraftPayload = {
  matterNumber?: string | null;
  name?: string | null;
  practiceArea?: string | null;
  property?: {
    addressLine1?: string | null;
    city?: string | null;
    state?: string | null;
    parcelNumber?: string | null;
  } | null;
  contract?: {
    contractDate?: string | null;
    contractPrice?: number | string | null;
  } | null;
  defects?: Array<{
    category?: string | null;
    severity?: string | null;
    description?: string | null;
  }> | null;
  damages?: Array<{
    category?: string | null;
    repairEstimate?: number | string | null;
  }> | null;
  liens?: Array<{
    claimantName?: string | null;
    amount?: number | string | null;
    status?: string | null;
  }> | null;
  insuranceClaims?: Array<{
    claimNumber?: string | null;
    policyNumber?: string | null;
    insurerName?: string | null;
    adjusterName?: string | null;
  }> | null;
  expertEngagements?: Array<{
    expertName?: string | null;
    scope?: string | null;
  }> | null;
  milestones?: Array<{
    name?: string | null;
  }> | null;
};
const intakeFields: Array<{
  key: keyof MattersPageFormData;
  label: string;
  placeholder: string;
}> = [
  { key: 'propertyAddress', label: 'Property Address', placeholder: 'Property address' },
  { key: 'propertyCity', label: 'Property City', placeholder: 'City' },
  { key: 'propertyState', label: 'Property State', placeholder: 'State' },
  { key: 'parcelNumber', label: 'Parcel Number', placeholder: 'Parcel/APN' },
  { key: 'contractDate', label: 'Contract Date', placeholder: 'Contract date (YYYY-MM-DD)' },
  { key: 'contractPrice', label: 'Contract Price', placeholder: 'Contract price' },
  { key: 'defectCategory', label: 'Defect Category', placeholder: 'Defect category' },
  { key: 'defectSeverity', label: 'Defect Severity', placeholder: 'Defect severity' },
  { key: 'defectDescription', label: 'Defect Description', placeholder: 'Defect description' },
  { key: 'damageCategory', label: 'Damages Category', placeholder: 'Damages category' },
  { key: 'repairEstimate', label: 'Repair Estimate', placeholder: 'Repair estimate' },
  { key: 'lienClaimantName', label: 'Lien Claimant Name', placeholder: 'Lien claimant name' },
  { key: 'lienAmount', label: 'Lien Amount', placeholder: 'Lien amount' },
  { key: 'lienStatus', label: 'Lien Status', placeholder: 'Lien status' },
  { key: 'claimNumber', label: 'Claim Number', placeholder: 'Claim number' },
  { key: 'policyNumber', label: 'Policy Number', placeholder: 'Policy number' },
  { key: 'insurerName', label: 'Insurer Name', placeholder: 'Insurer name' },
  { key: 'adjusterName', label: 'Adjuster Name', placeholder: 'Adjuster name' },
  { key: 'expertName', label: 'Expert Name', placeholder: 'Expert name' },
  { key: 'expertScope', label: 'Expert Scope', placeholder: 'Expert scope' },
  { key: 'milestoneName', label: 'Project Milestone', placeholder: 'Project milestone' },
];
function asNumber(value: string | undefined): number {
  return Number(value ?? '');
}
export default function MattersPage() {
  const [matters, setMatters] = useState<Matter[]>([]);
  const [drafts, setDrafts] = useState<IntakeDraftSummary[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState('');
  const [wizardStatus, setWizardStatus] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    reset,
  } = useForm<MattersPageFormData>({
    resolver: zodResolver(mattersPageSchema),
    mode: 'onBlur',
    defaultValues: {
      matterNumber: 'M-2026-001',
      name: 'Kitchen Remodel Defect - Ortega',
      practiceArea: 'Construction Litigation',
      propertyAddress: '1234 Orchard Lane',
      propertyCity: 'Pasadena',
      propertyState: 'CA',
      parcelNumber: 'APN-1234-99',
      contractPrice: '125000',
      contractDate: '2025-10-01',
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
    },
  });

  const loadMatters = useCallback(async () => {
    const rows = await apiFetch<Matter[]>('/matters');
    const uniqueRows = rows.filter(
      (matter, index, list) => list.findIndex((candidate) => candidate.matterNumber === matter.matterNumber) === index,
    );
    setMatters(uniqueRows);
  }, []);

  const loadDrafts = useCallback(async () => {
    const rows = await apiFetch<IntakeDraftSummary[]>('/matters/intake-wizard/drafts');
    setDrafts(rows);
    setSelectedDraftId((current) => current || rows[0]?.id || '');
  }, []);

  useEffect(() => {
    Promise.all([loadMatters(), loadDrafts()]).catch(() => undefined);
  }, [loadDrafts, loadMatters]);

  function buildIntakePayload(data: MattersPageFormData) {
    return {
      matterNumber: `${data.matterNumber}-INTAKE`,
      name: `${data.name} (Intake)`,
      practiceArea: data.practiceArea,
      property: {
        addressLine1: data.propertyAddress,
        city: data.propertyCity,
        state: data.propertyState,
        parcelNumber: data.parcelNumber,
      },
      contract: {
        contractDate: data.contractDate,
        contractPrice: asNumber(data.contractPrice),
      },
      defects: [
        {
          category: data.defectCategory,
          severity: data.defectSeverity,
          description: data.defectDescription,
        },
      ],
      damages: [
        {
          category: data.damageCategory,
          repairEstimate: asNumber(data.repairEstimate),
        },
      ],
      liens: [
        {
          claimantName: data.lienClaimantName,
          amount: asNumber(data.lienAmount),
          status: data.lienStatus,
        },
      ],
      insuranceClaims: [
        {
          claimNumber: data.claimNumber,
          policyNumber: data.policyNumber,
          insurerName: data.insurerName,
          adjusterName: data.adjusterName,
          status: 'OPEN',
        },
      ],
      expertEngagements: [
        {
          expertName: data.expertName,
          scope: data.expertScope,
          status: 'ENGAGED',
        },
      ],
      milestones: data.milestoneName ? [{ name: data.milestoneName, status: 'OPEN' }] : [],
    };
  }

  function applyIntakePayload(payload: IntakeDraftPayload) {
    const currentValues = getValues();
    const firstDefect = payload.defects?.[0];
    const firstDamage = payload.damages?.[0];
    const firstLien = payload.liens?.[0];
    const firstClaim = payload.insuranceClaims?.[0];
    const firstExpert = payload.expertEngagements?.[0];
    const firstMilestone = payload.milestones?.[0];

    reset({
      ...currentValues,
      matterNumber: (payload.matterNumber || '').replace(/-INTAKE$/, '') || currentValues.matterNumber,
      name: (payload.name || '').replace(/\s+\(Intake\)$/, '') || currentValues.name,
      practiceArea: payload.practiceArea || currentValues.practiceArea,
      propertyAddress: payload.property?.addressLine1 || currentValues.propertyAddress,
      propertyCity: payload.property?.city || currentValues.propertyCity,
      propertyState: payload.property?.state || currentValues.propertyState,
      parcelNumber: payload.property?.parcelNumber || currentValues.parcelNumber,
      contractDate: payload.contract?.contractDate || currentValues.contractDate,
      contractPrice:
        payload.contract?.contractPrice !== undefined && payload.contract?.contractPrice !== null
          ? String(payload.contract.contractPrice)
          : currentValues.contractPrice,
      defectCategory: firstDefect?.category || currentValues.defectCategory,
      defectSeverity: firstDefect?.severity || currentValues.defectSeverity,
      defectDescription: firstDefect?.description || currentValues.defectDescription,
      damageCategory: firstDamage?.category || currentValues.damageCategory,
      repairEstimate:
        firstDamage?.repairEstimate !== undefined && firstDamage?.repairEstimate !== null
          ? String(firstDamage.repairEstimate)
          : currentValues.repairEstimate,
      lienClaimantName: firstLien?.claimantName || currentValues.lienClaimantName,
      lienAmount:
        firstLien?.amount !== undefined && firstLien?.amount !== null
          ? String(firstLien.amount)
          : currentValues.lienAmount,
      lienStatus: firstLien?.status || currentValues.lienStatus,
      claimNumber: firstClaim?.claimNumber || currentValues.claimNumber,
      policyNumber: firstClaim?.policyNumber || currentValues.policyNumber,
      insurerName: firstClaim?.insurerName || currentValues.insurerName,
      adjusterName: firstClaim?.adjusterName || currentValues.adjusterName,
      expertName: firstExpert?.expertName || currentValues.expertName,
      expertScope: firstExpert?.scope || currentValues.expertScope,
      milestoneName: firstMilestone?.name || currentValues.milestoneName,
    });
  }

  const createMatter = handleSubmit(async (data) => {
    await apiFetch('/matters', {
      method: 'POST',
      body: JSON.stringify({
        matterNumber: data.matterNumber,
        name: data.name,
        practiceArea: data.practiceArea,
      }),
    });
    await loadMatters();
  });

  const saveIntakeDraft = handleSubmit(async (data) => {
    const result = await apiFetch<{ id: string; savedAt: string }>('/matters/intake-wizard/drafts', {
      method: 'POST',
      body: JSON.stringify({
        draftId: selectedDraftId || undefined,
        payload: buildIntakePayload(data),
      }),
    });
    await loadDrafts();
    setSelectedDraftId(result.id);
    setWizardStatus(`Draft saved at ${new Date(result.savedAt).toLocaleString()}`);
  });

  async function resumeDraft() {
    if (!selectedDraftId) return;
    const draft = await apiFetch<{ id: string; savedAt: string; payload: IntakeDraftPayload }>(
      `/matters/intake-wizard/drafts/${selectedDraftId}`,
    );
    applyIntakePayload(draft.payload);
    setWizardStatus(`Draft loaded from ${new Date(draft.savedAt).toLocaleString()}`);
  }

  const createViaIntakeWizard = handleSubmit(async (data) => {
    await apiFetch('/matters/intake-wizard', {
      method: 'POST',
      body: JSON.stringify(buildIntakePayload(data)),
    });
    setWizardStatus('Matter created from intake wizard.');
    await loadMatters();
  });

  return (
    <AppShell>
      <PageHeader
        title="Matters"
        subtitle="Dashboard-ready matters with participants, timeline, billing, docs, AI workspace, and full construction intake."
      />

      <div className="card mb-3">
        <form onSubmit={createMatter} className="grid-4">
          <FormField label="Matter Number" name="matter-number" error={errors.matterNumber?.message} required>
            <Input placeholder="Matter #" {...register('matterNumber')} invalid={!!errors.matterNumber} />
          </FormField>
          <FormField label="Matter Name" name="matter-name" error={errors.name?.message} required>
            <Input placeholder="Matter Name" {...register('name')} invalid={!!errors.name} />
          </FormField>
          <FormField label="Practice Area" name="practice-area" error={errors.practiceArea?.message} required>
            <Input placeholder="Practice Area" {...register('practiceArea')} invalid={!!errors.practiceArea} />
          </FormField>
          <Button type="submit">Create</Button>
        </form>
      </div>

      <div className="card mb-3 stack-3">
        <h3>Construction Intake Wizard</h3>
        <div className="form-grid-3">
          {intakeFields.map((field) => (
            <FormField key={field.key} label={field.label} name={`intake-${field.key}`}>
              <Input placeholder={field.placeholder} {...register(field.key)} />
            </FormField>
          ))}
        </div>

        <div className="grid-4">
          <FormField label="Saved Drafts" name="intake-draft-selector">
            <Select
              value={selectedDraftId}
              onChange={(event) => setSelectedDraftId(event.target.value)}
              aria-label="Intake draft selector"
            >
              <option value="">Select draft...</option>
              {drafts.map((draft) => (
                <option key={draft.id} value={draft.id}>
                  {draft.label}
                </option>
              ))}
            </Select>
          </FormField>
          <Button tone="ghost" type="button" onClick={saveIntakeDraft}>
            Save Intake Draft
          </Button>
          <Button tone="ghost" type="button" onClick={resumeDraft} disabled={!selectedDraftId}>
            Resume Draft
          </Button>
          <Button tone="secondary" type="button" onClick={createViaIntakeWizard}>
            Create via Intake Wizard
          </Button>
        </div>

        {wizardStatus ? (
          <div className="mt-2">
            <span className="badge">{wizardStatus}</span>
          </div>
        ) : null}
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Matter #</th>
              <th>Name</th>
              <th>Practice Area</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {matters.map((matter) => (
              <tr key={matter.id}>
                <td>
                  <Link href={`/matters/${matter.id}`} prefetch={false}>
                    {matter.matterNumber}
                  </Link>
                </td>
                <td>{matter.name}</td>
                <td>{matter.practiceArea}</td>
                <td>{matter.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

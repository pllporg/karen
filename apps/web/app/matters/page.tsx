'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { apiFetch } from '../../lib/api';

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

export default function MattersPage() {
  const [matters, setMatters] = useState<Matter[]>([]);
  const [matterNumber, setMatterNumber] = useState('M-2026-001');
  const [name, setName] = useState('Kitchen Remodel Defect - Ortega');
  const [practiceArea, setPracticeArea] = useState('Construction Litigation');

  const [propertyAddress, setPropertyAddress] = useState('1234 Orchard Lane');
  const [propertyCity, setPropertyCity] = useState('Pasadena');
  const [propertyState, setPropertyState] = useState('CA');
  const [parcelNumber, setParcelNumber] = useState('APN-1234-99');
  const [contractPrice, setContractPrice] = useState('125000');
  const [contractDate, setContractDate] = useState('2025-10-01');
  const [defectCategory, setDefectCategory] = useState('Water Intrusion');
  const [defectSeverity, setDefectSeverity] = useState('High');
  const [defectDescription, setDefectDescription] = useState('Leak at kitchen window framing and drywall.');
  const [damageCategory, setDamageCategory] = useState('Repair Estimate');
  const [repairEstimate, setRepairEstimate] = useState('28500');
  const [lienClaimantName, setLienClaimantName] = useState('Sunset Carpentry LLC');
  const [lienAmount, setLienAmount] = useState('14250');
  const [lienStatus, setLienStatus] = useState('RECORDED');
  const [claimNumber, setClaimNumber] = useState('CLM-77821');
  const [policyNumber, setPolicyNumber] = useState('HO-445-992');
  const [insurerName, setInsurerName] = useState('Blue Harbor Insurance');
  const [adjusterName, setAdjusterName] = useState('Jordan Adjuster');
  const [expertName, setExpertName] = useState('Dr. Maya Expert');
  const [expertScope, setExpertScope] = useState('Forensic causation and repair-cost reasonableness analysis.');
  const [milestoneName, setMilestoneName] = useState('Initial inspection complete');

  const [drafts, setDrafts] = useState<IntakeDraftSummary[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState('');
  const [wizardStatus, setWizardStatus] = useState<string | null>(null);

  const loadMatters = useCallback(async () => {
    setMatters(await apiFetch<Matter[]>('/matters'));
  }, []);

  const loadDrafts = useCallback(async () => {
    const rows = await apiFetch<IntakeDraftSummary[]>('/matters/intake-wizard/drafts');
    setDrafts(rows);
    setSelectedDraftId((current) => current || rows[0]?.id || '');
  }, []);

  useEffect(() => {
    Promise.all([loadMatters(), loadDrafts()]).catch(() => undefined);
  }, [loadDrafts, loadMatters]);

  async function createMatter(e: FormEvent) {
    e.preventDefault();
    await apiFetch('/matters', {
      method: 'POST',
      body: JSON.stringify({ matterNumber, name, practiceArea }),
    });
    await loadMatters();
  }

  function buildIntakePayload() {
    return {
      matterNumber: `${matterNumber}-INTAKE`,
      name: `${name} (Intake)`,
      practiceArea,
      property: {
        addressLine1: propertyAddress,
        city: propertyCity,
        state: propertyState,
        parcelNumber,
      },
      contract: {
        contractDate,
        contractPrice: Number(contractPrice),
      },
      defects: [
        {
          category: defectCategory,
          severity: defectSeverity,
          description: defectDescription,
        },
      ],
      damages: [
        {
          category: damageCategory,
          repairEstimate: Number(repairEstimate),
        },
      ],
      liens: [
        {
          claimantName: lienClaimantName,
          amount: Number(lienAmount),
          status: lienStatus,
        },
      ],
      insuranceClaims: [
        {
          claimNumber,
          policyNumber,
          insurerName,
          adjusterName,
          status: 'OPEN',
        },
      ],
      expertEngagements: [
        {
          expertName,
          scope: expertScope,
          status: 'ENGAGED',
        },
      ],
      milestones: milestoneName ? [{ name: milestoneName, status: 'OPEN' }] : [],
    };
  }

  function applyIntakePayload(payload: any) {
    if (!payload || typeof payload !== 'object') return;

    setMatterNumber((payload.matterNumber || '').replace(/-INTAKE$/, '') || matterNumber);
    setName((payload.name || '').replace(/\s+\(Intake\)$/, '') || name);
    setPracticeArea(payload.practiceArea || practiceArea);

    setPropertyAddress(payload.property?.addressLine1 || propertyAddress);
    setPropertyCity(payload.property?.city || propertyCity);
    setPropertyState(payload.property?.state || propertyState);
    setParcelNumber(payload.property?.parcelNumber || parcelNumber);

    setContractDate(payload.contract?.contractDate || contractDate);
    if (payload.contract?.contractPrice !== undefined && payload.contract?.contractPrice !== null) {
      setContractPrice(String(payload.contract.contractPrice));
    }

    const defect = payload.defects?.[0] || {};
    setDefectCategory(defect.category || defectCategory);
    setDefectSeverity(defect.severity || defectSeverity);
    setDefectDescription(defect.description || defectDescription);

    const damage = payload.damages?.[0] || {};
    setDamageCategory(damage.category || damageCategory);
    if (damage.repairEstimate !== undefined && damage.repairEstimate !== null) {
      setRepairEstimate(String(damage.repairEstimate));
    }

    const lien = payload.liens?.[0] || {};
    setLienClaimantName(lien.claimantName || lienClaimantName);
    if (lien.amount !== undefined && lien.amount !== null) {
      setLienAmount(String(lien.amount));
    }
    setLienStatus(lien.status || lienStatus);

    const claim = payload.insuranceClaims?.[0] || {};
    setClaimNumber(claim.claimNumber || claimNumber);
    setPolicyNumber(claim.policyNumber || policyNumber);
    setInsurerName(claim.insurerName || insurerName);
    setAdjusterName(claim.adjusterName || adjusterName);

    const expert = payload.expertEngagements?.[0] || {};
    setExpertName(expert.expertName || expertName);
    setExpertScope(expert.scope || expertScope);

    const milestone = payload.milestones?.[0] || {};
    setMilestoneName(milestone.name || milestoneName);
  }

  async function saveIntakeDraft() {
    const result = await apiFetch<{ id: string; savedAt: string }>('/matters/intake-wizard/drafts', {
      method: 'POST',
      body: JSON.stringify({
        draftId: selectedDraftId || undefined,
        payload: buildIntakePayload(),
      }),
    });
    await loadDrafts();
    setSelectedDraftId(result.id);
    setWizardStatus(`Draft saved at ${new Date(result.savedAt).toLocaleString()}`);
  }

  async function resumeDraft() {
    if (!selectedDraftId) return;
    const draft = await apiFetch<{ id: string; savedAt: string; payload: any }>(`/matters/intake-wizard/drafts/${selectedDraftId}`);
    applyIntakePayload(draft.payload);
    setWizardStatus(`Draft loaded from ${new Date(draft.savedAt).toLocaleString()}`);
  }

  async function createViaIntakeWizard() {
    await apiFetch('/matters/intake-wizard', {
      method: 'POST',
      body: JSON.stringify(buildIntakePayload()),
    });
    setWizardStatus('Matter created from intake wizard.');
    await loadMatters();
  }

  return (
    <AppShell>
      <PageHeader title="Matters" subtitle="Dashboard-ready matters with participants, timeline, billing, docs, AI workspace, and full construction intake." />

      <div className="card" style={{ marginBottom: 14 }}>
        <form onSubmit={createMatter} style={{ display: 'grid', gap: 10, gridTemplateColumns: '180px 1fr 1fr 120px' }}>
          <input className="input" value={matterNumber} onChange={(e) => setMatterNumber(e.target.value)} placeholder="Matter #" />
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Matter Name" />
          <input className="input" value={practiceArea} onChange={(e) => setPracticeArea(e.target.value)} placeholder="Practice Area" />
          <button className="button" type="submit">Create</button>
        </form>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <h3 style={{ marginTop: 0 }}>Construction Intake Wizard</h3>
        <div style={{ display: 'grid', gap: 10, gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
          <input className="input" value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} placeholder="Property address" />
          <input className="input" value={propertyCity} onChange={(e) => setPropertyCity(e.target.value)} placeholder="City" />
          <input className="input" value={propertyState} onChange={(e) => setPropertyState(e.target.value)} placeholder="State" />
          <input className="input" value={parcelNumber} onChange={(e) => setParcelNumber(e.target.value)} placeholder="Parcel/APN" />
          <input className="input" value={contractDate} onChange={(e) => setContractDate(e.target.value)} placeholder="Contract date (YYYY-MM-DD)" />
          <input className="input" value={contractPrice} onChange={(e) => setContractPrice(e.target.value)} placeholder="Contract price" />
          <input className="input" value={defectCategory} onChange={(e) => setDefectCategory(e.target.value)} placeholder="Defect category" />
          <input className="input" value={defectSeverity} onChange={(e) => setDefectSeverity(e.target.value)} placeholder="Defect severity" />
          <input className="input" value={defectDescription} onChange={(e) => setDefectDescription(e.target.value)} placeholder="Defect description" />
          <input className="input" value={damageCategory} onChange={(e) => setDamageCategory(e.target.value)} placeholder="Damages category" />
          <input className="input" value={repairEstimate} onChange={(e) => setRepairEstimate(e.target.value)} placeholder="Repair estimate" />
          <input className="input" value={lienClaimantName} onChange={(e) => setLienClaimantName(e.target.value)} placeholder="Lien claimant name" />
          <input className="input" value={lienAmount} onChange={(e) => setLienAmount(e.target.value)} placeholder="Lien amount" />
          <input className="input" value={lienStatus} onChange={(e) => setLienStatus(e.target.value)} placeholder="Lien status" />
          <input className="input" value={claimNumber} onChange={(e) => setClaimNumber(e.target.value)} placeholder="Claim number" />
          <input className="input" value={policyNumber} onChange={(e) => setPolicyNumber(e.target.value)} placeholder="Policy number" />
          <input className="input" value={insurerName} onChange={(e) => setInsurerName(e.target.value)} placeholder="Insurer name" />
          <input className="input" value={adjusterName} onChange={(e) => setAdjusterName(e.target.value)} placeholder="Adjuster name" />
          <input className="input" value={expertName} onChange={(e) => setExpertName(e.target.value)} placeholder="Expert name" />
          <input className="input" value={expertScope} onChange={(e) => setExpertScope(e.target.value)} placeholder="Expert scope" />
          <input className="input" value={milestoneName} onChange={(e) => setMilestoneName(e.target.value)} placeholder="Project milestone" />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto auto', gap: 10, marginTop: 12 }}>
          <select
            className="input"
            value={selectedDraftId}
            onChange={(e) => setSelectedDraftId(e.target.value)}
            aria-label="Intake draft selector"
          >
            <option value="">Select draft...</option>
            {drafts.map((draft) => (
              <option key={draft.id} value={draft.id}>
                {draft.label}
              </option>
            ))}
          </select>
          <button className="button ghost" type="button" onClick={saveIntakeDraft}>Save Intake Draft</button>
          <button className="button ghost" type="button" onClick={resumeDraft} disabled={!selectedDraftId}>Resume Draft</button>
          <button className="button secondary" type="button" onClick={createViaIntakeWizard}>Create via Intake Wizard</button>
        </div>
        {wizardStatus ? (
          <div style={{ marginTop: 10 }}>
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
                  <Link href={`/matters/${matter.id}`}>{matter.matterNumber}</Link>
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

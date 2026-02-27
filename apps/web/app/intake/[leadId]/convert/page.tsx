'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '../../../../components/app-shell';
import { PageHeader } from '../../../../components/page-header';
import { StageNav } from '../../../../components/intake/stage-nav';
import { Checklist, convertLead, getSetupChecklist } from '../../../../lib/intake/leads-api';

export default function LeadConvertPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params.leadId;
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [name, setName] = useState('Kitchen Remodel Defect - Intake Conversion');
  const [matterNumber, setMatterNumber] = useState('M-2026-INT-001');
  const [practiceArea, setPracticeArea] = useState('Construction Litigation');
  const [status, setStatus] = useState('');

  useEffect(() => {
    getSetupChecklist(leadId).then(setChecklist).catch(() => undefined);
  }, [leadId]);

  async function onConvert() {
    const matter = await convertLead(leadId, { name, matterNumber, practiceArea });
    setStatus(`Matter ${matter.id} created. Conversion logged at ${new Date().toLocaleString()}.`);
  }

  return (
    <AppShell>
      <PageHeader title="Lead Conversion" subtitle="Confirm setup checklist and convert lead to matter." />
      <StageNav leadId={leadId} active="convert" />
      <div className="card inline-stack">
        <table className="table">
          <thead>
            <tr><th>Checkpoint</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr><td>Intake Draft</td><td>{checklist?.intakeDraft ? 'Complete' : 'Pending'}</td></tr>
            <tr><td>Conflict Resolved</td><td>{checklist?.conflictResolved ? 'Complete' : 'Pending'}</td></tr>
            <tr><td>Engagement Signed</td><td>{checklist?.engagementSigned ? 'Complete' : 'Pending'}</td></tr>
            <tr><td>Ready To Convert</td><td>{checklist?.readyToConvert ? 'Yes' : 'No'}</td></tr>
          </tbody>
        </table>
        <div>
          <label htmlFor="matter-name">Matter Name</label>
          <input id="matter-name" className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="matter-number">Matter Number</label>
          <input id="matter-number" className="input" value={matterNumber} onChange={(e) => setMatterNumber(e.target.value)} />
        </div>
        <div>
          <label htmlFor="practice-area">Practice Area</label>
          <input id="practice-area" className="input" value={practiceArea} onChange={(e) => setPracticeArea(e.target.value)} />
        </div>
        <button className="button" type="button" onClick={onConvert}>Convert Lead</button>
        {status ? <p className="mono-meta">{status}</p> : null}
      </div>
    </AppShell>
  );
}

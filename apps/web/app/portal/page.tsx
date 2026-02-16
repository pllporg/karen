'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { apiFetch } from '../../lib/api';

export default function PortalPage() {
  const [snapshot, setSnapshot] = useState<any>(null);
  const [matterId, setMatterId] = useState('');
  const [message, setMessage] = useState('Can you share the latest mediation timeline?');
  const [intakeFormDefinitionId, setIntakeFormDefinitionId] = useState('');
  const [engagementLetterTemplateId, setEngagementLetterTemplateId] = useState('');

  useEffect(() => {
    apiFetch('/portal/snapshot').then(setSnapshot).catch(() => undefined);
  }, []);

  async function sendPortalMessage(e: FormEvent) {
    e.preventDefault();
    if (!matterId) return;
    await apiFetch('/portal/messages', {
      method: 'POST',
      body: JSON.stringify({ matterId, body: message }),
    });
    setSnapshot(await apiFetch('/portal/snapshot'));
  }

  async function submitIntake() {
    if (!intakeFormDefinitionId) return;
    await apiFetch('/portal/intake-submissions', {
      method: 'POST',
      body: JSON.stringify({
        intakeFormDefinitionId,
        matterId: matterId || undefined,
        data: { homeownerGoal: 'Resolve defect damages and warranty claims' },
      }),
    });
  }

  async function createEsignStub() {
    if (!engagementLetterTemplateId) return;
    await apiFetch('/portal/esign', {
      method: 'POST',
      body: JSON.stringify({
        engagementLetterTemplateId,
        matterId: matterId || undefined,
      }),
    });
  }

  return (
    <AppShell>
      <PageHeader title="Client Portal" subtitle="Portal-only experience: matter status, dates, invoices/payments, secure messages, shared docs." />
      <div className="card-grid">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Matters</h3>
          <p>{snapshot?.matters?.length || 0} visible matters</p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Key Dates</h3>
          <p>{snapshot?.keyDates?.length || 0} upcoming dates</p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Invoices</h3>
          <p>{snapshot?.invoices?.length || 0} invoices</p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Shared Documents</h3>
          <p>{snapshot?.documents?.length || 0} shared docs</p>
        </div>
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginTop: 0 }}>Secure Message</h3>
          <form onSubmit={sendPortalMessage} style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 2fr auto' }}>
            <input className="input" value={matterId} onChange={(e) => setMatterId(e.target.value)} placeholder="Matter ID" />
            <input className="input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" />
            <button className="button" type="submit">Send</button>
          </form>
        </div>
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginTop: 0 }}>Intake + E-Sign Stubs</h3>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr auto' }}>
            <input className="input" value={intakeFormDefinitionId} onChange={(e) => setIntakeFormDefinitionId(e.target.value)} placeholder="Intake Form Definition ID" />
            <button className="button ghost" onClick={submitIntake}>Submit Intake</button>
            <input className="input" value={engagementLetterTemplateId} onChange={(e) => setEngagementLetterTemplateId(e.target.value)} placeholder="Engagement Letter Template ID" />
            <button className="button ghost" onClick={createEsignStub}>Create E-Sign Envelope</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

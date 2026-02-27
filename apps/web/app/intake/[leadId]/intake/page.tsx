'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { AppShell } from '../../../../components/app-shell';
import { PageHeader } from '../../../../components/page-header';
import { StageNav } from '../../../../components/intake/stage-nav';
import { createIntakeDraft } from '../../../../lib/intake/leads-api';
import { defaultIntakeWizardForm } from '../../../../lib/intake/intake-wizard-adapter';

export default function LeadIntakeDraftPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params.leadId;
  const [form, setForm] = useState(defaultIntakeWizardForm);
  const [status, setStatus] = useState('');

  async function submitDraft() {
    const result = await createIntakeDraft(leadId, form);
    setStatus(`Intake draft ${result.id} recorded at ${new Date().toLocaleString()}.`);
  }

  return (
    <AppShell>
      <PageHeader title="Lead Intake Draft" subtitle="Record intake payload. Stage transitions are managed by Leads API." />
      <StageNav leadId={leadId} active="intake" />
      <div className="card inline-stack">
        <table className="table">
          <thead>
            <tr><th>Field</th><th>Value</th></tr>
          </thead>
          <tbody>
            {Object.entries(form).map(([key, value]) => (
              <tr key={key}>
                <td className="mono-meta">{key}</td>
                <td>
                  <input className="input" value={value} onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value }))} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="button" type="button" onClick={submitDraft}>Submit Intake Draft</button>
        {status ? <p className="mono-meta">{status}</p> : null}
      </div>
    </AppShell>
  );
}

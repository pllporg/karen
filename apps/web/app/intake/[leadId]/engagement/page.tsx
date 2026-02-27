'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AppShell } from '../../../../components/app-shell';
import { PageHeader } from '../../../../components/page-header';
import { StageNav } from '../../../../components/intake/stage-nav';
import { generateEngagement, sendEngagement } from '../../../../lib/intake/leads-api';

export default function LeadEngagementPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params.leadId;
  const [templateId, setTemplateId] = useState('engagement-template-standard');
  const [envelopeId, setEnvelopeId] = useState('');
  const [status, setStatus] = useState('');

  async function onGenerate() {
    const envelope = await generateEngagement(leadId, templateId);
    setEnvelopeId(envelope.id);
    setStatus(`Engagement envelope ${envelope.id} generated.`);
  }

  async function onSend() {
    if (!envelopeId) return;
    const envelope = await sendEngagement(leadId, envelopeId);
    setStatus(`Engagement envelope ${envelope.id} sent at ${new Date().toLocaleString()}.`);
  }

  return (
    <AppShell>
      <PageHeader title="Engagement Routing" subtitle="Generate and send the engagement packet after conflict resolution." />
      <StageNav leadId={leadId} active="engagement" />
      <div className="card inline-stack">
        <div>
          <label htmlFor="template-id">Template ID</label>
          <input id="template-id" className="input" value={templateId} onChange={(e) => setTemplateId(e.target.value)} />
        </div>
        <button className="button" type="button" onClick={onGenerate}>Generate Envelope</button>
        <div>
          <label htmlFor="envelope-id">Envelope ID</label>
          <input id="envelope-id" className="input" value={envelopeId} onChange={(e) => setEnvelopeId(e.target.value)} />
        </div>
        <button className="button secondary" type="button" onClick={onSend} disabled={!envelopeId}>Send Envelope</button>
        {status ? <p className="mono-meta">{status}</p> : null}
      </div>
    </AppShell>
  );
}

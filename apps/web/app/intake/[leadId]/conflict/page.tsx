'use client';

import { useParams } from 'next/navigation';
import { useState } from 'react';
import { AppShell } from '../../../../components/app-shell';
import { PageHeader } from '../../../../components/page-header';
import { StageNav } from '../../../../components/intake/stage-nav';
import { resolveConflict, runConflictCheck } from '../../../../lib/intake/leads-api';

export default function LeadConflictPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params.leadId;
  const [queryText, setQueryText] = useState('Client name + opposing party + property address');
  const [resolutionNotes, setResolutionNotes] = useState('No direct conflicts identified.');
  const [status, setStatus] = useState('');

  async function onRunCheck() {
    const result = await runConflictCheck(leadId, queryText);
    setStatus(`Conflict check ${result.id} logged at ${new Date().toLocaleString()}.`);
  }

  async function onResolve(resolved: boolean) {
    const result = await resolveConflict(leadId, resolved, resolutionNotes);
    setStatus(`Conflict resolution recorded (${resolved ? 'resolved' : 'blocked'}) via ${result.id}.`);
  }

  return (
    <AppShell>
      <PageHeader title="Conflict Check" subtitle="Run and document conflict review before engagement routing." />
      <StageNav leadId={leadId} active="conflict" />
      <div className="card inline-stack">
        <div>
          <label htmlFor="conflict-query">Conflict Query</label>
          <textarea id="conflict-query" className="textarea" value={queryText} onChange={(e) => setQueryText(e.target.value)} />
        </div>
        <button className="button" type="button" onClick={onRunCheck}>Run Conflict Check</button>
        <div>
          <label htmlFor="resolution-notes">Resolution Notes</label>
          <textarea id="resolution-notes" className="textarea" value={resolutionNotes} onChange={(e) => setResolutionNotes(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="button secondary" type="button" onClick={() => onResolve(true)}>Mark Resolved</button>
          <button className="button danger" type="button" onClick={() => onResolve(false)}>Mark Blocked</button>
        </div>
        {status ? <p className="mono-meta">{status}</p> : null}
      </div>
    </AppShell>
  );
}

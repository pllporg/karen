'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../components/app-shell';
import { PageHeader } from '../../../components/page-header';
import { createLead } from '../../../lib/intake/leads-api';

export default function IntakeNewLeadPage() {
  const router = useRouter();
  const [source, setSource] = useState('Website Form');
  const [notes, setNotes] = useState('Initial queue intake created.');
  const [status, setStatus] = useState('');

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const lead = await createLead({ source, notes });
    setStatus(`Lead ${lead.id} created at ${new Date(lead.createdAt).toLocaleString()}.`);
    router.push(`/intake/${lead.id}/intake`);
  }

  return (
    <AppShell>
      <PageHeader title="Create Intake Lead" subtitle="Register lead metadata before staged routing." />
      <form className="card inline-stack" onSubmit={onSubmit}>
        <div>
          <label htmlFor="lead-source">Lead Source</label>
          <input id="lead-source" className="input" value={source} onChange={(e) => setSource(e.target.value)} required />
        </div>
        <div>
          <label htmlFor="lead-notes">Processing Notes</label>
          <textarea id="lead-notes" className="textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
        <button className="button" type="submit">Create Lead and Open Intake</button>
        {status ? <p className="mono-meta">{status}</p> : null}
      </form>
    </AppShell>
  );
}

'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { apiFetch, getSessionToken } from '../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function PortalPage() {
  const [snapshot, setSnapshot] = useState<any>(null);
  const [matterId, setMatterId] = useState('');
  const [message, setMessage] = useState('Can you share the latest mediation timeline?');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentTitle, setAttachmentTitle] = useState('');
  const [intakeFormDefinitionId, setIntakeFormDefinitionId] = useState('');
  const [engagementLetterTemplateId, setEngagementLetterTemplateId] = useState('');
  const [eSignProvider, setEsignProvider] = useState('stub');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch('/portal/snapshot').then(setSnapshot).catch(() => undefined);
  }, []);

  async function sendPortalMessage(e: FormEvent) {
    e.preventDefault();
    if (!matterId) return;
    setError(null);

    let attachmentVersionIds: string[] | undefined;
    if (attachmentFile) {
      const form = new FormData();
      form.set('matterId', matterId);
      form.set('title', attachmentTitle.trim() || attachmentFile.name);
      form.set('file', attachmentFile);

      const token = getSessionToken();
      const uploadResponse = await fetch(`${API_BASE}/portal/attachments/upload`, {
        method: 'POST',
        body: form,
        headers: token ? { 'x-session-token': token } : undefined,
        credentials: 'include',
      });

      if (!uploadResponse.ok) {
        setError(await uploadResponse.text());
        return;
      }

      const uploaded = await uploadResponse.json();
      attachmentVersionIds = uploaded?.version?.id ? [uploaded.version.id] : undefined;
    }

    await apiFetch('/portal/messages', {
      method: 'POST',
      body: JSON.stringify({
        matterId,
        body: message,
        ...(attachmentVersionIds?.length ? { attachmentVersionIds } : {}),
      }),
    });

    setAttachmentFile(null);
    setAttachmentTitle('');
    setSnapshot(await apiFetch('/portal/snapshot'));
  }

  async function downloadPortalAttachment(versionId: string) {
    const result = await apiFetch<{ url: string }>(`/portal/attachments/${versionId}/download-url`);
    if (typeof window !== 'undefined') {
      window.open(result.url, '_blank', 'noopener,noreferrer');
    }
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
    setSnapshot(await apiFetch('/portal/snapshot'));
  }

  async function createEsignEnvelope() {
    if (!engagementLetterTemplateId) return;
    await apiFetch('/portal/esign', {
      method: 'POST',
      body: JSON.stringify({
        engagementLetterTemplateId,
        matterId: matterId || undefined,
        provider: eSignProvider,
      }),
    });
    setSnapshot(await apiFetch('/portal/snapshot'));
  }

  async function refreshEsignEnvelope(envelopeId: string) {
    await apiFetch(`/portal/esign/${envelopeId}/refresh`, {
      method: 'POST',
    });
    setSnapshot(await apiFetch('/portal/snapshot'));
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
        <div className="card">
          <h3 style={{ marginTop: 0 }}>E-Sign Envelopes</h3>
          <p>{snapshot?.eSignEnvelopes?.length || 0} envelopes</p>
        </div>
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginTop: 0 }}>Secure Message</h3>
          <form
            onSubmit={sendPortalMessage}
            style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 2fr 1fr 1fr auto' }}
          >
            <input className="input" value={matterId} onChange={(e) => setMatterId(e.target.value)} placeholder="Matter ID" />
            <input className="input" value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message" />
            <input
              className="input"
              value={attachmentTitle}
              onChange={(e) => setAttachmentTitle(e.target.value)}
              placeholder="Attachment Title (optional)"
            />
            <input
              aria-label="Attachment File"
              className="input"
              type="file"
              onChange={(e) => setAttachmentFile(e.target.files?.[0] || null)}
            />
            <button className="button" type="submit">Send</button>
          </form>
          {error ? <p style={{ color: 'var(--lic-red)', marginTop: 8 }}>{error}</p> : null}
        </div>
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginTop: 0 }}>Shared Documents</h3>
          {(snapshot?.documents || []).length === 0 ? <p>No shared documents yet.</p> : null}
          {(snapshot?.documents || []).map((doc: any) => (
            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <strong>{doc.title}</strong>
                <div style={{ fontSize: 12, opacity: 0.75 }}>Matter {doc.matterId}</div>
              </div>
              {doc.latestVersion?.id ? (
                <button
                  className="button ghost"
                  type="button"
                  onClick={() => downloadPortalAttachment(doc.latestVersion.id)}
                >
                  Download
                </button>
              ) : null}
            </div>
          ))}
        </div>
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginTop: 0 }}>Portal Messages</h3>
          {(snapshot?.messages || []).length === 0 ? <p>No portal messages yet.</p> : null}
          {(snapshot?.messages || []).map((entry: any) => (
            <div key={entry.id} style={{ marginBottom: 12 }}>
              <div style={{ fontWeight: 600 }}>{entry.subject || 'Portal message'}</div>
              <div style={{ marginTop: 4 }}>{entry.body}</div>
              {(entry.attachments || []).map((attachment: any) => (
                <button
                  key={attachment.documentVersionId}
                  className="button ghost"
                  type="button"
                  style={{ marginTop: 8, marginRight: 8 }}
                  onClick={() => downloadPortalAttachment(attachment.documentVersionId)}
                >
                  Download {attachment.title}
                </button>
              ))}
            </div>
          ))}
        </div>
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginTop: 0 }}>Intake + E-Sign</h3>
          <div style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr auto' }}>
            <input className="input" value={intakeFormDefinitionId} onChange={(e) => setIntakeFormDefinitionId(e.target.value)} placeholder="Intake Form Definition ID" />
            <button className="button ghost" onClick={submitIntake}>Submit Intake</button>
            <input className="input" value={engagementLetterTemplateId} onChange={(e) => setEngagementLetterTemplateId(e.target.value)} placeholder="Engagement Letter Template ID" />
            <select
              className="select"
              aria-label="E-Sign Provider"
              value={eSignProvider}
              onChange={(e) => setEsignProvider(e.target.value)}
            >
              <option value="stub">Stub Provider</option>
              <option value="sandbox">Sandbox Provider</option>
            </select>
            <button className="button ghost" onClick={createEsignEnvelope}>Create E-Sign Envelope</button>
          </div>
          <div style={{ marginTop: 12 }}>
            {(snapshot?.eSignEnvelopes || []).length === 0 ? <p>No e-sign envelopes yet.</p> : null}
            {(snapshot?.eSignEnvelopes || []).map((envelope: any) => (
              <div key={envelope.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <div>
                  <strong>{envelope.engagementLetterTemplate?.name || 'Engagement Letter'}</strong>
                  <div style={{ fontSize: 12, opacity: 0.75 }}>
                    Status: {envelope.status} | Provider: {envelope.provider}
                  </div>
                </div>
                <button className="button ghost" type="button" onClick={() => refreshEsignEnvelope(envelope.id)}>
                  Refresh Status
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { ConfirmDialog } from '../../components/confirm-dialog';
import { PageHeader } from '../../components/page-header';
import { apiFetch, getSessionToken } from '../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
type PortalConfirmAction = 'send-message' | 'create-esign' | null;
type PortalMatterOption = { id: string; matterNumber?: string | null; name?: string | null };
type PortalLookupOption = { id: string; name: string };
type PortalSnapshotDocument = {
  id: string;
  matterId?: string | null;
  title?: string | null;
  sharedAt?: string | null;
  updatedAt?: string | null;
  latestVersion?: { id?: string | null } | null;
};

function formatPortalMatterLabel(matter: PortalMatterOption | null | undefined): string {
  if (!matter) return 'Matter';
  const matterNumber = matter.matterNumber?.trim();
  const name = matter.name?.trim();
  if (matterNumber && name) return `${matterNumber} - ${name}`;
  if (name) return name;
  if (matterNumber) return matterNumber;
  return 'Matter';
}

function formatPortalDocumentMetadata(
  document: PortalSnapshotDocument,
  matterLabelById: Map<string, string>,
): string {
  const matterLabel = document.matterId ? matterLabelById.get(document.matterId) || 'Matter' : 'Matter';
  const timestampValue = document.sharedAt || document.updatedAt;
  if (!timestampValue) return matterLabel;
  const sharedAt = new Date(timestampValue);
  if (Number.isNaN(sharedAt.getTime())) return matterLabel;
  return `${matterLabel} | Shared ${sharedAt.toLocaleString()}`;
}

export default function PortalPage() {
  const [snapshot, setSnapshot] = useState<any>(null);
  const [matterOptions, setMatterOptions] = useState<PortalMatterOption[]>([]);
  const [intakeFormOptions, setIntakeFormOptions] = useState<PortalLookupOption[]>([]);
  const [engagementTemplateOptions, setEngagementTemplateOptions] = useState<PortalLookupOption[]>([]);
  const [matterId, setMatterId] = useState('');
  const [message, setMessage] = useState('Can you share the latest mediation timeline?');
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentTitle, setAttachmentTitle] = useState('');
  const [intakeFormDefinitionId, setIntakeFormDefinitionId] = useState('');
  const [engagementLetterTemplateId, setEngagementLetterTemplateId] = useState('');
  const [eSignProvider, setEsignProvider] = useState('stub');
  const [error, setError] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<PortalConfirmAction>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const matterLabelById = useMemo(
    () => new Map(matterOptions.map((matter) => [matter.id, formatPortalMatterLabel(matter)])),
    [matterOptions],
  );

  const loadPortalData = useCallback(async () => {
    const [nextSnapshot, nextIntakeForms, nextTemplates] = await Promise.all([
      apiFetch<any>('/portal/snapshot'),
      apiFetch<PortalLookupOption[]>('/portal/intake-form-definitions').catch(() => []),
      apiFetch<PortalLookupOption[]>('/portal/engagement-letter-templates').catch(() => []),
    ]);
    const matters = Array.isArray(nextSnapshot?.matters) ? nextSnapshot.matters : [];
    setSnapshot(nextSnapshot);
    setMatterOptions(matters);
    setIntakeFormOptions(Array.isArray(nextIntakeForms) ? nextIntakeForms : []);
    setEngagementTemplateOptions(Array.isArray(nextTemplates) ? nextTemplates : []);
    setMatterId((current) => current || matters[0]?.id || '');
    setIntakeFormDefinitionId((current) => current || nextIntakeForms[0]?.id || '');
    setEngagementLetterTemplateId((current) => current || nextTemplates[0]?.id || '');
  }, []);

  useEffect(() => {
    loadPortalData().catch(() => undefined);
  }, [loadPortalData]);

  async function sendPortalMessage(e: FormEvent) {
    e.preventDefault();
    if (!matterId) return;
    setConfirmAction('send-message');
  }

  async function executeSendPortalMessage() {
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
    await loadPortalData();
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
    await loadPortalData();
  }

  async function createEsignEnvelope() {
    if (!engagementLetterTemplateId) return;
    setConfirmAction('create-esign');
  }

  async function executeCreateEsignEnvelope() {
    if (!engagementLetterTemplateId) return;
    await apiFetch('/portal/esign', {
      method: 'POST',
      body: JSON.stringify({
        engagementLetterTemplateId,
        matterId: matterId || undefined,
        provider: eSignProvider,
      }),
    });
    await loadPortalData();
  }

  async function confirmClientAction() {
    setConfirmBusy(true);
    try {
      if (confirmAction === 'send-message') {
        await executeSendPortalMessage();
      }
      if (confirmAction === 'create-esign') {
        await executeCreateEsignEnvelope();
      }
      setConfirmAction(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to complete client-facing action');
      setConfirmAction(null);
    } finally {
      setConfirmBusy(false);
    }
  }

  async function refreshEsignEnvelope(envelopeId: string) {
    await apiFetch(`/portal/esign/${envelopeId}/refresh`, {
      method: 'POST',
    });
    await loadPortalData();
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
            <select
              className="select"
              aria-label="Portal Matter"
              value={matterId}
              onChange={(e) => setMatterId(e.target.value)}
            >
              <option value="">Select matter</option>
              {matterOptions.map((matter) => (
                <option key={matter.id} value={matter.id}>
                  {formatPortalMatterLabel(matter)}
                </option>
              ))}
            </select>
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
            <button className="button" type="submit" disabled={confirmBusy}>
              Send
            </button>
          </form>
          {error ? <p style={{ color: 'var(--lic-red)', marginTop: 8 }}>{error}</p> : null}
          <p className="mono-meta" style={{ marginTop: 8 }}>
            External client sends require explicit approval and are logged in audit history.
          </p>
        </div>
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginTop: 0 }}>Shared Documents</h3>
          {(snapshot?.documents || []).length === 0 ? <p>No shared documents yet.</p> : null}
          {(snapshot?.documents || []).map((doc: any) => (
            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div>
                <strong>{doc.title}</strong>
                <div style={{ fontSize: 12, opacity: 0.75 }}>
                  {formatPortalDocumentMetadata(doc as PortalSnapshotDocument, matterLabelById)}
                </div>
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
            <select
              className="select"
              aria-label="Portal Intake Form"
              value={intakeFormDefinitionId}
              onChange={(e) => setIntakeFormDefinitionId(e.target.value)}
            >
              <option value="">Select intake form</option>
              {intakeFormOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <button className="button ghost" type="button" onClick={submitIntake}>
              Submit Intake
            </button>
            <select
              className="select"
              aria-label="Portal Engagement Template"
              value={engagementLetterTemplateId}
              onChange={(e) => setEngagementLetterTemplateId(e.target.value)}
            >
              <option value="">Select engagement template</option>
              {engagementTemplateOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
            <select
              className="select"
              aria-label="E-Sign Provider"
              value={eSignProvider}
              onChange={(e) => setEsignProvider(e.target.value)}
            >
              <option value="stub">Stub Provider</option>
              <option value="sandbox">Sandbox Provider</option>
            </select>
            <button className="button ghost" type="button" onClick={createEsignEnvelope} disabled={confirmBusy}>
              Create E-Sign Envelope
            </button>
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
      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction === 'create-esign' ? 'Confirm E-Sign Envelope Dispatch' : 'Confirm Client Message Send'}
        description={
          confirmAction === 'create-esign'
            ? 'Approving this action dispatches an external envelope workflow to the selected provider and cannot be silently undone.'
            : 'Approving this action sends the portal message to the client for matter review. Verify content and attachments before proceeding.'
        }
        confirmLabel="Approve Send"
        cancelLabel="Return to Review"
        busy={confirmBusy}
        onCancel={() => {
          if (!confirmBusy) setConfirmAction(null);
        }}
        onConfirm={confirmClientAction}
      />
    </AppShell>
  );
}

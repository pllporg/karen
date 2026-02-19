'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { getSessionToken } from '../../lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<any[]>([]);
  const [retentionPolicies, setRetentionPolicies] = useState<any[]>([]);
  const [dispositionRuns, setDispositionRuns] = useState<any[]>([]);
  const [matterId, setMatterId] = useState('');
  const [title, setTitle] = useState('Inspection Report');
  const [file, setFile] = useState<File | null>(null);
  const [pdfMatterId, setPdfMatterId] = useState('');
  const [policyName, setPolicyName] = useState('Default 7-year retention');
  const [policyScope, setPolicyScope] = useState<'ALL_DOCUMENTS' | 'MATTER' | 'CATEGORY'>('ALL_DOCUMENTS');
  const [policyTrigger, setPolicyTrigger] = useState<'DOCUMENT_UPLOADED' | 'MATTER_CLOSED'>('DOCUMENT_UPLOADED');
  const [policyRetentionDays, setPolicyRetentionDays] = useState('2555');
  const [retentionStatus, setRetentionStatus] = useState<string | null>(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState('');

  async function loadDocuments() {
    const token = getSessionToken();
    const response = await fetch(`${API_BASE}/documents`, {
      headers: token ? { 'x-session-token': token } : {},
      credentials: 'include',
    });
    if (!response.ok) return;
    setDocuments(await response.json());
  }

  async function loadRetentionData() {
    const token = getSessionToken();
    const [policiesResponse, runsResponse] = await Promise.all([
      fetch(`${API_BASE}/documents/retention/policies`, {
        headers: token ? { 'x-session-token': token } : {},
        credentials: 'include',
      }),
      fetch(`${API_BASE}/documents/disposition/runs`, {
        headers: token ? { 'x-session-token': token } : {},
        credentials: 'include',
      }),
    ]);
    if (policiesResponse.ok) {
      const policies = await policiesResponse.json();
      setRetentionPolicies(policies);
      if (!selectedPolicyId && policies.length > 0) {
        setSelectedPolicyId(policies[0].id);
      }
    }
    if (runsResponse.ok) {
      setDispositionRuns(await runsResponse.json());
    }
  }

  useEffect(() => {
    loadDocuments().catch(() => undefined);
  }, []);

  async function upload(e: FormEvent) {
    e.preventDefault();
    if (!file || !matterId) return;

    const form = new FormData();
    form.set('matterId', matterId);
    form.set('title', title);
    form.set('file', file);

    const token = getSessionToken();
    await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: form,
      headers: token ? { 'x-session-token': token } : undefined,
      credentials: 'include',
    });

    setFile(null);
    await loadDocuments();
  }

  async function generatePdf() {
    if (!pdfMatterId) return;
    const token = getSessionToken();
    await fetch(`${API_BASE}/documents/generate-pdf`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'x-session-token': token } : {}),
      },
      body: JSON.stringify({
        matterId: pdfMatterId,
        title: 'Generated Client Letter',
        lines: ['Attorney Review Required', 'Draft letter body here.'],
      }),
      credentials: 'include',
    });
    await loadDocuments();
  }

  async function createRetentionPolicy(e: FormEvent) {
    e.preventDefault();
    const token = getSessionToken();
    const response = await fetch(`${API_BASE}/documents/retention/policies`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'x-session-token': token } : {}),
      },
      body: JSON.stringify({
        name: policyName,
        scope: policyScope,
        trigger: policyTrigger,
        retentionDays: Number(policyRetentionDays),
      }),
      credentials: 'include',
    });
    if (!response.ok) {
      setRetentionStatus('Failed to create retention policy.');
      return;
    }
    const created = await response.json();
    setRetentionStatus(`Created retention policy ${created.name}.`);
    await loadRetentionData();
    if (created?.id) {
      setSelectedPolicyId(created.id);
    }
  }

  async function assignRetentionPolicy(documentId: string) {
    if (!selectedPolicyId) {
      setRetentionStatus('Select a retention policy first.');
      return;
    }
    const token = getSessionToken();
    await fetch(`${API_BASE}/documents/${documentId}/retention-policy`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'x-session-token': token } : {}),
      },
      body: JSON.stringify({ policyId: selectedPolicyId }),
      credentials: 'include',
    });
    setRetentionStatus(`Assigned retention policy to ${documentId}.`);
    await loadDocuments();
  }

  async function placeLegalHold(documentId: string) {
    const token = getSessionToken();
    await fetch(`${API_BASE}/documents/${documentId}/legal-hold`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'x-session-token': token } : {}),
      },
      body: JSON.stringify({
        reason: 'Attorney requested preservation pending dispute resolution.',
      }),
      credentials: 'include',
    });
    setRetentionStatus(`Placed legal hold on ${documentId}.`);
    await loadDocuments();
  }

  async function releaseLegalHold(documentId: string) {
    const token = getSessionToken();
    await fetch(`${API_BASE}/documents/${documentId}/legal-hold/release`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'x-session-token': token } : {}),
      },
      body: JSON.stringify({
        reason: 'Matter hold release approved by supervising attorney.',
      }),
      credentials: 'include',
    });
    setRetentionStatus(`Released legal hold on ${documentId}.`);
    await loadDocuments();
  }

  async function createDispositionRun() {
    const token = getSessionToken();
    await fetch(`${API_BASE}/documents/disposition/runs`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'x-session-token': token } : {}),
      },
      body: JSON.stringify({
        policyId: selectedPolicyId || undefined,
      }),
      credentials: 'include',
    });
    setRetentionStatus('Created disposition run.');
    await loadRetentionData();
  }

  async function approveDispositionRun(runId: string) {
    const token = getSessionToken();
    await fetch(`${API_BASE}/documents/disposition/runs/${runId}/approve`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'x-session-token': token } : {}),
      },
      body: JSON.stringify({
        notes: 'Approved by attorney.',
      }),
      credentials: 'include',
    });
    setRetentionStatus(`Approved disposition run ${runId}.`);
    await loadRetentionData();
  }

  async function executeDispositionRun(runId: string) {
    const token = getSessionToken();
    await fetch(`${API_BASE}/documents/disposition/runs/${runId}/execute`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'x-session-token': token } : {}),
      },
      body: JSON.stringify({
        notes: 'Executed after approval.',
      }),
      credentials: 'include',
    });
    setRetentionStatus(`Executed disposition run ${runId}.`);
    await loadRetentionData();
    await loadDocuments();
  }

  return (
    <AppShell>
      <PageHeader title="Documents" subtitle="Secure upload/versioning, malware-scan hook, signed links, and share links." />
      <div className="card" style={{ marginBottom: 14 }}>
        <form onSubmit={upload} style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1fr 1fr auto' }}>
          <input className="input" placeholder="Matter ID" value={matterId} onChange={(e) => setMatterId(e.target.value)} />
          <input className="input" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input className="input" type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} />
          <button className="button" type="submit">Upload</button>
        </form>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
          <input className="input" placeholder="Matter ID for generated PDF" value={pdfMatterId} onChange={(e) => setPdfMatterId(e.target.value)} />
          <button className="button secondary" type="button" onClick={generatePdf}>Generate PDF Draft</button>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 14 }}>
        <h3 style={{ marginTop: 0 }}>Retention + Legal Hold</h3>
        <form
          onSubmit={createRetentionPolicy}
          style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 160px 180px 130px auto' }}
        >
          <input
            className="input"
            placeholder="Retention policy name"
            value={policyName}
            onChange={(e) => setPolicyName(e.target.value)}
          />
          <select className="select" aria-label="Retention Scope" value={policyScope} onChange={(e) => setPolicyScope(e.target.value as any)}>
            <option value="ALL_DOCUMENTS">All Documents</option>
            <option value="MATTER">Matter</option>
            <option value="CATEGORY">Category</option>
          </select>
          <select className="select" aria-label="Retention Trigger" value={policyTrigger} onChange={(e) => setPolicyTrigger(e.target.value as any)}>
            <option value="DOCUMENT_UPLOADED">Document Uploaded</option>
            <option value="MATTER_CLOSED">Matter Closed</option>
          </select>
          <input
            className="input"
            aria-label="Retention Days"
            placeholder="Days"
            value={policyRetentionDays}
            onChange={(e) => setPolicyRetentionDays(e.target.value)}
          />
          <button className="button" type="submit">Create Policy</button>
        </form>
        <div style={{ marginTop: 10, display: 'grid', gap: 10, gridTemplateColumns: '1fr auto auto' }}>
          <select className="select" aria-label="Retention Policy Select" value={selectedPolicyId} onChange={(e) => setSelectedPolicyId(e.target.value)}>
            <option value="">Select retention policy</option>
            {retentionPolicies.map((policy) => (
              <option key={policy.id} value={policy.id}>
                {policy.name} ({policy.scope}, {policy.retentionDays}d)
              </option>
            ))}
          </select>
          <button className="button secondary" type="button" onClick={loadRetentionData}>
            Load Retention Data
          </button>
          <button className="button secondary" type="button" onClick={createDispositionRun}>
            Create Disposition Run
          </button>
        </div>
        {retentionStatus ? <p style={{ marginTop: 10, color: 'var(--lic-text-muted)' }}>{retentionStatus}</p> : null}
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Matter</th>
              <th>Versions</th>
              <th>Shared</th>
              <th>Retention</th>
              <th>Legal Hold</th>
              <th>Disposition</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>{doc.title}</td>
                <td>{doc.matterId}</td>
                <td>{doc.versions?.length || 0}</td>
                <td>{doc.sharedWithClient ? 'Yes' : 'No'}</td>
                <td>{doc.retentionPolicy?.name || 'Unassigned'}</td>
                <td>{doc.legalHoldActive ? 'Active' : 'None'}</td>
                <td>{doc.dispositionStatus || 'ACTIVE'}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="button secondary" type="button" onClick={() => assignRetentionPolicy(doc.id)}>
                      Assign Policy
                    </button>
                    {doc.legalHoldActive ? (
                      <button className="button secondary" type="button" onClick={() => releaseLegalHold(doc.id)}>
                        Release Hold
                      </button>
                    ) : (
                      <button className="button secondary" type="button" onClick={() => placeLegalHold(doc.id)}>
                        Place Hold
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h3 style={{ marginTop: 0 }}>Disposition Runs</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Run</th>
              <th>Status</th>
              <th>Cutoff</th>
              <th>Items</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {dispositionRuns.map((run) => (
              <tr key={run.id}>
                <td>{run.id}</td>
                <td>{run.status}</td>
                <td>{new Date(run.cutoffAt).toLocaleString()}</td>
                <td>{run.items?.length || 0}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(run.status === 'DRAFT' || run.status === 'PENDING_APPROVAL') ? (
                      <button className="button secondary" type="button" onClick={() => approveDispositionRun(run.id)}>
                        Approve
                      </button>
                    ) : null}
                    {run.status === 'APPROVED' ? (
                      <button className="button secondary" type="button" onClick={() => executeDispositionRun(run.id)}>
                        Execute
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

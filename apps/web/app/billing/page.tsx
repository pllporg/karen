'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { apiFetch } from '../../lib/api';

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [trustRows, setTrustRows] = useState<any[]>([]);
  const [reconciliationRuns, setReconciliationRuns] = useState<any[]>([]);
  const [ledesProfiles, setLedesProfiles] = useState<any[]>([]);
  const [ledesJobs, setLedesJobs] = useState<any[]>([]);
  const [matterId, setMatterId] = useState('');
  const [reconciliationTrustAccountId, setReconciliationTrustAccountId] = useState('');
  const [statementStartAt, setStatementStartAt] = useState('');
  const [statementEndAt, setStatementEndAt] = useState('');
  const [reconciliationStatus, setReconciliationStatus] = useState<string | null>(null);
  const [ledesProfileName, setLedesProfileName] = useState('Default LEDES 1998B');
  const [selectedLedesProfileId, setSelectedLedesProfileId] = useState('');
  const [ledesInvoiceIds, setLedesInvoiceIds] = useState('');
  const [ledesStatus, setLedesStatus] = useState<string | null>(null);

  async function load() {
    const [invoiceData, trustData, reconciliationData, profileData, ledesJobData] = await Promise.all([
      apiFetch<any[]>('/billing/invoices'),
      apiFetch<any[]>('/billing/trust/report'),
      apiFetch<any[]>('/billing/trust/reconciliation/runs'),
      apiFetch<any[]>('/billing/ledes/profiles'),
      apiFetch<any[]>('/billing/ledes/jobs'),
    ]);
    setInvoices(invoiceData);
    setTrustRows(trustData);
    setReconciliationRuns(reconciliationData);
    setLedesProfiles(profileData);
    setLedesJobs(ledesJobData);
    setSelectedLedesProfileId((current) => {
      if (current) return current;
      const defaultProfile = profileData.find((profile) => profile.isDefault);
      return defaultProfile?.id || profileData[0]?.id || '';
    });
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function createInvoice(e: FormEvent) {
    e.preventDefault();
    if (!matterId) return;

    await apiFetch('/billing/invoices', {
      method: 'POST',
      body: JSON.stringify({
        matterId,
        lineItems: [{ description: 'Legal Services', quantity: 2, unitPrice: 425 }],
      }),
    });
    await load();
  }

  async function createReconciliationRun() {
    const payload: Record<string, string> = {};
    if (reconciliationTrustAccountId) payload.trustAccountId = reconciliationTrustAccountId;
    if (statementStartAt) payload.statementStartAt = new Date(statementStartAt).toISOString();
    if (statementEndAt) payload.statementEndAt = new Date(statementEndAt).toISOString();
    await apiFetch('/billing/trust/reconciliation/runs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setReconciliationStatus('Created reconciliation run.');
    await load();
  }

  async function submitRun(runId: string) {
    await apiFetch(`/billing/trust/reconciliation/runs/${runId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ notes: 'Submitted for attorney review.' }),
    });
    setReconciliationStatus(`Submitted run ${runId} for review.`);
    await load();
  }

  async function resolveDiscrepancy(discrepancyId: string) {
    await apiFetch(`/billing/trust/reconciliation/discrepancies/${discrepancyId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({
        status: 'RESOLVED',
        resolutionNote: 'Reconciled against source statement and ledger adjustment record.',
      }),
    });
    setReconciliationStatus(`Resolved discrepancy ${discrepancyId}.`);
    await load();
  }

  async function completeRun(runId: string) {
    await apiFetch(`/billing/trust/reconciliation/runs/${runId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ notes: 'Signed off by attorney.' }),
    });
    setReconciliationStatus(`Completed reconciliation run ${runId}.`);
    await load();
  }

  async function createLedesProfile() {
    if (!ledesProfileName.trim()) return;
    await apiFetch('/billing/ledes/profiles', {
      method: 'POST',
      body: JSON.stringify({
        name: ledesProfileName.trim(),
        format: 'LEDES98B',
        isDefault: true,
        requireUtbmsPhaseCode: true,
        requireUtbmsTaskCode: true,
        includeExpenseLineItems: true,
      }),
    });
    setLedesStatus(`Created LEDES profile "${ledesProfileName.trim()}".`);
    await load();
  }

  async function createLedesJob() {
    if (!selectedLedesProfileId) {
      setLedesStatus('Select a LEDES profile before running export.');
      return;
    }

    const invoiceIds = ledesInvoiceIds
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);

    const created = await apiFetch<any>('/billing/ledes/jobs', {
      method: 'POST',
      body: JSON.stringify({
        profileId: selectedLedesProfileId,
        invoiceIds: invoiceIds.length > 0 ? invoiceIds : undefined,
      }),
    });

    if (created.status === 'FAILED') {
      const count = created.summaryJson?.validationErrorCount || 0;
      setLedesStatus(`LEDES export validation failed (${count} issues).`);
    } else {
      setLedesStatus(`Created LEDES export job ${created.id}.`);
    }
    await load();
  }

  async function downloadLedesJob(jobId: string) {
    const result = await apiFetch<{ downloadUrl: string }>(`/billing/ledes/jobs/${jobId}/download`);
    if (typeof window !== 'undefined') {
      window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
    }
    setLedesStatus(`Generated download URL for LEDES job ${jobId}.`);
  }

  return (
    <AppShell>
      <PageHeader title="Billing & Trust" subtitle="Time/expense capture, invoice PDF, Stripe checkout links, trust ledger, and AR visibility." />
      <div className="notice" style={{ marginBottom: 14 }}>
        Jurisdiction compliance disclaimer is stored on invoices. Attorney remains responsible for trust/billing compliance.
      </div>
      <div className="card" style={{ marginBottom: 14 }}>
        <form onSubmit={createInvoice} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
          <input className="input" placeholder="Matter ID" value={matterId} onChange={(e) => setMatterId(e.target.value)} />
          <button className="button" type="submit">Create Invoice</button>
        </form>
      </div>
      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>#</th>
              <th>Matter</th>
              <th>Status</th>
              <th>Total</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.invoiceNumber}</td>
                <td>{invoice.matterId}</td>
                <td>{invoice.status}</td>
                <td>${invoice.total}</td>
                <td>${invoice.balanceDue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Trust Ledger</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Trust Account</th>
              <th>Matter</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {trustRows.map((row) => (
              <tr key={row.id}>
                <td>{row.trustAccount?.name || row.trustAccountId}</td>
                <td>{row.matter?.name || row.matterId}</td>
                <td>${row.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Trust Reconciliation Runs</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 180px 180px auto', gap: 10, marginBottom: 12 }}>
          <input
            className="input"
            placeholder="Trust Account ID (optional)"
            value={reconciliationTrustAccountId}
            onChange={(event) => setReconciliationTrustAccountId(event.target.value)}
          />
          <input
            className="input"
            type="date"
            aria-label="Statement Start"
            value={statementStartAt}
            onChange={(event) => setStatementStartAt(event.target.value)}
          />
          <input
            className="input"
            type="date"
            aria-label="Statement End"
            value={statementEndAt}
            onChange={(event) => setStatementEndAt(event.target.value)}
          />
          <button className="button secondary" type="button" onClick={createReconciliationRun}>
            Create Reconciliation Run
          </button>
        </div>
        {reconciliationStatus ? <p style={{ color: 'var(--lic-text-muted)' }}>{reconciliationStatus}</p> : null}
        <table className="table">
          <thead>
            <tr>
              <th>Run</th>
              <th>Status</th>
              <th>Period</th>
              <th>Discrepancies</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {reconciliationRuns.map((run) => (
              <tr key={run.id}>
                <td>{run.id}</td>
                <td>{run.status}</td>
                <td>
                  {new Date(run.statementStartAt).toLocaleDateString()} - {new Date(run.statementEndAt).toLocaleDateString()}
                </td>
                <td>{run.discrepancies?.length || 0}</td>
                <td>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {run.status === 'DRAFT' ? (
                      <button className="button secondary" type="button" onClick={() => submitRun(run.id)}>
                        Submit
                      </button>
                    ) : null}
                    {run.status === 'IN_REVIEW'
                      ? run.discrepancies
                          ?.filter((discrepancy: any) => discrepancy.status === 'OPEN')
                          .slice(0, 1)
                          .map((discrepancy: any) => (
                            <button
                              key={discrepancy.id}
                              className="button secondary"
                              type="button"
                              onClick={() => resolveDiscrepancy(discrepancy.id)}
                            >
                              Resolve {discrepancy.id}
                            </button>
                          ))
                      : null}
                    {run.status === 'IN_REVIEW' ? (
                      <button className="button secondary" type="button" onClick={() => completeRun(run.id)}>
                        Complete
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>LEDES / UTBMS Export</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, marginBottom: 10 }}>
          <input
            className="input"
            placeholder="New LEDES profile name"
            value={ledesProfileName}
            onChange={(event) => setLedesProfileName(event.target.value)}
          />
          <button className="button secondary" type="button" onClick={createLedesProfile}>
            Create Profile
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 10, marginBottom: 10 }}>
          <select
            className="input"
            aria-label="LEDES Profile"
            value={selectedLedesProfileId}
            onChange={(event) => setSelectedLedesProfileId(event.target.value)}
          >
            <option value="">Select LEDES profile</option>
            {ledesProfiles.map((profile) => (
              <option key={profile.id} value={profile.id}>
                {profile.name} ({profile.format}){profile.isDefault ? ' - default' : ''}
              </option>
            ))}
          </select>
          <input
            className="input"
            placeholder="Invoice IDs (comma separated, optional)"
            value={ledesInvoiceIds}
            onChange={(event) => setLedesInvoiceIds(event.target.value)}
          />
          <button className="button secondary" type="button" onClick={createLedesJob}>
            Run LEDES Export
          </button>
        </div>
        {ledesStatus ? <p style={{ color: 'var(--lic-text-muted)' }}>{ledesStatus}</p> : null}
        <table className="table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Profile</th>
              <th>Status</th>
              <th>Validation</th>
              <th>Lines</th>
              <th>Total</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {ledesJobs.map((job) => (
              <tr key={job.id}>
                <td>{job.id}</td>
                <td>{job.profile?.name || job.profileId}</td>
                <td>{job.status}</td>
                <td>{job.validationStatus || '-'}</td>
                <td>{job.lineCount}</td>
                <td>${job.totalAmount}</td>
                <td>
                  {job.status === 'COMPLETED' ? (
                    <button className="button secondary" type="button" onClick={() => downloadLedesJob(job.id)}>
                      Download
                    </button>
                  ) : (
                    <span style={{ color: 'var(--lic-text-muted)' }}>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

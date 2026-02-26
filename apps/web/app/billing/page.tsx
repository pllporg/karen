'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { apiFetch } from '../../lib/api';

type MatterLookup = {
  id: string;
  matterNumber: string;
  name: string;
  label: string;
};

type TrustAccountLookup = {
  id: string;
  name: string;
  label: string;
};

type InvoiceLookup = {
  id: string;
  invoiceNumber: string;
  label: string;
};

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [trustRows, setTrustRows] = useState<any[]>([]);
  const [reconciliationRuns, setReconciliationRuns] = useState<any[]>([]);
  const [ledesProfiles, setLedesProfiles] = useState<any[]>([]);
  const [ledesJobs, setLedesJobs] = useState<any[]>([]);
  const [matterOptions, setMatterOptions] = useState<MatterLookup[]>([]);
  const [trustAccountOptions, setTrustAccountOptions] = useState<TrustAccountLookup[]>([]);
  const [invoiceOptions, setInvoiceOptions] = useState<InvoiceLookup[]>([]);
  const [selectedMatterId, setSelectedMatterId] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState<string | null>(null);
  const [reconciliationTrustAccountId, setReconciliationTrustAccountId] = useState('');
  const [statementStartAt, setStatementStartAt] = useState('');
  const [statementEndAt, setStatementEndAt] = useState('');
  const [reconciliationStatus, setReconciliationStatus] = useState<string | null>(null);
  const [ledesProfileName, setLedesProfileName] = useState('Default LEDES 1998B');
  const [selectedLedesProfileId, setSelectedLedesProfileId] = useState('');
  const [selectedLedesInvoiceId, setSelectedLedesInvoiceId] = useState('');
  const [selectedLedesInvoiceIds, setSelectedLedesInvoiceIds] = useState<string[]>([]);
  const [ledesStatus, setLedesStatus] = useState<string | null>(null);

  async function load() {
    const [invoiceData, trustData, reconciliationData, profileData, ledesJobData, mattersData, trustLookupData, invoiceLookupData] = await Promise.all([
      apiFetch<any[]>('/billing/invoices'),
      apiFetch<any[]>('/billing/trust/report'),
      apiFetch<any[]>('/billing/trust/reconciliation/runs'),
      apiFetch<any[]>('/billing/ledes/profiles'),
      apiFetch<any[]>('/billing/ledes/jobs'),
      apiFetch<MatterLookup[]>('/lookups/matters?limit=200'),
      apiFetch<TrustAccountLookup[]>('/lookups/trust-accounts?limit=200'),
      apiFetch<InvoiceLookup[]>('/lookups/invoices?limit=200'),
    ]);
    setInvoices(invoiceData);
    setTrustRows(trustData);
    setReconciliationRuns(reconciliationData);
    setLedesProfiles(profileData);
    setLedesJobs(ledesJobData);
    setMatterOptions(mattersData);
    setTrustAccountOptions(trustLookupData);
    setInvoiceOptions(invoiceLookupData);
    setSelectedMatterId((current) => current || mattersData[0]?.id || '');
    setReconciliationTrustAccountId((current) => current || trustLookupData[0]?.id || '');
    setSelectedLedesInvoiceId((current) => current || invoiceLookupData[0]?.id || '');
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
    if (!selectedMatterId) {
      setInvoiceStatus('Select a matter before creating an invoice.');
      return;
    }

    await apiFetch('/billing/invoices', {
      method: 'POST',
      body: JSON.stringify({
        matterId: selectedMatterId,
        lineItems: [{ description: 'Legal Services', quantity: 2, unitPrice: 425 }],
      }),
    });
    setInvoiceStatus('Created invoice draft for selected matter.');
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
    setReconciliationStatus('Submitted reconciliation run for review.');
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
    setReconciliationStatus('Resolved reconciliation discrepancy.');
    await load();
  }

  async function completeRun(runId: string) {
    await apiFetch(`/billing/trust/reconciliation/runs/${runId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ notes: 'Signed off by attorney.' }),
    });
    setReconciliationStatus('Completed reconciliation run.');
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

    const invoiceIds = selectedLedesInvoiceIds.filter(Boolean);

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

  function addSelectedLedesInvoice() {
    if (!selectedLedesInvoiceId) {
      return;
    }
    setSelectedLedesInvoiceIds((current) => {
      if (current.includes(selectedLedesInvoiceId)) {
        return current;
      }
      return [...current, selectedLedesInvoiceId];
    });
  }

  function removeSelectedLedesInvoice(invoiceId: string) {
    setSelectedLedesInvoiceIds((current) => current.filter((item) => item !== invoiceId));
  }

  async function downloadLedesJob(jobId: string) {
    const result = await apiFetch<{ downloadUrl: string }>(`/billing/ledes/jobs/${jobId}/download`);
    if (typeof window !== 'undefined') {
      window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
    }
    setLedesStatus('Generated LEDES export download URL.');
  }

  function resolveMatterLabel(matterId: string | null | undefined): string {
    if (!matterId) return '-';
    return matterOptions.find((matter) => matter.id === matterId)?.label || matterId;
  }

  return (
    <AppShell>
      <PageHeader title="Billing & Trust" subtitle="Time/expense capture, invoice PDF, Stripe checkout links, trust ledger, and AR visibility." />
      <div className="notice" style={{ marginBottom: 14 }}>
        Jurisdiction compliance disclaimer is stored on invoices. Attorney remains responsible for trust/billing compliance.
      </div>
      <div className="card" style={{ marginBottom: 14 }}>
        <form onSubmit={createInvoice} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
          <select
            className="input"
            aria-label="Invoice Matter"
            value={selectedMatterId}
            onChange={(event) => setSelectedMatterId(event.target.value)}
          >
            <option value="">Select matter</option>
            {matterOptions.map((matter) => (
              <option key={matter.id} value={matter.id}>
                {matter.label}
              </option>
            ))}
          </select>
          <button className="button" type="submit">Create Invoice</button>
        </form>
        {invoiceStatus ? <p style={{ color: 'var(--lic-text-muted)', marginTop: 8 }}>{invoiceStatus}</p> : null}
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
                <td>{invoice.matter?.name || resolveMatterLabel(invoice.matterId)}</td>
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
          <select
            className="input"
            aria-label="Reconciliation Trust Account"
            value={reconciliationTrustAccountId}
            onChange={(event) => setReconciliationTrustAccountId(event.target.value)}
          >
            <option value="">All trust accounts</option>
            {trustAccountOptions.map((account) => (
              <option key={account.id} value={account.id}>
                {account.label}
              </option>
            ))}
          </select>
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
          <div style={{ display: 'flex', gap: 8 }}>
            <select
              className="input"
              aria-label="LEDES Invoice Select"
              value={selectedLedesInvoiceId}
              onChange={(event) => setSelectedLedesInvoiceId(event.target.value)}
            >
              <option value="">Select invoice (optional)</option>
              {invoiceOptions.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.label}
                </option>
              ))}
            </select>
            <button className="button secondary" type="button" onClick={addSelectedLedesInvoice}>
              Add Invoice
            </button>
          </div>
          <button className="button secondary" type="button" onClick={createLedesJob}>
            Run LEDES Export
          </button>
        </div>
        {selectedLedesInvoiceIds.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {selectedLedesInvoiceIds.map((invoiceId) => (
              <button
                key={invoiceId}
                className="button secondary"
                type="button"
                onClick={() => removeSelectedLedesInvoice(invoiceId)}
              >
                Remove {invoiceOptions.find((invoice) => invoice.id === invoiceId)?.invoiceNumber || invoiceId}
              </button>
            ))}
          </div>
        ) : null}
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

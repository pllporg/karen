'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { apiFetch } from '../../lib/api';

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [trustRows, setTrustRows] = useState<any[]>([]);
  const [reconciliationRuns, setReconciliationRuns] = useState<any[]>([]);
  const [matterId, setMatterId] = useState('');
  const [reconciliationTrustAccountId, setReconciliationTrustAccountId] = useState('');
  const [statementStartAt, setStatementStartAt] = useState('');
  const [statementEndAt, setStatementEndAt] = useState('');
  const [reconciliationStatus, setReconciliationStatus] = useState<string | null>(null);

  async function load() {
    const [invoiceData, trustData, reconciliationData] = await Promise.all([
      apiFetch<any[]>('/billing/invoices'),
      apiFetch<any[]>('/billing/trust/report'),
      apiFetch<any[]>('/billing/trust/reconciliation/runs'),
    ]);
    setInvoices(invoiceData);
    setTrustRows(trustData);
    setReconciliationRuns(reconciliationData);
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
        {reconciliationStatus ? <p style={{ color: 'var(--muted)' }}>{reconciliationStatus}</p> : null}
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
    </AppShell>
  );
}

'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { apiFetch } from '../../lib/api';

export default function BillingPage() {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [trustRows, setTrustRows] = useState<any[]>([]);
  const [matterId, setMatterId] = useState('');

  async function load() {
    const [invoiceData, trustData] = await Promise.all([
      apiFetch<any[]>('/billing/invoices'),
      apiFetch<any[]>('/billing/trust/report'),
    ]);
    setInvoices(invoiceData);
    setTrustRows(trustData);
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
    </AppShell>
  );
}

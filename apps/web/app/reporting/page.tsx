'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { apiFetch } from '../../lib/api';

export default function ReportingPage() {
  const [mattersByStage, setMattersByStage] = useState<any[]>([]);
  const [arAging, setArAging] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([apiFetch<any[]>('/reporting/matters-by-stage'), apiFetch<any[]>('/reporting/ar-aging')])
      .then(([m, a]) => {
        setMattersByStage(m);
        setArAging(a);
      })
      .catch(() => undefined);
  }, []);

  return (
    <AppShell>
      <PageHeader title="Reporting" subtitle="Matters by stage, deadlines, WIP, AR aging, and CSV export endpoints." />
      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <a className="badge" href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/reporting/csv?report=matters-by-stage`}>Export Matters by Stage CSV</a>
          <a className="badge" href={`${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000'}/reporting/csv?report=ar-aging`}>Export AR Aging CSV</a>
        </div>
      </div>
      <div className="card-grid">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Matters by Stage</h3>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {mattersByStage.map((row) => (
              <li key={row.stageId || 'na'}>{row.stageName}: {row.count}</li>
            ))}
          </ul>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>AR Aging</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Bucket</th>
                <th>Balance</th>
              </tr>
            </thead>
            <tbody>
              {arAging.map((row) => (
                <tr key={row.invoiceId}>
                  <td>{row.invoiceNumber}</td>
                  <td>{row.bucket}</td>
                  <td>${row.balanceDue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}

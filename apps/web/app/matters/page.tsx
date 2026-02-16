'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { apiFetch } from '../../lib/api';

type Matter = {
  id: string;
  matterNumber: string;
  name: string;
  practiceArea: string;
  status: string;
};

export default function MattersPage() {
  const [matters, setMatters] = useState<Matter[]>([]);
  const [matterNumber, setMatterNumber] = useState('M-2026-001');
  const [name, setName] = useState('Kitchen Remodel Defect - Ortega');
  const [practiceArea, setPracticeArea] = useState('Construction Litigation');
  const [propertyAddress, setPropertyAddress] = useState('1234 Orchard Lane');

  async function load() {
    setMatters(await apiFetch<Matter[]>('/matters'));
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function createMatter(e: FormEvent) {
    e.preventDefault();
    await apiFetch('/matters', {
      method: 'POST',
      body: JSON.stringify({ matterNumber, name, practiceArea }),
    });
    await load();
  }

  async function createViaIntakeWizard() {
    await apiFetch('/matters/intake-wizard', {
      method: 'POST',
      body: JSON.stringify({
        matterNumber: `${matterNumber}-INTAKE`,
        name: `${name} (Intake)`,
        practiceArea,
        property: { addressLine1: propertyAddress, city: 'Pasadena', state: 'CA' },
        contract: { contractPrice: 125000 },
        defects: [{ category: 'Water Intrusion', severity: 'High' }],
      }),
    });
    await load();
  }

  return (
    <AppShell>
      <PageHeader title="Matters" subtitle="Dashboard-ready matters with participants, timeline, billing, docs, and AI workspace." />

      <div className="card" style={{ marginBottom: 14 }}>
        <form onSubmit={createMatter} style={{ display: 'grid', gap: 10, gridTemplateColumns: '180px 1fr 1fr 120px' }}>
          <input className="input" value={matterNumber} onChange={(e) => setMatterNumber(e.target.value)} placeholder="Matter #" />
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Matter Name" />
          <input className="input" value={practiceArea} onChange={(e) => setPracticeArea(e.target.value)} placeholder="Practice Area" />
          <button className="button" type="submit">Create</button>
        </form>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
          <input className="input" value={propertyAddress} onChange={(e) => setPropertyAddress(e.target.value)} placeholder="Intake Property Address" />
          <button className="button secondary" type="button" onClick={createViaIntakeWizard}>Create via Intake Wizard</button>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Matter #</th>
              <th>Name</th>
              <th>Practice Area</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {matters.map((matter) => (
              <tr key={matter.id}>
                <td>
                  <Link href={`/matters/${matter.id}`}>{matter.matterNumber}</Link>
                </td>
                <td>{matter.name}</td>
                <td>{matter.practiceArea}</td>
                <td>{matter.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

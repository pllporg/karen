'use client';

import { FormEvent, useEffect, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { apiFetch } from '../../lib/api';

const TOOLS = [
  'case_summary',
  'timeline_extraction',
  'intake_evaluation',
  'demand_letter',
  'preservation_notice',
  'complaint_skeleton',
  'client_status_update',
  'discovery_generate',
  'discovery_response',
  'deadline_extraction',
  'next_best_action',
];

export default function AiPage() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [matterId, setMatterId] = useState('');
  const [toolName, setToolName] = useState('case_summary');

  async function load() {
    setJobs(await apiFetch<any[]>('/ai/jobs'));
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function createJob(e: FormEvent) {
    e.preventDefault();
    if (!matterId) return;
    await apiFetch('/ai/jobs', {
      method: 'POST',
      body: JSON.stringify({ matterId, toolName, input: {} }),
    });
    await load();
  }

  async function approveFirstArtifact(job: any) {
    const artifactId = job.artifacts?.[0]?.id;
    if (!artifactId) return;
    await apiFetch(`/ai/artifacts/${artifactId}/review`, {
      method: 'POST',
      body: JSON.stringify({ status: 'APPROVED' }),
    });
    await load();
  }

  return (
    <AppShell>
      <PageHeader title="AI Workspace" subtitle="Draft-only legal AI workflows with provenance, citations, and review status." />

      <div className="notice" style={{ marginBottom: 14 }}>
        Attorney Review Required. AI artifacts remain in DRAFT until APPROVED.
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <form onSubmit={createJob} style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 240px auto' }}>
          <input className="input" value={matterId} onChange={(e) => setMatterId(e.target.value)} placeholder="Matter ID" />
          <select className="select" value={toolName} onChange={(e) => setToolName(e.target.value)}>
            {TOOLS.map((tool) => (
              <option key={tool} value={tool}>{tool}</option>
            ))}
          </select>
          <button className="button" type="submit">Create AI Job</button>
        </form>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Tool</th>
              <th>Matter</th>
              <th>Status</th>
              <th>Artifacts</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>{job.toolName}</td>
                <td>{job.matterId}</td>
                <td>{job.status}</td>
                <td>
                  {job.artifacts?.length || 0}
                  {job.artifacts?.length ? (
                    <button className="button ghost" style={{ marginLeft: 8, width: 96 }} onClick={() => approveFirstArtifact(job)}>
                      Approve
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

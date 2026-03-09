'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { apiFetch } from '../../lib/api';

export default function ExportsPage() {
  const [result, setResult] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);

  async function loadJobs() {
    setJobs(await apiFetch<any[]>('/exports/jobs'));
  }

  useEffect(() => {
    loadJobs().catch(() => undefined);
  }, []);

  async function runBackup() {
    setResult(await apiFetch('/exports/full-backup', { method: 'POST' }));
    await loadJobs();
  }

  return (
    <AppShell>
      <PageHeader title="Exit Strategy Export" subtitle="Full ZIP backup with CSVs per entity and documents/manifest mapping." />
      <div className="card">
        <button className="button" style={{ width: 260 }} onClick={runBackup}>Generate Full Backup</button>
        {result ? (
          <div style={{ marginTop: 12 }}>
            <p>Job: {result.jobId}</p>
            {result.downloadUrl ? (
              <a href={result.downloadUrl} target="_blank" rel="noreferrer" className="badge">Download ZIP</a>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h3 style={{ marginTop: 0 }}>Export Jobs</h3>
        <table aria-label="Data table" className="table">
          <thead>
            <tr>
              <th scope="col">Job</th>
              <th scope="col">Status</th>
              <th scope="col">Created</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id}>
                <td>{job.id.slice(0, 8)}</td>
                <td>{job.status}</td>
                <td>{new Date(job.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { apiFetch } from '../../lib/api';

type AnalystRow = {
  id: string;
  matterName: string;
  clientName: string;
  stage: string;
  owner: string;
  overdueTasks: number;
  upcomingDeadlines: number;
  arBucket: string;
  arBalance: number;
  lastActivity: string;
};

type AnalystDetailRow = {
  id: string;
  date: string;
  type: string;
  actor: string;
  summary: string;
};

type AnalystPayload = {
  rows: AnalystRow[];
  detailsById: Record<string, AnalystDetailRow[]>;
};

function normalizePayload(raw: unknown): AnalystPayload {
  const payload = raw as { rows?: unknown[]; items?: unknown[]; detailsById?: Record<string, unknown[]> };
  const sourceRows = Array.isArray(payload?.rows) ? payload.rows : Array.isArray(payload?.items) ? payload.items : [];

  const rows = sourceRows.map((item, index) => {
    const row = item as Record<string, unknown>;
    return {
      id: String(row.id || row.matterId || row.recordId || `row-${index}`),
      matterName: String(row.matterName || row.matter || row.name || 'Unassigned matter'),
      clientName: String(row.clientName || row.client || 'Unknown client'),
      stage: String(row.stage || row.stageName || 'Unstaged'),
      owner: String(row.owner || row.analyst || row.assignee || 'Unassigned'),
      overdueTasks: Number(row.overdueTasks || row.overdueCount || 0),
      upcomingDeadlines: Number(row.upcomingDeadlines || row.deadlineCount || 0),
      arBucket: String(row.arBucket || row.bucket || 'Current'),
      arBalance: Number(row.arBalance || row.balanceDue || 0),
      lastActivity: String(row.lastActivity || row.lastEventAt || 'No activity logged'),
    };
  });

  const detailsById = Object.fromEntries(
    Object.entries(payload?.detailsById || {}).map(([key, entries]) => [
      key,
      (entries || []).map((entry, index) => {
        const detail = entry as Record<string, unknown>;
        return {
          id: String(detail.id || `${key}-detail-${index}`),
          date: String(detail.date || detail.occurredAt || '—'),
          type: String(detail.type || detail.category || 'Update'),
          actor: String(detail.actor || detail.user || 'System'),
          summary: String(detail.summary || detail.description || 'No summary provided'),
        };
      }),
    ]),
  ) as Record<string, AnalystDetailRow[]>;

  return { rows, detailsById };
}

function csvHref(filters: { stage: string; bucket: string; query: string }) {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
  const query = new URLSearchParams();
  if (filters.stage !== 'all') query.set('stage', filters.stage);
  if (filters.bucket !== 'all') query.set('bucket', filters.bucket);
  if (filters.query.trim()) query.set('q', filters.query.trim());
  const suffix = query.toString();
  return `${base}/reporting/analyst/csv${suffix ? `?${suffix}` : ''}`;
}

export default function AnalystPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<AnalystRow[]>([]);
  const [detailsById, setDetailsById] = useState<Record<string, AnalystDetailRow[]>>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [stage, setStage] = useState('all');
  const [bucket, setBucket] = useState('all');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    apiFetch<unknown>('/reporting/analyst')
      .then((result) => {
        if (cancelled) return;
        const normalized = normalizePayload(result);
        setRows(normalized.rows);
        setDetailsById(normalized.detailsById);
        setSelectedId(normalized.rows[0]?.id || null);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Unable to load analyst reporting data. Please retry in a few minutes.');
        setRows([]);
        setDetailsById({});
        setSelectedId(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const stageOptions = useMemo(
    () => ['all', ...Array.from(new Set(rows.map((row) => row.stage))).sort((a, b) => a.localeCompare(b))],
    [rows],
  );
  const bucketOptions = useMemo(
    () => ['all', ...Array.from(new Set(rows.map((row) => row.arBucket))).sort((a, b) => a.localeCompare(b))],
    [rows],
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (stage !== 'all' && row.stage !== stage) return false;
      if (bucket !== 'all' && row.arBucket !== bucket) return false;
      if (!normalizedQuery) return true;
      return [row.matterName, row.clientName, row.owner, row.lastActivity].some((value) =>
        value.toLowerCase().includes(normalizedQuery),
      );
    });
  }, [bucket, query, rows, stage]);

  useEffect(() => {
    if (!filteredRows.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !filteredRows.some((row) => row.id === selectedId)) {
      setSelectedId(filteredRows[0].id);
    }
  }, [filteredRows, selectedId]);

  const selected = filteredRows.find((row) => row.id === selectedId) || null;
  const detailRows = selected ? detailsById[selected.id] || [] : [];

  return (
    <AppShell>
      <PageHeader
        title="Analyst Dashboard"
        subtitle="Use filters first, then select a matter row to review procedural drilldown activity and export the current table view."
      />

      <div className="card inline-stack" style={{ marginBottom: 12 }}>
        <p className="mono-meta">Procedure: apply filters, select a row, then export the reviewed subset.</p>
        <div className="card-grid" style={{ gridTemplateColumns: '2fr 1fr 1fr auto', alignItems: 'end' }}>
          <div>
            <label htmlFor="analyst-search">Matter, client, owner, or recent activity</label>
            <input
              id="analyst-search"
              className="input"
              type="search"
              value={query}
              placeholder="Type to narrow analyst worklist"
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
          <div>
            <label htmlFor="analyst-stage">Stage</label>
            <select id="analyst-stage" className="select" value={stage} onChange={(event) => setStage(event.target.value)}>
              {stageOptions.map((option) => (
                <option value={option} key={option}>
                  {option === 'all' ? 'All stages' : option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="analyst-bucket">AR bucket</label>
            <select id="analyst-bucket" className="select" value={bucket} onChange={(event) => setBucket(event.target.value)}>
              {bucketOptions.map((option) => (
                <option value={option} key={option}>
                  {option === 'all' ? 'All buckets' : option}
                </option>
              ))}
            </select>
          </div>
          <div>
            <a className="button secondary" href={csvHref({ stage, bucket, query })}>
              Export CSV
            </a>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="card" role="status" aria-live="polite">
          <p className="meta-note">Loading analyst worklist…</p>
        </div>
      ) : null}

      {!loading && error ? (
        <div className="card">
          <p className="error" role="alert">
            {error}
          </p>
        </div>
      ) : null}

      {!loading && !error ? (
        <div className="inline-stack">
          {filteredRows.length ? (
            <div className="card" style={{ overflowX: 'auto' }}>
              <table className="table" aria-label="Analyst matter drilldown table">
                <thead>
                  <tr>
                    <th scope="col">Matter</th>
                    <th scope="col">Client</th>
                    <th scope="col">Stage</th>
                    <th scope="col">Owner</th>
                    <th scope="col">Overdue</th>
                    <th scope="col">Deadlines</th>
                    <th scope="col">AR Bucket</th>
                    <th scope="col">AR Balance</th>
                    <th scope="col">Last Activity</th>
                    <th scope="col">Drilldown</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((row) => {
                    const active = row.id === selectedId;
                    return (
                      <tr key={row.id} aria-selected={active}>
                        <td>{row.matterName}</td>
                        <td>{row.clientName}</td>
                        <td>{row.stage}</td>
                        <td>{row.owner}</td>
                        <td>{row.overdueTasks}</td>
                        <td>{row.upcomingDeadlines}</td>
                        <td>{row.arBucket}</td>
                        <td>${row.arBalance.toLocaleString()}</td>
                        <td>{row.lastActivity}</td>
                        <td>
                          <button
                            type="button"
                            className="button ghost"
                            onClick={() => setSelectedId(row.id)}
                            aria-pressed={active}
                            aria-label={`Show drilldown details for ${row.matterName}`}
                          >
                            {active ? 'Selected' : 'View'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card notice" role="status">
              <p>
                No analyst rows match the current filters. Clear one or more filters to continue the review workflow.
              </p>
            </div>
          )}

          <div className="card inline-stack" aria-live="polite">
            <h3 style={{ marginTop: 0 }}>Matter Drilldown</h3>
            {selected ? (
              <>
                <p className="meta-note">
                  {selected.matterName} · {selected.clientName} · {selected.stage}
                </p>
                {detailRows.length ? (
                  <table className="table" aria-label="Selected matter activity drilldown">
                    <thead>
                      <tr>
                        <th scope="col">Date</th>
                        <th scope="col">Type</th>
                        <th scope="col">Actor</th>
                        <th scope="col">Summary</th>
                      </tr>
                    </thead>
                    <tbody>
                      {detailRows.map((detail) => (
                        <tr key={detail.id}>
                          <td>{detail.date}</td>
                          <td>{detail.type}</td>
                          <td>{detail.actor}</td>
                          <td>{detail.summary}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="notice">No drilldown events were returned for this matter.</p>
                )}
              </>
            ) : (
              <p className="notice">Select a matter row to review procedural detail records.</p>
            )}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

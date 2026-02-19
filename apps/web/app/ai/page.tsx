'use client';

import { Fragment, FormEvent, useEffect, useState } from 'react';
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

type DeadlineCandidate = {
  id: string;
  date: string;
  description: string;
  chunkId?: string;
  excerpt?: string;
};

type ArtifactMetadata = {
  banner?: string;
  citations?: Array<{ chunkId: string }>;
  excerptEvidence?: Array<{ chunkId: string; excerpt: string }>;
  deadlineCandidates?: DeadlineCandidate[];
  stylePack?: {
    id: string;
    name: string;
    description?: string | null;
    sourceDocumentVersionIds?: string[];
    sourceDocCount?: number;
  } | null;
};

type AiArtifact = {
  id: string;
  type: string;
  content: string;
  reviewedStatus: string;
  metadataJson?: ArtifactMetadata;
};

type AiJob = {
  id: string;
  toolName: string;
  matterId: string;
  status: string;
  artifacts?: AiArtifact[];
};

type DeadlineSelection = {
  selected: boolean;
  createTask: boolean;
  createEvent: boolean;
};

type StylePackSourceDoc = {
  id: string;
  documentVersionId: string;
  documentVersion: {
    id: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
    document: {
      id: string;
      matterId: string;
      title: string;
    };
  };
};

type StylePack = {
  id: string;
  name: string;
  description?: string | null;
  sourceDocs: StylePackSourceDoc[];
};

type StylePackDraft = {
  name: string;
  description: string;
  documentVersionId: string;
};

const DATE_TOKEN_REGEX =
  /\b(?:\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\s+\d{1,2},\s+\d{4})\b/gi;

export default function AiPage() {
  const [jobs, setJobs] = useState<AiJob[]>([]);
  const [stylePacks, setStylePacks] = useState<StylePack[]>([]);
  const [stylePackDrafts, setStylePackDrafts] = useState<Record<string, StylePackDraft>>({});
  const [selectedStylePackId, setSelectedStylePackId] = useState('');
  const [newStylePackName, setNewStylePackName] = useState('');
  const [newStylePackDescription, setNewStylePackDescription] = useState('');
  const [busyStylePackId, setBusyStylePackId] = useState<string | null>(null);
  const [matterId, setMatterId] = useState('');
  const [toolName, setToolName] = useState('case_summary');
  const [busyArtifactId, setBusyArtifactId] = useState<string | null>(null);
  const [statusByArtifact, setStatusByArtifact] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [deadlineSelections, setDeadlineSelections] = useState<Record<string, Record<string, DeadlineSelection>>>({});

  async function load() {
    const [nextJobs, nextStylePacks] = await Promise.all([
      apiFetch<AiJob[]>('/ai/jobs'),
      apiFetch<StylePack[]>('/ai/style-packs'),
    ]);
    setJobs(nextJobs);
    setStylePacks(nextStylePacks);
    setStylePackDrafts((previous) => buildStylePackDrafts(nextStylePacks, previous));
    setDeadlineSelections((previous) => buildSelectionState(nextJobs, previous));
    if (selectedStylePackId && !nextStylePacks.some((stylePack) => stylePack.id === selectedStylePackId)) {
      setSelectedStylePackId('');
    }
  }

  useEffect(() => {
    load().catch(() => undefined);
  }, []);

  async function createJob(e: FormEvent) {
    e.preventDefault();
    if (!matterId) return;
    setError(null);
    try {
      const payload: { matterId: string; toolName: string; input: Record<string, unknown>; stylePackId?: string } = {
        matterId,
        toolName,
        input: {},
      };
      if (selectedStylePackId) {
        payload.stylePackId = selectedStylePackId;
      }
      await apiFetch('/ai/jobs', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to create AI job');
    }
  }

  async function createStylePack(e: FormEvent) {
    e.preventDefault();
    if (!newStylePackName.trim()) return;
    setError(null);
    setBusyStylePackId('new');
    try {
      await apiFetch('/ai/style-packs', {
        method: 'POST',
        body: JSON.stringify({
          name: newStylePackName,
          description: newStylePackDescription || undefined,
        }),
      });
      setNewStylePackName('');
      setNewStylePackDescription('');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to create style pack');
    } finally {
      setBusyStylePackId(null);
    }
  }

  async function saveStylePack(stylePackId: string) {
    const draft = stylePackDrafts[stylePackId];
    if (!draft) return;
    setError(null);
    setBusyStylePackId(stylePackId);
    try {
      await apiFetch(`/ai/style-packs/${stylePackId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: draft.name,
          description: draft.description,
        }),
      });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to update style pack');
    } finally {
      setBusyStylePackId(null);
    }
  }

  async function attachStylePackSourceDoc(stylePackId: string) {
    const draft = stylePackDrafts[stylePackId];
    if (!draft?.documentVersionId.trim()) return;
    setError(null);
    setBusyStylePackId(stylePackId);
    try {
      await apiFetch(`/ai/style-packs/${stylePackId}/source-docs`, {
        method: 'POST',
        body: JSON.stringify({
          documentVersionId: draft.documentVersionId.trim(),
        }),
      });
      setStylePackDrafts((previous) => ({
        ...previous,
        [stylePackId]: {
          ...previous[stylePackId],
          documentVersionId: '',
        },
      }));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to attach source document');
    } finally {
      setBusyStylePackId(null);
    }
  }

  async function removeStylePackSourceDoc(stylePackId: string, documentVersionId: string) {
    setError(null);
    setBusyStylePackId(stylePackId);
    try {
      await apiFetch(`/ai/style-packs/${stylePackId}/source-docs/${documentVersionId}`, {
        method: 'DELETE',
      });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to remove source document');
    } finally {
      setBusyStylePackId(null);
    }
  }

  async function approveArtifact(artifactId: string) {
    setError(null);
    setBusyArtifactId(artifactId);
    try {
      await apiFetch(`/ai/artifacts/${artifactId}/review`, {
        method: 'POST',
        body: JSON.stringify({ status: 'APPROVED' }),
      });
      setStatusByArtifact((previous) => ({ ...previous, [artifactId]: 'Artifact approved.' }));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to approve artifact');
    } finally {
      setBusyArtifactId(null);
    }
  }

  async function confirmDeadlines(artifact: AiArtifact, candidates: DeadlineCandidate[]) {
    const selectedRows = candidates
      .map((candidate) => {
        const selection = deadlineSelections[artifact.id]?.[candidate.id];
        if (!selection?.selected) return null;
        return {
          date: candidate.date,
          description: candidate.description,
          createTask: selection.createTask,
          createEvent: selection.createEvent,
        };
      })
      .filter((value): value is { date: string; description: string; createTask: boolean; createEvent: boolean } => Boolean(value));

    if (!selectedRows.length) return;

    setError(null);
    setBusyArtifactId(artifact.id);
    try {
      const result = await apiFetch<{ created: Array<{ type: 'task' | 'event'; id: string }> }>(
        `/ai/artifacts/${artifact.id}/confirm-deadlines`,
        {
          method: 'POST',
          body: JSON.stringify({ selections: selectedRows }),
        },
      );
      setStatusByArtifact((previous) => ({
        ...previous,
        [artifact.id]: `Created ${result.created.length} records from confirmed deadlines.`,
      }));
      setDeadlineSelections((previous) => ({
        ...previous,
        [artifact.id]: Object.fromEntries(
          Object.entries(previous[artifact.id] || {}).map(([candidateId, selection]) => [
            candidateId,
            {
              ...selection,
              selected: false,
            },
          ]),
        ),
      }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to confirm deadlines');
    } finally {
      setBusyArtifactId(null);
    }
  }

  function toggleCandidateSelection(artifactId: string, candidateId: string, key: keyof DeadlineSelection, value: boolean) {
    setDeadlineSelections((previous) => {
      const artifactSelection = previous[artifactId] || {};
      const candidateSelection = artifactSelection[candidateId] || {
        selected: false,
        createTask: true,
        createEvent: true,
      };

      return {
        ...previous,
        [artifactId]: {
          ...artifactSelection,
          [candidateId]: {
            ...candidateSelection,
            [key]: value,
          },
        },
      };
    });
  }

  function updateStylePackDraft(stylePackId: string, key: keyof StylePackDraft, value: string) {
    setStylePackDrafts((previous) => ({
      ...previous,
      [stylePackId]: {
        ...(previous[stylePackId] || {
          name: '',
          description: '',
          documentVersionId: '',
        }),
        [key]: value,
      },
    }));
  }

  return (
    <AppShell>
      <PageHeader title="AI Workspace" subtitle="Draft-only legal AI workflows with provenance, citations, and review status." />

      <div className="notice" style={{ marginBottom: 14 }}>
        Attorney Review Required. AI artifacts remain in DRAFT until APPROVED.
      </div>
      <div className="notice" style={{ marginBottom: 14 }}>
        Deadline extraction never creates tasks/events automatically. You must confirm each extracted row first.
      </div>
      {error ? <div className="error" style={{ marginBottom: 14 }}>{error}</div> : null}

      <div className="card" style={{ marginBottom: 14 }}>
        <h3 style={{ margin: '0 0 10px' }}>Style Packs (Admin)</h3>
        <form
          onSubmit={createStylePack}
          style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 1.2fr auto', marginBottom: 10 }}
        >
          <input
            className="input"
            value={newStylePackName}
            onChange={(event) => setNewStylePackName(event.target.value)}
            placeholder="Style pack name"
          />
          <input
            className="input"
            value={newStylePackDescription}
            onChange={(event) => setNewStylePackDescription(event.target.value)}
            placeholder="Description (optional)"
          />
          <button className="button" type="submit" disabled={busyStylePackId === 'new'}>
            {busyStylePackId === 'new' ? 'Creating...' : 'Create Style Pack'}
          </button>
        </form>

        {stylePacks.length === 0 ? <div className="notice">No style packs yet.</div> : null}
        {stylePacks.map((stylePack) => {
          const draft = stylePackDrafts[stylePack.id] || {
            name: stylePack.name,
            description: stylePack.description || '',
            documentVersionId: '',
          };
          const isBusy = busyStylePackId === stylePack.id;
          return (
            <div key={stylePack.id} className="card" style={{ marginTop: 10, borderColor: 'var(--lic-fog)' }}>
              <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1.3fr auto', alignItems: 'center' }}>
                <input
                  className="input"
                  value={draft.name}
                  onChange={(event) => updateStylePackDraft(stylePack.id, 'name', event.target.value)}
                  placeholder="Style pack name"
                />
                <input
                  className="input"
                  value={draft.description}
                  onChange={(event) => updateStylePackDraft(stylePack.id, 'description', event.target.value)}
                  placeholder="Description"
                />
                <button className="button secondary" type="button" disabled={isBusy} onClick={() => saveStylePack(stylePack.id)}>
                  {isBusy ? 'Saving...' : 'Save'}
                </button>
              </div>

              <div style={{ marginTop: 8, display: 'grid', gap: 8, gridTemplateColumns: '1fr auto' }}>
                <input
                  className="input"
                  value={draft.documentVersionId}
                  onChange={(event) => updateStylePackDraft(stylePack.id, 'documentVersionId', event.target.value)}
                  placeholder="Attach source document version ID"
                />
                <button
                  className="button ghost"
                  type="button"
                  disabled={isBusy || !draft.documentVersionId.trim()}
                  onClick={() => attachStylePackSourceDoc(stylePack.id)}
                >
                  Attach Source Doc
                </button>
              </div>

              <div style={{ marginTop: 8 }}>
                <strong>Source Docs:</strong> {stylePack.sourceDocs.length}
              </div>
              {stylePack.sourceDocs.length > 0 ? (
                <div style={{ marginTop: 6, display: 'grid', gap: 6 }}>
                  {stylePack.sourceDocs.map((sourceDoc) => (
                    <div
                      key={sourceDoc.id}
                      style={{
                        display: 'flex',
                        gap: 8,
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        border: '1px solid var(--lic-fog)',
                        borderRadius: 0,
                        padding: '6px 8px',
                        fontSize: '0.85rem',
                      }}
                    >
                      <span>
                        {sourceDoc.documentVersion.document.title} ({sourceDoc.documentVersionId})
                      </span>
                      <button
                        className="button ghost"
                        type="button"
                        style={{ width: 120 }}
                        disabled={isBusy}
                        onClick={() => removeStylePackSourceDoc(stylePack.id, sourceDoc.documentVersionId)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <form onSubmit={createJob} style={{ display: 'grid', gap: 10, gridTemplateColumns: '1fr 220px 260px auto' }}>
          <input className="input" value={matterId} onChange={(e) => setMatterId(e.target.value)} placeholder="Matter ID" />
          <select className="select" value={toolName} onChange={(e) => setToolName(e.target.value)}>
            {TOOLS.map((tool) => (
              <option key={tool} value={tool}>{tool}</option>
            ))}
          </select>
          <select
            className="select"
            value={selectedStylePackId}
            onChange={(event) => setSelectedStylePackId(event.target.value)}
          >
            <option value="">No style pack</option>
            {stylePacks.map((stylePack) => (
              <option key={stylePack.id} value={stylePack.id}>
                {stylePack.name}
              </option>
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
              <Fragment key={job.id}>
                <tr>
                  <td>{job.toolName}</td>
                  <td>{job.matterId}</td>
                  <td>{job.status}</td>
                  <td>{job.artifacts?.length || 0}</td>
                </tr>
                {job.artifacts?.map((artifact) => {
                  const metadata = artifact.metadataJson || {};
                  const candidates = getDeadlineCandidates(artifact);
                  const selectedCount = candidates.filter(
                    (candidate) => deadlineSelections[artifact.id]?.[candidate.id]?.selected,
                  ).length;

                  return (
                    <tr key={artifact.id}>
                      <td colSpan={4}>
                        <div className="card" style={{ margin: '10px 0', borderColor: 'var(--lic-blue)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                            <div>
                              <strong>{artifact.type}</strong>
                              <span className="badge" style={{ marginLeft: 8 }}>{artifact.reviewedStatus}</span>
                            </div>
                            <button
                              className="button ghost"
                              type="button"
                              style={{ width: 120 }}
                              onClick={() => approveArtifact(artifact.id)}
                              disabled={busyArtifactId === artifact.id}
                            >
                              {busyArtifactId === artifact.id ? 'Saving...' : 'Approve'}
                            </button>
                          </div>

                          {metadata.banner ? <div className="notice" style={{ marginTop: 10 }}>{metadata.banner}</div> : null}
                          {metadata.stylePack ? (
                            <div style={{ marginTop: 8 }}>
                              <span className="badge">
                                Style Pack: {metadata.stylePack.name} ({metadata.stylePack.sourceDocCount || 0} source docs)
                              </span>
                            </div>
                          ) : null}
                          <pre
                            style={{
                              marginTop: 10,
                              whiteSpace: 'pre-wrap',
                              background: 'var(--lic-surface-0)',
                              border: '1px solid var(--lic-fog)',
                              borderRadius: 0,
                              padding: 10,
                              fontSize: '0.85rem',
                            }}
                          >
                            {artifact.content}
                          </pre>

                          {candidates.length ? (
                            <div style={{ marginTop: 12 }}>
                              <h4 style={{ margin: '0 0 8px' }}>Confirm Extracted Deadlines (with source evidence)</h4>
                              <table className="table">
                                <thead>
                                  <tr>
                                    <th>Deadline Draft</th>
                                    <th>Source Excerpt</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {candidates.map((candidate) => {
                                    const selection = deadlineSelections[artifact.id]?.[candidate.id] || {
                                      selected: false,
                                      createTask: true,
                                      createEvent: true,
                                    };
                                    return (
                                      <tr key={candidate.id}>
                                        <td>
                                          <label style={{ display: 'block', marginBottom: 6 }}>
                                            <input
                                              type="checkbox"
                                              checked={selection.selected}
                                              onChange={(event) =>
                                                toggleCandidateSelection(
                                                  artifact.id,
                                                  candidate.id,
                                                  'selected',
                                                  event.target.checked,
                                                )
                                              }
                                            />{' '}
                                            Confirm
                                          </label>
                                          <div><strong>{candidate.date}</strong></div>
                                          <div>{candidate.description}</div>
                                          <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                                            <label>
                                              <input
                                                type="checkbox"
                                                checked={selection.createTask}
                                                onChange={(event) =>
                                                  toggleCandidateSelection(
                                                    artifact.id,
                                                    candidate.id,
                                                    'createTask',
                                                    event.target.checked,
                                                  )
                                                }
                                              />{' '}
                                              Create task
                                            </label>
                                            <label>
                                              <input
                                                type="checkbox"
                                                checked={selection.createEvent}
                                                onChange={(event) =>
                                                  toggleCandidateSelection(
                                                    artifact.id,
                                                    candidate.id,
                                                    'createEvent',
                                                    event.target.checked,
                                                  )
                                                }
                                              />{' '}
                                              Create event
                                            </label>
                                          </div>
                                        </td>
                                        <td>
                                          <div style={{ whiteSpace: 'pre-wrap' }}>
                                            {candidate.excerpt || findExcerpt(metadata.excerptEvidence, candidate.chunkId)}
                                          </div>
                                          {candidate.chunkId ? (
                                            <div style={{ marginTop: 6 }}>
                                              <span className="badge">chunk:{candidate.chunkId}</span>
                                            </div>
                                          ) : null}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                              <div style={{ display: 'flex', gap: 10, marginTop: 10, alignItems: 'center' }}>
                                <button
                                  className="button secondary"
                                  type="button"
                                  style={{ width: 250 }}
                                  disabled={selectedCount === 0 || busyArtifactId === artifact.id}
                                  onClick={() => confirmDeadlines(artifact, candidates)}
                                >
                                  {busyArtifactId === artifact.id ? 'Submitting...' : 'Confirm Selected Deadlines'}
                                </button>
                                <span className="badge">{selectedCount} selected</span>
                              </div>
                            </div>
                          ) : null}
                          {statusByArtifact[artifact.id] ? (
                            <div style={{ marginTop: 10 }}>
                              <span className="badge">{statusByArtifact[artifact.id]}</span>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

function buildSelectionState(
  jobs: AiJob[],
  previous: Record<string, Record<string, DeadlineSelection>>,
): Record<string, Record<string, DeadlineSelection>> {
  const nextSelections: Record<string, Record<string, DeadlineSelection>> = {};

  for (const job of jobs) {
    for (const artifact of job.artifacts || []) {
      const candidates = getDeadlineCandidates(artifact);
      if (!candidates.length) continue;

      const existing = previous[artifact.id] || {};
      const artifactSelection: Record<string, DeadlineSelection> = {};
      for (const candidate of candidates) {
        artifactSelection[candidate.id] = existing[candidate.id] || {
          selected: false,
          createTask: true,
          createEvent: true,
        };
      }
      nextSelections[artifact.id] = artifactSelection;
    }
  }

  return nextSelections;
}

function buildStylePackDrafts(
  stylePacks: StylePack[],
  previous: Record<string, StylePackDraft>,
): Record<string, StylePackDraft> {
  const nextDrafts: Record<string, StylePackDraft> = {};
  for (const stylePack of stylePacks) {
    const existing = previous[stylePack.id];
    nextDrafts[stylePack.id] = {
      name: existing?.name ?? stylePack.name,
      description: existing?.description ?? (stylePack.description || ''),
      documentVersionId: existing?.documentVersionId ?? '',
    };
  }
  return nextDrafts;
}

function getDeadlineCandidates(artifact: AiArtifact): DeadlineCandidate[] {
  const metadata = artifact.metadataJson || {};
  const fromMetadata = Array.isArray(metadata.deadlineCandidates)
    ? metadata.deadlineCandidates
        .filter((candidate): candidate is DeadlineCandidate => Boolean(candidate?.id && candidate.date && candidate.description))
        .map((candidate) => ({
          ...candidate,
          date: normalizeDate(candidate.date) || candidate.date,
        }))
    : [];
  if (fromMetadata.length) return fromMetadata;

  const fallback: DeadlineCandidate[] = [];
  for (const excerpt of metadata.excerptEvidence || []) {
    const dates = excerpt.excerpt?.match(DATE_TOKEN_REGEX) || [];
    for (const rawDate of dates) {
      const normalizedDate = normalizeDate(rawDate);
      if (!normalizedDate) continue;
      fallback.push({
        id: `${excerpt.chunkId}-${normalizedDate}-${fallback.length + 1}`,
        date: normalizedDate,
        description: 'Review scheduling order deadline',
        chunkId: excerpt.chunkId,
        excerpt: excerpt.excerpt,
      });
    }
  }

  return dedupeFallback(fallback);
}

function dedupeFallback(candidates: DeadlineCandidate[]): DeadlineCandidate[] {
  const seen = new Set<string>();
  return candidates.filter((candidate) => {
    const key = `${candidate.date}|${candidate.description}|${candidate.chunkId || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function findExcerpt(excerpts: Array<{ chunkId: string; excerpt: string }> | undefined, chunkId: string | undefined): string {
  if (!chunkId || !Array.isArray(excerpts)) return '';
  return excerpts.find((item) => item.chunkId === chunkId)?.excerpt || '';
}

function normalizeDate(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
  if (slashMatch) {
    const year = slashMatch[3].length === 2 ? `20${slashMatch[3]}` : slashMatch[3];
    return `${year}-${slashMatch[1].padStart(2, '0')}-${slashMatch[2].padStart(2, '0')}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString().slice(0, 10);
}

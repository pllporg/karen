'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { apiFetch } from '../../lib/api';
import { JobCreatorForm } from './job-creator-form';
import { JobsTable } from './jobs-table';
import { StylePackManager } from './style-pack-manager';
import {
  AiArtifact,
  AiJob,
  DeadlineCandidate,
  DeadlineSelection,
  DocumentVersionLookup,
  MatterLookup,
  StylePack,
  StylePackDraft,
  TOOLS,
} from './types';
import { buildSelectionState, buildStylePackDrafts } from './utils';

export default function AiPage() {
  const [jobs, setJobs] = useState<AiJob[]>([]);
  const [stylePacks, setStylePacks] = useState<StylePack[]>([]);
  const [matterOptions, setMatterOptions] = useState<MatterLookup[]>([]);
  const [documentVersionOptions, setDocumentVersionOptions] = useState<DocumentVersionLookup[]>([]);
  const [stylePackDrafts, setStylePackDrafts] = useState<Record<string, StylePackDraft>>({});
  const [selectedStylePackId, setSelectedStylePackId] = useState('');
  const [newStylePackName, setNewStylePackName] = useState('');
  const [newStylePackDescription, setNewStylePackDescription] = useState('');
  const [busyStylePackId, setBusyStylePackId] = useState<string | null>(null);
  const [selectedMatterId, setSelectedMatterId] = useState('');
  const [toolName, setToolName] = useState<string>('case_summary');
  const [busyArtifactId, setBusyArtifactId] = useState<string | null>(null);
  const [statusByArtifact, setStatusByArtifact] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [deadlineSelections, setDeadlineSelections] = useState<Record<string, Record<string, DeadlineSelection>>>({});

  const load = useCallback(async () => {
    const query = selectedMatterId ? `&matterId=${encodeURIComponent(selectedMatterId)}` : '';
    const [nextJobs, nextStylePacks] = await Promise.all([apiFetch<AiJob[]>('/ai/jobs'), apiFetch<StylePack[]>('/ai/style-packs')]);
    const [nextMattersRaw, nextDocumentVersionsRaw] = await Promise.all([
      apiFetch<MatterLookup[]>('/lookups/matters?limit=200').catch(() => []),
      apiFetch<DocumentVersionLookup[]>(`/lookups/document-versions?limit=200${query}`).catch(() => []),
    ]);

    const nextMatters = Array.isArray(nextMattersRaw) ? nextMattersRaw : [];
    const nextDocumentVersions = Array.isArray(nextDocumentVersionsRaw) ? nextDocumentVersionsRaw : [];

    setJobs(nextJobs);
    setStylePacks(nextStylePacks);
    setMatterOptions(nextMatters);
    setDocumentVersionOptions(nextDocumentVersions);
    setStylePackDrafts((previous) => buildStylePackDrafts(nextStylePacks, previous));
    setDeadlineSelections((previous) => buildSelectionState(nextJobs, previous));
    setSelectedMatterId((current) => current || nextMatters[0]?.id || '');

    if (selectedStylePackId && !nextStylePacks.some((stylePack) => stylePack.id === selectedStylePackId)) {
      setSelectedStylePackId('');
    }
  }, [selectedMatterId, selectedStylePackId]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  async function createJob(event: FormEvent) {
    event.preventDefault();
    if (!selectedMatterId) return;

    setError(null);
    try {
      const payload: { matterId: string; toolName: string; input: Record<string, unknown>; stylePackId?: string } = {
        matterId: selectedMatterId,
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

  async function createStylePack(event: FormEvent) {
    event.preventDefault();
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

  async function reviewArtifact(artifactId: string, status: 'APPROVED' | 'REJECTED') {
    setError(null);
    setBusyArtifactId(artifactId);
    try {
      await apiFetch(`/ai/artifacts/${artifactId}/review`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      setStatusByArtifact((previous) => ({
        ...previous,
        [artifactId]:
          status === 'APPROVED' ? 'Review gate advanced to APPROVED.' : 'Artifact returned to review queue for revision.',
      }));
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to update artifact review status');
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
      .filter((value): value is { date: string; description: string; createTask: boolean; createEvent: boolean } =>
        Boolean(value),
      );

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

  function resolveMatterLabel(matterId: string | null | undefined): string {
    if (!matterId) return 'Matter not specified';
    return matterOptions.find((matter) => matter.id === matterId)?.label || matterId;
  }

  return (
    <AppShell>
      <PageHeader title="AI Workspace" subtitle="Draft-only legal AI workflows with provenance, citations, and review status." />

      <div className="stack-2 mb-3">
        <div className="notice">Attorney Review Required. AI artifacts remain in DRAFT until APPROVED.</div>
        <div className="notice">Deadline extraction never creates tasks/events automatically. You must confirm each extracted row first.</div>
        {error ? <div className="error">{error}</div> : null}
      </div>

      <StylePackManager
        stylePacks={stylePacks}
        stylePackDrafts={stylePackDrafts}
        busyStylePackId={busyStylePackId}
        documentVersionOptions={documentVersionOptions}
        newStylePackName={newStylePackName}
        newStylePackDescription={newStylePackDescription}
        onCreateStylePack={createStylePack}
        onNewStylePackNameChange={setNewStylePackName}
        onNewStylePackDescriptionChange={setNewStylePackDescription}
        onUpdateStylePackDraft={updateStylePackDraft}
        onSaveStylePack={saveStylePack}
        onAttachStylePackSourceDoc={attachStylePackSourceDoc}
        onRemoveStylePackSourceDoc={removeStylePackSourceDoc}
        resolveMatterLabel={resolveMatterLabel}
      />

      <JobCreatorForm
        matterOptions={matterOptions}
        stylePacks={stylePacks}
        selectedMatterId={selectedMatterId}
        toolName={toolName}
        selectedStylePackId={selectedStylePackId}
        tools={TOOLS}
        onSubmit={createJob}
        onMatterChange={setSelectedMatterId}
        onToolChange={setToolName}
        onStylePackChange={setSelectedStylePackId}
      />

      <JobsTable
        jobs={jobs}
        deadlineSelections={deadlineSelections}
        statusByArtifact={statusByArtifact}
        busyArtifactId={busyArtifactId}
        resolveMatterLabel={resolveMatterLabel}
        onReviewArtifact={reviewArtifact}
        onToggleCandidateSelection={toggleCandidateSelection}
        onConfirmDeadlines={confirmDeadlines}
      />
    </AppShell>
  );
}

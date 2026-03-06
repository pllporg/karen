'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { AppShell } from '../../../../components/app-shell';
import { ConflictAuditTrail } from '../../../../components/intake/conflict-audit-trail';
import { ConflictResultsTable } from '../../../../components/intake/conflict-results-table';
import { StageNav } from '../../../../components/intake/stage-nav';
import { EmptyState } from '../../../../components/empty-state';
import { LoadingState } from '../../../../components/loading-state';
import { PageHeader } from '../../../../components/page-header';
import { Button } from '../../../../components/ui/button';
import { FormField } from '../../../../components/ui/form-field';
import { Textarea } from '../../../../components/ui/textarea';
import {
  buildConflictCheckPayload,
  canProceedFromConflict,
  canRecordConflictOutcome,
  requiresResolutionNotes,
  summarizeConflictResolution,
  type ConflictAuditEntry,
  type ConflictMatch,
  type ConflictMatchResolution,
} from '../../../../lib/intake/conflict-check';
import { resolveConflict, runConflictCheck } from '../../../../lib/intake/leads-api';
import { conflictCheckSchema } from '../../../../lib/schemas/intake';

type ConflictCheckValues = z.infer<typeof conflictCheckSchema>;

type FeedbackState = {
  tone: 'notice' | 'error';
  message: string;
};

export default function LeadConflictPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params.leadId;
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [matches, setMatches] = useState<ConflictMatch[]>([]);
  const [auditTrail, setAuditTrail] = useState<ConflictAuditEntry[]>([]);
  const [lastRunAt, setLastRunAt] = useState<string | null>(null);
  const [resolutionErrors, setResolutionErrors] = useState<Record<string, string>>({});
  const [isRecordingResolution, setIsRecordingResolution] = useState(false);
  const [proceedReady, setProceedReady] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting: isRunningCheck },
  } = useForm<ConflictCheckValues>({
    resolver: zodResolver(conflictCheckSchema),
    defaultValues: {
      queryText: 'Client name + opposing party + property address',
    },
  });

  const onRunCheck = handleSubmit(async (values) => {
    setFeedback(null);
    setProceedReady(false);
    setResolutionErrors({});

    try {
      const payload = buildConflictCheckPayload(values.queryText);
      const result = await runConflictCheck(leadId, values.queryText, payload);
      const recordedAt = result.createdAt ?? payload.lastRunAt;
      setMatches(payload.matches);
      setAuditTrail(payload.auditTrail);
      setLastRunAt(recordedAt);
      setFeedback({
        tone: 'notice',
        message: `Conflict check ${result.id} logged at ${new Date(recordedAt).toLocaleString()}.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to run conflict check.',
      });
    }
  });

  const updateMatch = (matchId: string, updater: (match: ConflictMatch) => ConflictMatch) => {
    setMatches((currentMatches) =>
      currentMatches.map((match) => (match.id === matchId ? updater(match) : match)),
    );
    setProceedReady(false);
  };

  const onResolutionChange = (matchId: string, resolution: ConflictMatchResolution) => {
    setResolutionErrors((current) => {
      const next = { ...current };
      delete next[matchId];
      return next;
    });
    updateMatch(matchId, (match) => ({
      ...match,
      resolution,
      resolutionNotes: resolution === 'CLEAR' ? '' : match.resolutionNotes,
    }));
  };

  const onNotesChange = (matchId: string, notes: string) => {
    setResolutionErrors((current) => {
      const next = { ...current };
      delete next[matchId];
      return next;
    });
    updateMatch(matchId, (match) => ({ ...match, resolutionNotes: notes }));
  };

  const validateMatches = () => {
    const nextErrors: Record<string, string> = {};

    matches.forEach((match) => {
      if (requiresResolutionNotes(match.resolution) && match.resolutionNotes.trim().length === 0) {
        nextErrors[match.id] = 'Notes required for flagged conflicts.';
      }
    });

    setResolutionErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onRecordOutcome = async (resolved: boolean) => {
    if (!matches.length || !validateMatches()) return;

    setFeedback(null);
    setIsRecordingResolution(true);

    try {
      const result = await resolveConflict(leadId, resolved, summarizeConflictResolution(matches));
      const recordedAt = result.updatedAt ?? new Date().toISOString();
      setAuditTrail((currentAuditTrail) => [
        ...currentAuditTrail,
        {
          id: `${result.id}-${resolved ? 'cleared' : 'hold'}`,
          timestamp: recordedAt,
          actor: 'INTAKE REVIEW',
          action: resolved ? 'Conflict outcome cleared' : 'Conflict hold recorded',
          detail: resolved
            ? 'All match rows reviewed. Cleared for engagement routing.'
            : 'Conflict remains blocked pending attorney review.',
          notes: summarizeConflictResolution(matches),
        },
      ]);
      setProceedReady(resolved);
      setFeedback({
        tone: 'notice',
        message: resolved
          ? `Conflict resolution recorded via ${result.id}. Proceed to engagement when ready.`
          : `Conflict hold recorded via ${result.id}. Engagement remains blocked.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to record conflict resolution.',
      });
    } finally {
      setIsRecordingResolution(false);
    }
  };

  const allResolved = canRecordConflictOutcome(matches);
  const canProceed = canProceedFromConflict(matches);
  const hasConfirmedConflict = matches.some((match) => match.resolution === 'CONFIRMED');
  const unresolvedCount = matches.filter((match) => !match.resolution).length;

  return (
    <AppShell>
      <PageHeader title="Conflict Check" subtitle="Run and document conflict review before engagement routing." />
      <StageNav leadId={leadId} active="conflict" />
      <div className="card stack-5 conflict-shell">
        <form className="stack-4" onSubmit={onRunCheck}>
          <div className="conflict-section-header">
            <div className="stack-1">
              <h2>Query</h2>
              <p className="form-field-hint">Pre-populate search terms with client, property, and opposing party context.</p>
            </div>
            {lastRunAt ? <span className="mono-meta">Last run: {new Date(lastRunAt).toLocaleString()}</span> : null}
          </div>
          <div className="conflict-query-row">
            <FormField
              label="Conflict Query"
              name="conflict-query"
              error={errors.queryText?.message}
              required
              hint="Search terms should cover client, opposing parties, and property context."
            >
              <Textarea {...register('queryText')} invalid={Boolean(errors.queryText)} />
            </FormField>
            <div className="conflict-query-actions">
              <Button type="submit" disabled={isRunningCheck}>
                {isRunningCheck ? 'Running Check...' : 'Run Conflict Check'}
              </Button>
            </div>
          </div>
        </form>

        <section className="stack-3">
          <div className="conflict-section-header">
            <div className="stack-1">
              <h2>Results</h2>
              <p className="form-field-hint">Review each candidate match before engagement routing.</p>
            </div>
            {matches.length ? <span className="mono-meta">{matches.length} candidate matches</span> : null}
          </div>
          {isRunningCheck ? <LoadingState label="Running conflict review..." /> : null}
          {!isRunningCheck && !matches.length ? (
            <EmptyState message="Run conflict review to generate candidate matches." />
          ) : null}
          {matches.length ? (
            <ConflictResultsTable
              matches={matches}
              resolutionErrors={resolutionErrors}
              onResolutionChange={onResolutionChange}
              onNotesChange={onNotesChange}
            />
          ) : null}
        </section>

        <section className="stack-3">
          <div className="conflict-section-header">
            <div className="stack-1">
              <h2>Audit Trail</h2>
              <p className="form-field-hint">Conflict decisions remain append-only for review traceability.</p>
            </div>
          </div>
          <ConflictAuditTrail entries={auditTrail} />
        </section>

        <div className="conflict-gate">
          <div className="stack-1">
            <h3>Gate</h3>
            <p className="form-field-hint">All conflicts must be resolved to proceed.</p>
            <p className="mono-meta">
              {!matches.length
                ? 'No conflict review logged in this session.'
                : hasConfirmedConflict
                  ? 'Confirmed conflict on file. Engagement remains blocked.'
                  : !allResolved
                    ? `${unresolvedCount} rows still require final review.`
                    : 'Cleared for engagement routing.'}
            </p>
          </div>
          <div className="inline-stack">
            <Button
              type="button"
              tone="danger"
              disabled={!allResolved || isRecordingResolution}
              onClick={() => void onRecordOutcome(false)}
            >
              {isRecordingResolution ? 'Recording...' : 'Place on Conflict Hold'}
            </Button>
            {proceedReady ? (
              <Link className="button" href={`/intake/${leadId}/engagement`}>
                Proceed to Engagement
              </Link>
            ) : (
              <Button
                type="button"
                disabled={!canProceed || isRecordingResolution}
                onClick={() => void onRecordOutcome(true)}
              >
                {isRecordingResolution ? 'Recording...' : 'Proceed to Engagement'}
              </Button>
            )}
          </div>
        </div>

        {feedback ? (
          <p className={feedback.tone === 'error' ? 'error' : 'notice'} role={feedback.tone === 'error' ? 'alert' : 'status'}>
            {feedback.message}
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}

'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { AppShell } from '../../../../components/app-shell';
import { PageHeader } from '../../../../components/page-header';
import { StageNav } from '../../../../components/intake/stage-nav';
import { Button } from '../../../../components/ui/button';
import { FormField } from '../../../../components/ui/form-field';
import { Textarea } from '../../../../components/ui/textarea';
import { resolveConflict, runConflictCheck } from '../../../../lib/intake/leads-api';
import { conflictCheckSchema, conflictResolutionSchema } from '../../../../lib/schemas/intake';

type ConflictCheckValues = z.infer<typeof conflictCheckSchema>;
type ConflictResolutionValues = z.infer<typeof conflictResolutionSchema>;

type FeedbackState = {
  tone: 'notice' | 'error';
  message: string;
};

export default function LeadConflictPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params.leadId;
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const {
    register: registerCheck,
    handleSubmit: handleCheckSubmit,
    formState: { errors: checkErrors, isSubmitting: isRunningCheck },
  } = useForm<ConflictCheckValues>({
    resolver: zodResolver(conflictCheckSchema),
    defaultValues: {
      queryText: 'Client name + opposing party + property address',
    },
  });
  const {
    register: registerResolution,
    handleSubmit: handleResolutionSubmit,
    formState: { errors: resolutionErrors, isSubmitting: isRecordingResolution },
  } = useForm<ConflictResolutionValues>({
    resolver: zodResolver(conflictResolutionSchema),
    defaultValues: {
      resolutionNotes: 'No direct conflicts identified.',
    },
  });

  const onRunCheck = handleCheckSubmit(async (values) => {
    setFeedback(null);

    try {
      const result = await runConflictCheck(leadId, values.queryText);
      setFeedback({
        tone: 'notice',
        message: `Conflict check ${result.id} logged at ${new Date().toLocaleString()}.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to run conflict check.',
      });
    }
  });

  function onResolve(resolved: boolean) {
    return handleResolutionSubmit(async (values) => {
      setFeedback(null);

      try {
        const result = await resolveConflict(leadId, resolved, values.resolutionNotes);
        setFeedback({
          tone: 'notice',
          message: `Conflict resolution recorded (${resolved ? 'resolved' : 'blocked'}) via ${result.id}.`,
        });
      } catch (error) {
        setFeedback({
          tone: 'error',
          message: error instanceof Error ? error.message : 'Unable to record conflict resolution.',
        });
      }
    })();
  }

  return (
    <AppShell>
      <PageHeader title="Conflict Check" subtitle="Run and document conflict review before engagement routing." />
      <StageNav leadId={leadId} active="conflict" />
      <div className="card stack-5">
        <form className="stack-4" onSubmit={onRunCheck}>
          <FormField
            label="Conflict Query"
            name="conflict-query"
            error={checkErrors.queryText?.message}
            required
            hint="Search terms should cover client, opposing parties, and property context."
          >
            <Textarea {...registerCheck('queryText')} invalid={Boolean(checkErrors.queryText)} />
          </FormField>
          <div className="form-actions">
            <Button type="submit" disabled={isRunningCheck}>{isRunningCheck ? 'Running Check...' : 'Run Conflict Check'}</Button>
          </div>
        </form>

        <form className="stack-4" onSubmit={(event) => event.preventDefault()}>
          <FormField
            label="Resolution Notes"
            name="resolution-notes"
            error={resolutionErrors.resolutionNotes?.message}
            required
            hint="Document why the matter can proceed or why intake must stop."
          >
            <Textarea {...registerResolution('resolutionNotes')} invalid={Boolean(resolutionErrors.resolutionNotes)} />
          </FormField>
          <div className="form-actions">
            <Button type="button" tone="secondary" disabled={isRecordingResolution} onClick={() => void onResolve(true)}>
              {isRecordingResolution ? 'Recording...' : 'Mark Resolved'}
            </Button>
            <Button type="button" tone="danger" disabled={isRecordingResolution} onClick={() => void onResolve(false)}>
              {isRecordingResolution ? 'Recording...' : 'Mark Blocked'}
            </Button>
          </div>
        </form>

        {feedback ? (
          <p className={feedback.tone === 'error' ? 'error' : 'notice'} role={feedback.tone === 'error' ? 'alert' : 'status'}>
            {feedback.message}
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}

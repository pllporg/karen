'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AppShell } from '../../../../components/app-shell';
import { PageHeader } from '../../../../components/page-header';
import { StageNav } from '../../../../components/intake/stage-nav';
import { Button } from '../../../../components/ui/button';
import { FormField } from '../../../../components/ui/form-field';
import { Textarea } from '../../../../components/ui/textarea';
import { resolveConflict, runConflictCheck } from '../../../../lib/intake/leads-api';
import {
  resolveConflictSchema,
  runConflictCheckSchema,
  type ResolveConflictFormData,
  type RunConflictCheckFormData,
} from '../../../../lib/schemas/conflict';

export default function LeadConflictPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params.leadId;
  const [status, setStatus] = useState('');
  const [runningCheck, setRunningCheck] = useState(false);
  const [resolving, setResolving] = useState(false);
  const {
    register: registerCheck,
    handleSubmit: handleCheckSubmit,
    formState: { errors: checkErrors },
  } = useForm<RunConflictCheckFormData>({
    resolver: zodResolver(runConflictCheckSchema),
    mode: 'onBlur',
    defaultValues: {
      queryText: 'Client name + opposing party + property address',
    },
  });

  const {
    register: registerResolution,
    handleSubmit: handleResolutionSubmit,
    formState: { errors: resolutionErrors },
  } = useForm<ResolveConflictFormData>({
    resolver: zodResolver(resolveConflictSchema),
    mode: 'onBlur',
    defaultValues: {
      resolutionNotes: 'No direct conflicts identified.',
    },
  });

  const onRunCheck = handleCheckSubmit(async (data) => {
    setRunningCheck(true);
    try {
      const result = await runConflictCheck(leadId, data.queryText);
      setStatus(`Conflict check ${result.id} logged at ${new Date().toLocaleString()}.`);
    } finally {
      setRunningCheck(false);
    }
  });

  function onResolve(resolved: boolean) {
    void handleResolutionSubmit(async (data) => {
      setResolving(true);
      try {
        const result = await resolveConflict(leadId, resolved, data.resolutionNotes);
        setStatus(`Conflict resolution recorded (${resolved ? 'resolved' : 'blocked'}) via ${result.id}.`);
      } finally {
        setResolving(false);
      }
    })();
  }

  return (
    <AppShell>
      <PageHeader title="Conflict Check" subtitle="Run and document conflict review before engagement routing." />
      <StageNav leadId={leadId} active="conflict" />
      <div className="card stack-4">
        <form className="stack-3" onSubmit={onRunCheck}>
          <FormField label="Conflict Query" name="queryText" error={checkErrors.queryText?.message} required>
            <Textarea {...registerCheck('queryText')} invalid={!!checkErrors.queryText} />
          </FormField>
          <div className="form-actions">
            <Button type="submit" disabled={runningCheck}>
              {runningCheck ? 'Running...' : 'Run Conflict Check'}
            </Button>
          </div>
        </form>
        <form className="stack-3" onSubmit={(event) => event.preventDefault()}>
          <FormField label="Resolution Notes" name="resolutionNotes" error={resolutionErrors.resolutionNotes?.message} required>
            <Textarea {...registerResolution('resolutionNotes')} invalid={!!resolutionErrors.resolutionNotes} />
          </FormField>
          <div className="row-2">
            <Button tone="secondary" type="button" disabled={resolving} onClick={() => onResolve(true)}>
              {resolving ? 'Working...' : 'Mark Resolved'}
            </Button>
            <Button tone="danger" type="button" disabled={resolving} onClick={() => onResolve(false)}>
              {resolving ? 'Working...' : 'Mark Blocked'}
            </Button>
          </div>
        </form>
        <div>
          <p className="type-label">Review Gate</p>
          <p className="type-caption">PROPOSED - IN REVIEW - APPROVED - EXECUTED - RETURNED</p>
        </div>
        {status ? <p className="mono-meta">{status}</p> : null}
      </div>
    </AppShell>
  );
}

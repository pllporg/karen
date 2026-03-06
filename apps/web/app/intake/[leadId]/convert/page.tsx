'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { AppShell } from '../../../../components/app-shell';
import { PageHeader } from '../../../../components/page-header';
import { StageNav } from '../../../../components/intake/stage-nav';
import { Button } from '../../../../components/ui/button';
import { FormField } from '../../../../components/ui/form-field';
import { Input } from '../../../../components/ui/input';
import { Checklist, convertLead, getSetupChecklist } from '../../../../lib/intake/leads-api';
import { leadConvertSchema } from '../../../../lib/schemas/intake';

type LeadConvertFormValues = z.infer<typeof leadConvertSchema>;

type FeedbackState = {
  tone: 'notice' | 'error';
  message: string;
};

export default function LeadConvertPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params.leadId;
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadConvertFormValues>({
    resolver: zodResolver(leadConvertSchema),
    defaultValues: {
      name: 'Kitchen Remodel Defect - Intake Conversion',
      matterNumber: 'M-2026-INT-001',
      practiceArea: 'Construction Litigation',
    },
  });

  useEffect(() => {
    getSetupChecklist(leadId).then(setChecklist).catch(() => undefined);
  }, [leadId]);

  const onConvert = handleSubmit(async (values) => {
    setFeedback(null);

    try {
      const matter = await convertLead(leadId, values);
      setFeedback({
        tone: 'notice',
        message: `Matter ${matter.id} created. Conversion logged at ${new Date().toLocaleString()}.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to convert lead.',
      });
    }
  });

  return (
    <AppShell>
      <PageHeader title="Lead Conversion" subtitle="Confirm setup checklist and convert lead to matter." />
      <StageNav leadId={leadId} active="convert" />
      <form className="card stack-4" onSubmit={onConvert}>
        <table className="table">
          <thead>
            <tr><th>Checkpoint</th><th>Status</th></tr>
          </thead>
          <tbody>
            <tr><td>Intake Draft</td><td>{checklist?.intakeDraft ? 'Complete' : 'Pending'}</td></tr>
            <tr><td>Conflict Resolved</td><td>{checklist?.conflictResolved ? 'Complete' : 'Pending'}</td></tr>
            <tr><td>Engagement Signed</td><td>{checklist?.engagementSigned ? 'Complete' : 'Pending'}</td></tr>
            <tr><td>Ready To Convert</td><td>{checklist?.readyToConvert ? 'Yes' : 'No'}</td></tr>
          </tbody>
        </table>
        <div className="stack-4">
          <FormField label="Matter Name" name="matter-name" error={errors.name?.message} required>
            <Input {...register('name')} invalid={Boolean(errors.name)} />
          </FormField>
          <FormField label="Matter Number" name="matter-number" error={errors.matterNumber?.message} required>
            <Input {...register('matterNumber')} invalid={Boolean(errors.matterNumber)} />
          </FormField>
          <FormField label="Practice Area" name="practice-area" error={errors.practiceArea?.message} required>
            <Input {...register('practiceArea')} invalid={Boolean(errors.practiceArea)} />
          </FormField>
        </div>
        {feedback ? (
          <p className={feedback.tone === 'error' ? 'error' : 'notice'} role={feedback.tone === 'error' ? 'alert' : 'status'}>
            {feedback.message}
          </p>
        ) : null}
        <div className="form-actions">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Converting...' : 'Convert Lead'}</Button>
        </div>
      </form>
    </AppShell>
  );
}

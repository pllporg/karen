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
import { Input } from '../../../../components/ui/input';
import { Textarea } from '../../../../components/ui/textarea';
import { createIntakeDraft } from '../../../../lib/intake/leads-api';
import { defaultIntakeWizardForm } from '../../../../lib/intake/intake-wizard-adapter';
import { intakeDraftFields, intakeDraftSchema } from '../../../../lib/schemas/intake';

type IntakeDraftFormValues = z.infer<typeof intakeDraftSchema>;

type FeedbackState = {
  tone: 'notice' | 'error';
  message: string;
};

export default function LeadIntakeDraftPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params.leadId;
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IntakeDraftFormValues>({
    resolver: zodResolver(intakeDraftSchema),
    defaultValues: defaultIntakeWizardForm,
  });

  const submitDraft = handleSubmit(async (values) => {
    setFeedback(null);

    try {
      const result = await createIntakeDraft(leadId, values);
      setFeedback({
        tone: 'notice',
        message: `Intake draft ${result.id} recorded at ${new Date().toLocaleString()}.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to submit intake draft.',
      });
    }
  });

  return (
    <AppShell>
      <PageHeader title="Lead Intake Draft" subtitle="Record intake payload. Stage transitions are managed by Leads API." />
      <StageNav leadId={leadId} active="intake" />
      <form className="card stack-4" onSubmit={submitDraft}>
        <table className="table">
          <thead>
            <tr>
              <th>Field</th>
              <th>Entry</th>
              <th>Validation</th>
            </tr>
          </thead>
          <tbody>
            {intakeDraftFields.map((field) => {
              const error = errors[field.name];
              const errorMessage = typeof error?.message === 'string' ? error.message : undefined;
              const control = field.multiline ? (
                <Textarea {...register(field.name)} invalid={Boolean(errorMessage)} />
              ) : (
                <Input {...register(field.name)} invalid={Boolean(errorMessage)} />
              );

              return (
                <tr key={field.name}>
                  <td>
                    <div className="stack-1">
                      <span className="type-label">{field.label}</span>
                      {field.hint ? <p className="form-field-hint">{field.hint}</p> : null}
                    </div>
                  </td>
                  <td>{control}</td>
                  <td>
                    {errorMessage ? (
                      <p className="form-field-error" role="alert">{errorMessage}</p>
                    ) : (
                      <span className="mono-meta">Valid</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {feedback ? (
          <p className={feedback.tone === 'error' ? 'error' : 'notice'} role={feedback.tone === 'error' ? 'alert' : 'status'}>
            {feedback.message}
          </p>
        ) : null}
        <div className="form-actions">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting Draft...' : 'Submit Intake Draft'}</Button>
        </div>
      </form>
    </AppShell>
  );
}

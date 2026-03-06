'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { AppShell } from '../../../components/app-shell';
import { PageHeader } from '../../../components/page-header';
import { Button } from '../../../components/ui/button';
import { FormField } from '../../../components/ui/form-field';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { createLead } from '../../../lib/intake/leads-api';
import { createLeadSchema } from '../../../lib/schemas/intake';

type CreateLeadFormValues = z.infer<typeof createLeadSchema>;

type FeedbackState = {
  tone: 'notice' | 'error';
  message: string;
};

export default function IntakeNewLeadPage() {
  const router = useRouter();
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateLeadFormValues>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      source: 'Website Form',
      notes: 'Initial queue intake created.',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    setFeedback(null);

    try {
      const lead = await createLead(values);
      setFeedback({
        tone: 'notice',
        message: `Lead ${lead.id} created at ${new Date(lead.createdAt).toLocaleString()}.`,
      });
      router.push(`/intake/${lead.id}/intake`);
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to create lead.',
      });
    }
  });

  return (
    <AppShell>
      <PageHeader title="Create Intake Lead" subtitle="Register lead metadata before staged routing." />
      <form className="card stack-4" onSubmit={onSubmit}>
        <FormField label="Lead Source" name="lead-source" error={errors.source?.message} required>
          <Input {...register('source')} invalid={Boolean(errors.source)} />
        </FormField>
        <FormField
          label="Processing Notes"
          name="lead-notes"
          error={errors.notes?.message}
          hint="Internal-only processing notes recorded with the lead entry."
        >
          <Textarea {...register('notes')} invalid={Boolean(errors.notes)} />
        </FormField>
        {feedback ? (
          <p className={feedback.tone === 'error' ? 'error' : 'notice'} role={feedback.tone === 'error' ? 'alert' : 'status'}>
            {feedback.message}
          </p>
        ) : null}
        <div className="form-actions">
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creating Lead...' : 'Create Lead and Open Intake'}</Button>
        </div>
      </form>
    </AppShell>
  );
}

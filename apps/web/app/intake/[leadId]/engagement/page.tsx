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
import { Input } from '../../../../components/ui/input';
import { generateEngagement, sendEngagement } from '../../../../lib/intake/leads-api';
import { engagementGenerateSchema, engagementSendSchema } from '../../../../lib/schemas/intake';

type EngagementGenerateValues = z.infer<typeof engagementGenerateSchema>;
type EngagementSendValues = z.infer<typeof engagementSendSchema>;

type FeedbackState = {
  tone: 'notice' | 'error';
  message: string;
};

export default function LeadEngagementPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params.leadId;
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const {
    register: registerGenerate,
    handleSubmit: handleGenerateSubmit,
    formState: { errors: generateErrors, isSubmitting: isGenerating },
  } = useForm<EngagementGenerateValues>({
    resolver: zodResolver(engagementGenerateSchema),
    defaultValues: {
      templateId: 'engagement-template-standard',
    },
  });
  const {
    register: registerSend,
    handleSubmit: handleSendSubmit,
    setValue: setSendValue,
    formState: { errors: sendErrors, isSubmitting: isSending },
  } = useForm<EngagementSendValues>({
    resolver: zodResolver(engagementSendSchema),
    defaultValues: {
      envelopeId: '',
    },
  });

  const onGenerate = handleGenerateSubmit(async (values) => {
    setFeedback(null);

    try {
      const envelope = await generateEngagement(leadId, values.templateId);
      setSendValue('envelopeId', envelope.id, { shouldValidate: true, shouldDirty: true });
      setFeedback({
        tone: 'notice',
        message: `Engagement envelope ${envelope.id} generated.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to generate engagement envelope.',
      });
    }
  });

  const onSend = handleSendSubmit(async (values) => {
    setFeedback(null);

    try {
      const envelope = await sendEngagement(leadId, values.envelopeId);
      setFeedback({
        tone: 'notice',
        message: `Engagement envelope ${envelope.id} sent at ${new Date().toLocaleString()}.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to send engagement envelope.',
      });
    }
  });

  return (
    <AppShell>
      <PageHeader title="Engagement Routing" subtitle="Generate and send the engagement packet after conflict resolution." />
      <StageNav leadId={leadId} active="engagement" />
      <div className="card stack-5">
        <form className="stack-4" onSubmit={onGenerate}>
          <FormField
            label="Template ID"
            name="template-id"
            error={generateErrors.templateId?.message}
            required
            hint="Use the approved engagement template identifier for this intake profile."
          >
            <Input {...registerGenerate('templateId')} invalid={Boolean(generateErrors.templateId)} />
          </FormField>
          <div className="form-actions">
            <Button type="submit" disabled={isGenerating}>{isGenerating ? 'Generating...' : 'Generate Envelope'}</Button>
          </div>
        </form>

        <form className="stack-4" onSubmit={onSend}>
          <FormField
            label="Envelope ID"
            name="envelope-id"
            error={sendErrors.envelopeId?.message}
            required
            hint="Review the generated envelope identifier before dispatch."
          >
            <Input {...registerSend('envelopeId')} invalid={Boolean(sendErrors.envelopeId)} />
          </FormField>
          <div className="form-actions">
            <Button type="submit" tone="secondary" disabled={isSending}>{isSending ? 'Sending...' : 'Send Envelope'}</Button>
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

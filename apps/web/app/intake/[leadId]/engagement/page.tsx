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
import { Input } from '../../../../components/ui/input';
import { generateEngagement, sendEngagement } from '../../../../lib/intake/leads-api';
import {
  generateEnvelopeSchema,
  sendEnvelopeSchema,
  type GenerateEnvelopeFormData,
  type SendEnvelopeFormData,
} from '../../../../lib/schemas/engagement';

export default function LeadEngagementPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params.leadId;
  const [status, setStatus] = useState('');
  const [generating, setGenerating] = useState(false);
  const [sending, setSending] = useState(false);
  const {
    register: registerGenerate,
    handleSubmit: handleGenerateSubmit,
    formState: { errors: generateErrors },
  } = useForm<GenerateEnvelopeFormData>({
    resolver: zodResolver(generateEnvelopeSchema),
    mode: 'onBlur',
    defaultValues: {
      templateId: 'engagement-template-standard',
    },
  });
  const {
    register: registerSend,
    handleSubmit: handleSendSubmit,
    setValue: setEnvelopeValue,
    watch,
    formState: { errors: sendErrors },
  } = useForm<SendEnvelopeFormData>({
    resolver: zodResolver(sendEnvelopeSchema),
    mode: 'onBlur',
    defaultValues: {
      envelopeId: '',
    },
  });
  const envelopeId = watch('envelopeId');

  const onGenerate = handleGenerateSubmit(async (data) => {
    setGenerating(true);
    try {
      const envelope = await generateEngagement(leadId, data.templateId);
      setEnvelopeValue('envelopeId', envelope.id, { shouldDirty: true, shouldValidate: true });
      setStatus(`Engagement envelope ${envelope.id} generated.`);
    } finally {
      setGenerating(false);
    }
  });

  const onSend = handleSendSubmit(async (data) => {
    setSending(true);
    try {
      const envelope = await sendEngagement(leadId, data.envelopeId);
      setStatus(`Engagement envelope ${envelope.id} sent at ${new Date().toLocaleString()}.`);
    } finally {
      setSending(false);
    }
  });

  return (
    <AppShell>
      <PageHeader title="Engagement Routing" subtitle="Generate and send the engagement packet after conflict resolution." />
      <StageNav leadId={leadId} active="engagement" />
      <div className="card stack-4">
        <form className="stack-3" onSubmit={onGenerate}>
          <FormField label="Template ID" name="templateId" error={generateErrors.templateId?.message} required>
            <Input {...registerGenerate('templateId')} invalid={!!generateErrors.templateId} />
          </FormField>
          <div className="form-actions">
            <Button type="submit" disabled={generating}>
              {generating ? 'Working...' : 'Generate Envelope'}
            </Button>
          </div>
        </form>
        <form className="stack-3" onSubmit={onSend}>
          <FormField label="Envelope ID" name="envelopeId" error={sendErrors.envelopeId?.message} required>
            <Input {...registerSend('envelopeId')} invalid={!!sendErrors.envelopeId} />
          </FormField>
          <div className="form-actions">
            <Button tone="secondary" type="submit" disabled={!envelopeId || sending}>
              {sending ? 'Working...' : 'Send Envelope'}
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

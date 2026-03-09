'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useFieldArray, useForm } from 'react-hook-form';
import { AppShell } from '../../../../components/app-shell';
import { EngagementPreview } from '../../../../components/intake/engagement-preview';
import { EsignStatusTracker } from '../../../../components/intake/esign-status-tracker';
import type { EngagementTemplateOption } from '../../../../components/intake/template-picker';
import { StageNav } from '../../../../components/intake/stage-nav';
import { EmptyState } from '../../../../components/empty-state';
import { LoadingState } from '../../../../components/loading-state';
import { PageHeader } from '../../../../components/page-header';
import { Button } from '../../../../components/ui/button';
import { FormField } from '../../../../components/ui/form-field';
import { Input } from '../../../../components/ui/input';
import {
  generateEngagement,
  getLatestEngagementEnvelope,
  sendEngagement,
  type EngagementEnvelopeRecord,
} from '../../../../lib/intake/leads-api';
import { generateEngagementSchema, sendEngagementSchema } from '../../../../lib/schemas/engagement';

type FeedbackState = {
  tone: 'notice' | 'error';
  message: string;
};

const TemplatePicker = dynamic(
  () => import('../../../../components/intake/template-picker').then((module) => module.TemplatePicker),
  {
    loading: () => <DeferredEngagementSection sectionName="Template" />,
  },
);

const FeeArrangementForm = dynamic(
  () => import('../../../../components/intake/fee-arrangement-form').then((module) => module.FeeArrangementForm),
  {
    loading: () => <DeferredEngagementSection sectionName="Fee Arrangement" />,
  },
);

const templateOptions: EngagementTemplateOption[] = [
  {
    id: 'engagement-template-standard',
    name: 'Standard Hourly',
    detail: 'Hourly rate + retainer letter for active litigation intake.',
  },
  {
    id: 'engagement-template-contingency',
    name: 'Contingency 33/40',
    detail: 'Pre-suit / post-filing contingency engagement packet.',
  },
  {
    id: 'engagement-template-flat-fee',
    name: 'Flat Fee',
    detail: 'Fixed fee engagement letter for scoped review work.',
  },
];

function normalizeEngagementStatus(status?: string | null) {
  if (!status) return 'DRAFT';
  if (status === 'PENDING_SIGNATURE') return 'IN_REVIEW';
  if (status === 'VOIDED' || status === 'ERROR') return 'DECLINED';
  return status;
}

function readPayloadValue(payload: Record<string, unknown> | null | undefined, key: string) {
  const value = payload?.[key];
  return typeof value === 'string' ? value : '';
}

function readPayloadNumber(payload: Record<string, unknown> | null | undefined, key: string) {
  const value = payload?.[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function readSecondaryRecipients(payload: Record<string, unknown> | null | undefined) {
  const raw = payload?.secondaryRecipients;
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      if (!entry || typeof entry !== 'object') return null;
      const record = entry as Record<string, unknown>;
      return {
        name: typeof record.name === 'string' ? record.name : '',
        email: typeof record.email === 'string' ? record.email : '',
      };
    })
    .filter((entry): entry is { name: string; email: string } => Boolean(entry));
}

function DeferredEngagementSection({ sectionName }: { sectionName: string }) {
  return (
    <div className="card stack-2" role="status" aria-live="polite">
      <p className="meta-note">Section Load</p>
      <h3 style={{ marginTop: 0 }}>{sectionName}</h3>
      <p style={{ color: 'var(--lic-text-muted)' }}>Loading engagement controls.</p>
    </div>
  );
}

export default function LeadEngagementPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params.leadId;
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [envelope, setEnvelope] = useState<EngagementEnvelopeRecord | null>(null);
  const [loadingEnvelope, setLoadingEnvelope] = useState(true);

  const generateForm = useForm({
    resolver: zodResolver(generateEngagementSchema),
    defaultValues: {
      templateId: 'engagement-template-standard',
      feeType: 'HOURLY' as const,
      rate: 350,
      retainerAmount: 5000,
    },
  });
  const sendForm = useForm({
    resolver: zodResolver(sendEngagementSchema),
    defaultValues: {
      recipientName: '',
      recipientEmail: '',
      secondaryRecipients: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: sendForm.control,
    name: 'secondaryRecipients',
  });

  const selectedTemplateId = generateForm.watch('templateId');
  const feeType = generateForm.watch('feeType');
  const rate = generateForm.watch('rate');
  const retainerAmount = generateForm.watch('retainerAmount');
  const recipientName = sendForm.watch('recipientName');
  const recipientEmail = sendForm.watch('recipientEmail');
  const secondaryRecipients = sendForm.watch('secondaryRecipients') ?? [];
  const selectedTemplate = useMemo(
    () => templateOptions.find((option) => option.id === selectedTemplateId) ?? templateOptions[0],
    [selectedTemplateId],
  );

  const refreshEnvelope = async () => {
    setLoadingEnvelope(true);
    try {
      const latest = await getLatestEngagementEnvelope(leadId);
      setEnvelope(latest);
      if (latest?.payloadJson && typeof latest.payloadJson === 'object') {
        const payload = latest.payloadJson as Record<string, unknown>;
        generateForm.reset({
          templateId: readPayloadValue(payload, 'templateId') || generateForm.getValues('templateId'),
          feeType:
            (readPayloadValue(payload, 'feeType') as 'HOURLY' | 'CONTINGENCY' | 'FLAT' | '') || generateForm.getValues('feeType'),
          rate: readPayloadNumber(payload, 'rate') ?? generateForm.getValues('rate'),
          retainerAmount: readPayloadNumber(payload, 'retainerAmount') ?? generateForm.getValues('retainerAmount'),
        });
        sendForm.reset({
          recipientName: readPayloadValue(payload, 'recipientName'),
          recipientEmail: readPayloadValue(payload, 'recipientEmail'),
          secondaryRecipients: readSecondaryRecipients(payload),
        });
      }
    } catch {
      setEnvelope(null);
    } finally {
      setLoadingEnvelope(false);
    }
  };

  useEffect(() => {
    void refreshEnvelope();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  const onGenerate = generateForm.handleSubmit(async (values) => {
    setFeedback(null);
    const recipientValues = sendForm.getValues();

    try {
      const nextEnvelope = await generateEngagement(leadId, values.templateId, {
        templateId: values.templateId,
        feeType: values.feeType,
        rate: values.rate ?? null,
        retainerAmount: values.retainerAmount ?? null,
        recipientName: recipientValues.recipientName,
        recipientEmail: recipientValues.recipientEmail,
        secondaryRecipients: recipientValues.secondaryRecipients,
      });
      setEnvelope(nextEnvelope);
      setFeedback({
        tone: 'notice',
        message: `Engagement envelope ${nextEnvelope.id} generated in ${normalizeEngagementStatus(nextEnvelope.status)} status.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to generate engagement envelope.',
      });
    }
  });

  const onSend = sendForm.handleSubmit(async () => {
    if (!envelope) {
      setFeedback({ tone: 'error', message: 'Generate an envelope before sending.' });
      return;
    }

    setFeedback(null);

    try {
      const nextEnvelope = await sendEngagement(leadId, envelope.id);
      setEnvelope(nextEnvelope);
      setFeedback({
        tone: 'notice',
        message: `Engagement envelope ${nextEnvelope.id} sent at ${new Date(nextEnvelope.updatedAt).toLocaleString()}.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to send engagement envelope.',
      });
    }
  });

  const normalizedStatus = normalizeEngagementStatus(envelope?.status);
  const canProceed = normalizedStatus === 'SIGNED';

  return (
    <AppShell>
      <PageHeader title="Engagement Letter" subtitle="Generate, review, and send engagement documents after cleared conflicts." />
      <StageNav leadId={leadId} active="engagement" />
      <div className="card stack-5">
        <section className="stack-3">
          <div className="stack-1">
            <h2>Template</h2>
            <p className="form-field-hint">Select the approved engagement form for this intake profile.</p>
          </div>
          <TemplatePicker
            options={templateOptions}
            selectedId={selectedTemplateId}
            onSelect={(templateId) => generateForm.setValue('templateId', templateId, { shouldDirty: true, shouldValidate: true })}
          />
        </section>

        <FormProvider {...generateForm}>
          <form className="stack-4" onSubmit={onGenerate}>
            <section className="stack-3">
              <div className="stack-1">
                <h2>Fee Arrangement</h2>
                <p className="form-field-hint">Review fee structure before generating the engagement packet.</p>
              </div>
              <FeeArrangementForm />
            </section>
            <div className="form-actions">
              <Button type="submit" disabled={generateForm.formState.isSubmitting}>
                {generateForm.formState.isSubmitting ? 'Generating...' : 'Generate Engagement Letter'}
              </Button>
            </div>
          </form>
        </FormProvider>

        <form className="stack-4" onSubmit={onSend}>
          <section className="stack-3">
            <div className="stack-1">
              <h2>Recipients</h2>
              <p className="form-field-hint">These recipients are stored in the envelope payload for attorney review.</p>
            </div>
            <div className="form-grid-2">
              <FormField label="Recipient Name" name="engagement-recipient-name" error={sendForm.formState.errors.recipientName?.message} required>
                <Input {...sendForm.register('recipientName')} invalid={Boolean(sendForm.formState.errors.recipientName)} />
              </FormField>
              <FormField label="Recipient Email" name="engagement-recipient-email" error={sendForm.formState.errors.recipientEmail?.message} required>
                <Input {...sendForm.register('recipientEmail')} type="email" invalid={Boolean(sendForm.formState.errors.recipientEmail)} />
              </FormField>
            </div>

            <div className="stack-3">
              <div className="row-between">
                <div className="stack-1">
                  <h3>Secondary Recipients</h3>
                  <p className="form-field-hint">Add co-clients or copied recipients before dispatch.</p>
                </div>
                <Button
                  type="button"
                  tone="ghost"
                  onClick={() => append({ name: '', email: '' })}
                >
                  Add Secondary Recipient
                </Button>
              </div>

              {fields.length ? (
                <div className="stack-2">
                  {fields.map((field, index) => (
                    <div key={field.id} className="engagement-secondary-row">
                      <FormField
                        label={`Secondary Recipient ${index + 1} Name`}
                        name={`engagement-secondary-name-${index}`}
                        error={sendForm.formState.errors.secondaryRecipients?.[index]?.name?.message}
                        required
                      >
                        <Input
                          {...sendForm.register(`secondaryRecipients.${index}.name`)}
                          invalid={Boolean(sendForm.formState.errors.secondaryRecipients?.[index]?.name)}
                        />
                      </FormField>
                      <FormField
                        label={`Secondary Recipient ${index + 1} Email`}
                        name={`engagement-secondary-email-${index}`}
                        error={sendForm.formState.errors.secondaryRecipients?.[index]?.email?.message}
                        required
                      >
                        <Input
                          {...sendForm.register(`secondaryRecipients.${index}.email`)}
                          type="email"
                          invalid={Boolean(sendForm.formState.errors.secondaryRecipients?.[index]?.email)}
                        />
                      </FormField>
                      <Button type="button" tone="danger" onClick={() => remove(index)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>

            <div className="form-actions">
              <Button type="submit" tone="secondary" disabled={sendForm.formState.isSubmitting || !envelope}>
                {sendForm.formState.isSubmitting ? 'Sending...' : 'Send Envelope'}
              </Button>
              <Button type="button" tone="ghost" onClick={() => void refreshEnvelope()}>
                Refresh Status
              </Button>
            </div>
          </section>
        </form>

        <section className="stack-3">
          <div className="row-between">
            <div className="stack-1">
              <h2>Envelope Status</h2>
              <p className="form-field-hint">Engagement must be signed before conversion can proceed.</p>
            </div>
            {envelope ? <span className="mono-meta">Envelope {envelope.id}</span> : null}
          </div>

          {loadingEnvelope ? <LoadingState label="Loading engagement status..." /> : null}
          {!loadingEnvelope && !envelope ? (
            <EmptyState message="No envelope generated yet. Generate an engagement packet to begin the e-sign lifecycle." />
          ) : null}
          {envelope ? (
            <>
              <EsignStatusTracker status={normalizedStatus} />
              <EngagementPreview
                envelope={envelope}
                templateName={selectedTemplate.name}
                feeType={feeType}
                rate={typeof rate === 'number' ? rate : undefined}
                retainerAmount={typeof retainerAmount === 'number' ? retainerAmount : undefined}
                recipientName={recipientName}
                recipientEmail={recipientEmail}
                secondaryRecipients={secondaryRecipients}
              />
            </>
          ) : null}
        </section>

        <div className="conflict-gate">
          <div className="stack-1">
            <h3>Gate</h3>
            <p className="form-field-hint">Proceed to conversion only when the latest envelope is signed.</p>
            <p className="mono-meta">
              {canProceed
                ? 'Signed engagement on file.'
                : envelope
                  ? `Current status: ${normalizedStatus}. Conversion remains locked.`
                  : 'Generate and send an envelope before conversion.'}
            </p>
          </div>
          {canProceed ? (
            <Link className="button" href={`/intake/${leadId}/convert`}>
              Proceed to Convert
            </Link>
          ) : (
            <Button type="button" disabled>
              Proceed to Convert
            </Button>
          )}
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

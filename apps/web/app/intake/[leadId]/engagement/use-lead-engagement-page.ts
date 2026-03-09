'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { useParams } from 'next/navigation';
import type { EngagementTemplateOption } from '../../../../components/intake/template-picker';
import {
  generateEngagement,
  getLatestEngagementEnvelope,
  sendEngagement,
  type EngagementEnvelopeRecord,
} from '../../../../lib/intake/leads-api';
import { generateEngagementSchema, sendEngagementSchema } from '../../../../lib/schemas/engagement';

export type FeedbackState = {
  tone: 'notice' | 'error';
  message: string;
};

export const templateOptions: EngagementTemplateOption[] = [
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

export function normalizeEngagementStatus(status?: string | null) {
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

export function useLeadEngagementPage() {
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

  return {
    leadId,
    feedback,
    envelope,
    loadingEnvelope,
    generateForm,
    sendForm,
    fields,
    selectedTemplateId,
    feeType,
    rate,
    retainerAmount,
    recipientName,
    recipientEmail,
    secondaryRecipients,
    selectedTemplate,
    refreshEnvelope,
    onGenerate,
    onSend,
    normalizedStatus,
    canProceed: normalizedStatus === 'SIGNED',
    addSecondaryRecipient: () => append({ name: '', email: '' }),
    removeSecondaryRecipient: remove,
  };
}

export type LeadEngagementPageState = ReturnType<typeof useLeadEngagementPage>;

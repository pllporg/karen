'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { type ToastItem } from '../../components/toast-stack';
import { apiFetch, getSessionToken } from '../../lib/api';
import { portalMessageSchema, portalWorkflowSchema, type PortalMessageFormData, type PortalWorkflowFormData } from '../../lib/schemas/portal';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

type PortalConfirmAction = 'send-message' | 'create-esign' | null;

type PortalMatterOption = {
  id: string;
  matterNumber?: string | null;
  name?: string | null;
};

type PortalLookupOption = {
  id: string;
  name: string;
};

type PortalSnapshotDocument = {
  id: string;
  matterId?: string | null;
  title?: string | null;
  sharedAt?: string | null;
  updatedAt?: string | null;
  latestVersion?: { id?: string | null } | null;
};

type PortalMessageAttachment = {
  documentVersionId: string;
  title: string;
};

type PortalSnapshotMessage = {
  id: string;
  subject?: string | null;
  body?: string | null;
  attachments?: PortalMessageAttachment[];
};

type PortalSnapshotEsignEnvelope = {
  id: string;
  status?: string | null;
  provider?: string | null;
  engagementLetterTemplate?: { id?: string | null; name?: string | null } | null;
};

type PortalSnapshot = {
  matters?: PortalMatterOption[];
  keyDates?: Array<{ id: string }>;
  invoices?: Array<{ id: string }>;
  messages?: PortalSnapshotMessage[];
  documents?: PortalSnapshotDocument[];
  eSignEnvelopes?: PortalSnapshotEsignEnvelope[];
};

function firstFileFromValue(value: unknown): File | null {
  if (value instanceof File) return value;
  if (Array.isArray(value)) return value[0] instanceof File ? value[0] : null;
  if (!value || typeof value !== 'object') return null;

  const maybeFileList = value as { item?: (index: number) => File | null; 0?: unknown };
  if (typeof maybeFileList.item === 'function') {
    return maybeFileList.item(0);
  }
  if (maybeFileList[0] instanceof File) {
    return maybeFileList[0];
  }
  return null;
}

function formatPortalMatterLabel(matter: PortalMatterOption | null | undefined): string {
  if (!matter) return 'Matter';
  const matterNumber = matter.matterNumber?.trim();
  const name = matter.name?.trim();
  if (matterNumber && name) return `${matterNumber} - ${name}`;
  if (name) return name;
  if (matterNumber) return matterNumber;
  return 'Matter';
}

function formatPortalDocumentMetadata(document: PortalSnapshotDocument, matterLabelById: Map<string, string>): string {
  const matterLabel = document.matterId ? matterLabelById.get(document.matterId) || 'Matter' : 'Matter';
  const timestampValue = document.sharedAt || document.updatedAt;
  if (!timestampValue) return matterLabel;
  const sharedAt = new Date(timestampValue);
  if (Number.isNaN(sharedAt.getTime())) return matterLabel;
  return `${matterLabel} | Shared ${sharedAt.toLocaleString()}`;
}

function formatFeedbackTimestamp(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(date);
}

export function usePortalPage() {
  const [snapshot, setSnapshot] = useState<PortalSnapshot | null>(null);
  const [matterOptions, setMatterOptions] = useState<PortalMatterOption[]>([]);
  const [intakeFormOptions, setIntakeFormOptions] = useState<PortalLookupOption[]>([]);
  const [engagementTemplateOptions, setEngagementTemplateOptions] = useState<PortalLookupOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [statusText, setStatusText] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmAction, setConfirmAction] = useState<PortalConfirmAction>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [intakeBusy, setIntakeBusy] = useState(false);
  const [refreshBusyId, setRefreshBusyId] = useState<string | null>(null);

  const {
    register: registerMessage,
    handleSubmit: handleMessageSubmit,
    watch: watchMessageValues,
    getValues: getMessageValues,
    setValue: setMessageValue,
    resetField: resetMessageField,
  } = useForm<PortalMessageFormData>({
    resolver: zodResolver(portalMessageSchema),
    mode: 'onBlur',
    defaultValues: {
      matterId: '',
      message: 'Can you share the latest mediation timeline?',
      attachmentTitle: '',
    },
  });

  const {
    register: registerWorkflow,
    watch: watchWorkflowValues,
    getValues: getWorkflowValues,
    setValue: setWorkflowValue,
  } = useForm<PortalWorkflowFormData>({
    resolver: zodResolver(portalWorkflowSchema),
    mode: 'onBlur',
    defaultValues: {
      matterId: '',
      intakeFormDefinitionId: '',
      engagementLetterTemplateId: '',
      eSignProvider: 'stub',
    },
  });

  const messageMatterId = watchMessageValues('matterId');
  const intakeFormDefinitionId = watchWorkflowValues('intakeFormDefinitionId');
  const engagementLetterTemplateId = watchWorkflowValues('engagementLetterTemplateId');
  const eSignProvider = watchWorkflowValues('eSignProvider');
  const matterLabelById = useMemo(
    () => new Map(matterOptions.map((matter) => [matter.id, formatPortalMatterLabel(matter)])),
    [matterOptions],
  );

  function pushToast(tone: ToastItem['tone'], title: string, detail: string) {
    setToasts((current) => [
      ...current,
      {
        id: `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`,
        tone,
        title,
        detail,
        occurredAt: formatFeedbackTimestamp(new Date()),
      },
    ]);
  }

  function dismissToast(id: string) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }

  const syncSelectedMatter = useCallback(
    (nextMatterId: string) => {
      setMessageValue('matterId', nextMatterId, { shouldDirty: true, shouldValidate: true });
      setWorkflowValue('matterId', nextMatterId, { shouldDirty: true });
    },
    [setMessageValue, setWorkflowValue],
  );

  const loadPortalData = useCallback(async () => {
    const [nextSnapshot, nextIntakeForms, nextTemplates] = await Promise.all([
      apiFetch<PortalSnapshot>('/portal/snapshot'),
      apiFetch<PortalLookupOption[]>('/portal/intake-form-definitions').catch(() => []),
      apiFetch<PortalLookupOption[]>('/portal/engagement-letter-templates').catch(() => []),
    ]);

    const matters = Array.isArray(nextSnapshot?.matters) ? nextSnapshot.matters : [];
    setSnapshot(nextSnapshot);
    setMatterOptions(matters);
    setIntakeFormOptions(Array.isArray(nextIntakeForms) ? nextIntakeForms : []);
    setEngagementTemplateOptions(Array.isArray(nextTemplates) ? nextTemplates : []);

    const currentMatterId = getMessageValues('matterId');
    const resolvedMatterId = currentMatterId || matters[0]?.id || '';
    syncSelectedMatter(resolvedMatterId);

    const currentIntakeId = getWorkflowValues('intakeFormDefinitionId');
    if (!currentIntakeId && nextIntakeForms[0]?.id) {
      setWorkflowValue('intakeFormDefinitionId', nextIntakeForms[0].id);
    }

    const currentTemplateId = getWorkflowValues('engagementLetterTemplateId');
    if (!currentTemplateId && nextTemplates[0]?.id) {
      setWorkflowValue('engagementLetterTemplateId', nextTemplates[0].id);
    }
  }, [getMessageValues, getWorkflowValues, setWorkflowValue, syncSelectedMatter]);

  useEffect(() => {
    loadPortalData().catch(() => undefined);
  }, [loadPortalData]);

  const sendPortalMessage = handleMessageSubmit(async () => {
    if (!messageMatterId) return;
    setError(null);
    setStatusText('Portal message queued for review. Awaiting operator approval.');
    setConfirmAction('send-message');
  });

  async function executeSendPortalMessage() {
    const values = getMessageValues();
    if (!values.matterId) {
      throw new Error('Matter selection required for portal message send.');
    }
    setError(null);

    const attachmentFile = firstFileFromValue(values.attachmentFile);
    let attachmentVersionIds: string[] | undefined;
    if (attachmentFile) {
      const form = new FormData();
      form.set('matterId', values.matterId);
      form.set('title', values.attachmentTitle?.trim() || attachmentFile.name);
      form.set('file', attachmentFile);

      const token = getSessionToken();
      const uploadResponse = await fetch(`${API_BASE}/portal/attachments/upload`, {
        method: 'POST',
        body: form,
        headers: token ? { 'x-session-token': token } : undefined,
        credentials: 'include',
      });

      if (!uploadResponse.ok) {
        throw new Error((await uploadResponse.text()) || 'Failed to upload portal attachment');
      }

      const uploaded = (await uploadResponse.json()) as { version?: { id?: string } };
      attachmentVersionIds = uploaded?.version?.id ? [uploaded.version.id] : undefined;
    }

    await apiFetch('/portal/messages', {
      method: 'POST',
      body: JSON.stringify({
        matterId: values.matterId,
        body: values.message,
        ...(attachmentVersionIds?.length ? { attachmentVersionIds } : {}),
      }),
    });

    resetMessageField('attachmentFile');
    setMessageValue('attachmentTitle', '');
    await loadPortalData();
  }

  async function downloadPortalAttachment(versionId: string) {
    const result = await apiFetch<{ url: string }>(`/portal/attachments/${versionId}/download-url`);
    if (typeof window !== 'undefined') {
      window.open(result.url, '_blank', 'noopener,noreferrer');
    }
  }

  async function submitIntake() {
    const values = getWorkflowValues();
    if (!values.intakeFormDefinitionId) return;
    setError(null);
    setStatusText('Submitting intake workflow...');
    setIntakeBusy(true);

    try {
      await apiFetch('/portal/intake-submissions', {
        method: 'POST',
        body: JSON.stringify({
          intakeFormDefinitionId: values.intakeFormDefinitionId,
          matterId: values.matterId || undefined,
          data: { homeownerGoal: 'Resolve defect damages and warranty claims' },
        }),
      });

      await loadPortalData();
      setStatusText(null);
      pushToast('success', 'Intake Submission Recorded', 'Portal intake submission logged and snapshot refreshed.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to submit intake workflow');
      setStatusText(null);
    } finally {
      setIntakeBusy(false);
    }
  }

  async function createEsignEnvelope() {
    const values = getWorkflowValues();
    if (!values.engagementLetterTemplateId) return;
    setError(null);
    setStatusText('E-sign dispatch queued for review. Awaiting operator approval.');
    setConfirmAction('create-esign');
  }

  async function executeCreateEsignEnvelope() {
    const values = getWorkflowValues();
    if (!values.engagementLetterTemplateId) return;

    await apiFetch('/portal/esign', {
      method: 'POST',
      body: JSON.stringify({
        engagementLetterTemplateId: values.engagementLetterTemplateId,
        matterId: values.matterId || undefined,
        provider: values.eSignProvider,
      }),
    });

    await loadPortalData();
  }

  async function confirmClientAction() {
    setConfirmBusy(true);
    setError(null);
    setStatusText(
      confirmAction === 'create-esign' ? 'Dispatching approved e-sign workflow...' : 'Sending approved portal message...',
    );
    try {
      if (confirmAction === 'send-message') {
        await executeSendPortalMessage();
        pushToast('success', 'Portal Message Sent', 'Client message dispatched after explicit review approval.');
      }
      if (confirmAction === 'create-esign') {
        await executeCreateEsignEnvelope();
        pushToast('warning', 'E-Sign Envelope Dispatched', 'External envelope workflow dispatched after explicit review approval.');
      }
      setStatusText(null);
      setConfirmAction(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Failed to complete client-facing action');
      setStatusText(null);
      setConfirmAction(null);
    } finally {
      setConfirmBusy(false);
    }
  }

  async function refreshEsignEnvelope(envelopeId: string) {
    setError(null);
    setStatusText(`Refreshing envelope ${envelopeId} status...`);
    setRefreshBusyId(envelopeId);

    try {
      await apiFetch(`/portal/esign/${envelopeId}/refresh`, {
        method: 'POST',
      });
      await loadPortalData();
      setStatusText(null);
      pushToast('success', 'E-Sign Status Refreshed', `Envelope ${envelopeId} status refreshed from provider.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : `Failed to refresh envelope ${envelopeId}`);
      setStatusText(null);
    } finally {
      setRefreshBusyId(null);
    }
  }

  function formatMatterLabel(matter: PortalMatterOption): string {
    return formatPortalMatterLabel(matter);
  }

  function formatDocumentMetadata(document: PortalSnapshotDocument): string {
    return formatPortalDocumentMetadata(document, matterLabelById);
  }

  return {
    snapshot,
    matterOptions,
    intakeFormOptions,
    engagementTemplateOptions,
    error,
    statusText,
    toasts,
    confirmAction,
    confirmBusy,
    intakeBusy,
    refreshBusyId,
    registerMessage,
    registerWorkflow,
    messageMatterId,
    intakeFormDefinitionId,
    engagementLetterTemplateId,
    eSignProvider,
    syncSelectedMatter,
    sendPortalMessage,
    downloadPortalAttachment,
    submitIntake,
    createEsignEnvelope,
    confirmClientAction,
    refreshEsignEnvelope,
    setConfirmAction,
    dismissToast,
    formatMatterLabel,
    formatDocumentMetadata,
  };
}

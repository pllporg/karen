'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { getSessionToken } from '../../lib/api';
import {
  retentionScopeSchema,
  retentionWorkflowSchema,
  uploadDocumentWorkflowSchema,
  generatePdfWorkflowSchema,
  type RetentionWorkflowFormData,
  type UploadDocumentWorkflowFormData,
  type GeneratePdfWorkflowFormData,
} from '../../lib/schemas/documents-page';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

type MatterLookup = {
  id: string;
  matterNumber: string;
  name: string;
  label: string;
};

type DocumentRow = {
  id: string;
  matterId?: string | null;
  matter?: {
    name?: string | null;
  } | null;
  title: string;
  versions?: Array<{ id: string }>;
  sharedWithClient?: boolean;
  retentionPolicy?: {
    id?: string;
    name?: string;
  } | null;
  legalHoldActive?: boolean;
  dispositionStatus?: string | null;
};

type RetentionPolicy = {
  id: string;
  name: string;
  scope: (typeof retentionScopeSchema._type);
  retentionDays: number;
};

type DispositionRun = {
  id: string;
  status: string;
  cutoffAt: string;
  items?: Array<{ id?: string }>;
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

export function useDocumentsPage() {
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [matterOptions, setMatterOptions] = useState<MatterLookup[]>([]);
  const [retentionPolicies, setRetentionPolicies] = useState<RetentionPolicy[]>([]);
  const [dispositionRuns, setDispositionRuns] = useState<DispositionRun[]>([]);
  const [retentionStatus, setRetentionStatus] = useState<string | null>(null);

  const {
    register: registerUpload,
    handleSubmit: handleUploadSubmit,
    setValue: setUploadValue,
    getValues: getUploadValues,
    formState: { errors: uploadErrors, isSubmitting: uploading },
  } = useForm<UploadDocumentWorkflowFormData>({
    resolver: zodResolver(uploadDocumentWorkflowSchema),
    mode: 'onBlur',
    defaultValues: {
      matterId: '',
      title: 'Inspection Report',
    },
  });

  const {
    register: registerPdf,
    handleSubmit: handlePdfSubmit,
    setValue: setPdfValue,
    getValues: getPdfValues,
    formState: { isSubmitting: generatingPdf },
  } = useForm<GeneratePdfWorkflowFormData>({
    resolver: zodResolver(generatePdfWorkflowSchema),
    mode: 'onBlur',
    defaultValues: {
      matterId: '',
    },
  });

  const {
    register: registerRetention,
    handleSubmit: handleRetentionSubmit,
    setValue: setRetentionValue,
    getValues: getRetentionValues,
    formState: { errors: retentionErrors, isSubmitting: creatingPolicy },
  } = useForm<RetentionWorkflowFormData>({
    resolver: zodResolver(retentionWorkflowSchema),
    mode: 'onBlur',
    defaultValues: {
      policyName: 'Default 7-year retention',
      policyScope: 'ALL_DOCUMENTS',
      policyTrigger: 'DOCUMENT_UPLOADED',
      policyRetentionDays: '2555',
      selectedPolicyId: '',
    },
  });

  function resolveMatterLabel(matterId: string | null | undefined): string {
    if (!matterId) return '-';
    return matterOptions.find((matter) => matter.id === matterId)?.label || matterId;
  }

  const loadDocuments = useCallback(async () => {
    const token = getSessionToken();
    const response = await fetch(`${API_BASE}/documents`, {
      headers: token ? { 'x-session-token': token } : {},
      credentials: 'include',
    });
    if (!response.ok) return;
    setDocuments((await response.json()) as DocumentRow[]);
  }, []);

  const loadMatterLookups = useCallback(async () => {
    const token = getSessionToken();
    const response = await fetch(`${API_BASE}/lookups/matters?limit=200`, {
      headers: token ? { 'x-session-token': token } : {},
      credentials: 'include',
    });
    if (!response.ok) return;

    const matters = (await response.json()) as MatterLookup[];
    setMatterOptions(matters);

    if (!getUploadValues('matterId')) {
      setUploadValue('matterId', matters[0]?.id || '');
    }
    if (!getPdfValues('matterId')) {
      setPdfValue('matterId', matters[0]?.id || '');
    }
  }, [getPdfValues, getUploadValues, setPdfValue, setUploadValue]);

  const loadRetentionData = useCallback(async () => {
    const token = getSessionToken();
    const [policiesResponse, runsResponse] = await Promise.all([
      fetch(`${API_BASE}/documents/retention/policies`, {
        headers: token ? { 'x-session-token': token } : {},
        credentials: 'include',
      }),
      fetch(`${API_BASE}/documents/disposition/runs`, {
        headers: token ? { 'x-session-token': token } : {},
        credentials: 'include',
      }),
    ]);

    if (policiesResponse.ok) {
      const policies = (await policiesResponse.json()) as RetentionPolicy[];
      setRetentionPolicies(policies);
      if (!getRetentionValues('selectedPolicyId') && policies.length > 0) {
        setRetentionValue('selectedPolicyId', policies[0].id);
      }
    }

    if (runsResponse.ok) {
      setDispositionRuns((await runsResponse.json()) as DispositionRun[]);
    }
  }, [getRetentionValues, setRetentionValue]);

  useEffect(() => {
    Promise.all([loadDocuments(), loadMatterLookups()]).catch(() => undefined);
  }, [loadDocuments, loadMatterLookups]);

  const upload = handleUploadSubmit(async (data) => {
    const file = firstFileFromValue(data.file);
    if (!file || !data.matterId) return;

    const form = new FormData();
    form.set('matterId', data.matterId);
    form.set('title', data.title);
    form.set('file', file);

    const token = getSessionToken();
    await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: form,
      headers: token ? { 'x-session-token': token } : undefined,
      credentials: 'include',
    });

    await loadDocuments();
  });

  const generatePdf = handlePdfSubmit(async (data) => {
    if (!data.matterId) return;

    const token = getSessionToken();
    await fetch(`${API_BASE}/documents/generate-pdf`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'x-session-token': token } : {}),
      },
      body: JSON.stringify({
        matterId: data.matterId,
        title: 'Generated Client Letter',
        lines: ['Attorney Review Required', 'Draft letter body here.'],
      }),
      credentials: 'include',
    });

    await loadDocuments();
  });

  const createRetentionPolicy = handleRetentionSubmit(async (data) => {
    const token = getSessionToken();
    const response = await fetch(`${API_BASE}/documents/retention/policies`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'x-session-token': token } : {}),
      },
      body: JSON.stringify({
        name: data.policyName,
        scope: data.policyScope,
        trigger: data.policyTrigger,
        retentionDays: Number(data.policyRetentionDays),
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      setRetentionStatus('Failed to create retention policy.');
      return;
    }

    const created = (await response.json()) as { id?: string; name: string };
    setRetentionStatus(`Created retention policy ${created.name}.`);
    await loadRetentionData();

    if (created.id) {
      setRetentionValue('selectedPolicyId', created.id);
    }
  });

  async function assignRetentionPolicy(documentId: string) {
    const selectedPolicyId = getRetentionValues('selectedPolicyId');
    if (!selectedPolicyId) {
      setRetentionStatus('Select a retention policy first.');
      return;
    }

    const token = getSessionToken();
    await fetch(`${API_BASE}/documents/${documentId}/retention-policy`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'x-session-token': token } : {}),
      },
      body: JSON.stringify({ policyId: selectedPolicyId }),
      credentials: 'include',
    });

    setRetentionStatus('Assigned retention policy to document.');
    await loadDocuments();
  }

  async function placeLegalHold(documentId: string) {
    const token = getSessionToken();
    await fetch(`${API_BASE}/documents/${documentId}/legal-hold`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'x-session-token': token } : {}),
      },
      body: JSON.stringify({
        reason: 'Attorney requested preservation pending dispute resolution.',
      }),
      credentials: 'include',
    });

    setRetentionStatus('Placed legal hold on document.');
    await loadDocuments();
  }

  async function releaseLegalHold(documentId: string) {
    const token = getSessionToken();
    await fetch(`${API_BASE}/documents/${documentId}/legal-hold/release`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'x-session-token': token } : {}),
      },
      body: JSON.stringify({
        reason: 'Matter hold release approved by supervising attorney.',
      }),
      credentials: 'include',
    });

    setRetentionStatus('Released legal hold on document.');
    await loadDocuments();
  }

  async function createDispositionRun() {
    const token = getSessionToken();
    await fetch(`${API_BASE}/documents/disposition/runs`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'x-session-token': token } : {}),
      },
      body: JSON.stringify({
        policyId: getRetentionValues('selectedPolicyId') || undefined,
      }),
      credentials: 'include',
    });

    setRetentionStatus('Created disposition run.');
    await loadRetentionData();
  }

  async function approveDispositionRun(runId: string) {
    const token = getSessionToken();
    await fetch(`${API_BASE}/documents/disposition/runs/${runId}/approve`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'x-session-token': token } : {}),
      },
      body: JSON.stringify({ notes: 'Approved by attorney.' }),
      credentials: 'include',
    });

    setRetentionStatus('Approved disposition run.');
    await loadRetentionData();
  }

  async function executeDispositionRun(runId: string) {
    const token = getSessionToken();
    await fetch(`${API_BASE}/documents/disposition/runs/${runId}/execute`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'x-session-token': token } : {}),
      },
      body: JSON.stringify({ notes: 'Executed after approval.' }),
      credentials: 'include',
    });

    setRetentionStatus('Executed disposition run.');
    await loadRetentionData();
    await loadDocuments();
  }

  return {
    documents,
    matterOptions,
    retentionPolicies,
    dispositionRuns,
    retentionStatus,
    registerUpload,
    registerPdf,
    registerRetention,
    uploadErrors,
    retentionErrors,
    uploading,
    generatingPdf,
    creatingPolicy,
    upload,
    generatePdf,
    createRetentionPolicy,
    assignRetentionPolicy,
    placeLegalHold,
    releaseLegalHold,
    loadRetentionData,
    createDispositionRun,
    approveDispositionRun,
    executeDispositionRun,
    resolveMatterLabel,
  };
}

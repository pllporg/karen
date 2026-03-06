'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { apiFetch } from '../../lib/api';
import {
  createInvoiceSchema,
  createLedesJobSchema,
  createLedesProfileSchema,
  createReconciliationRunSchema,
  type CreateInvoiceFormData,
  type CreateLedesJobFormData,
  type CreateLedesProfileFormData,
  type CreateReconciliationRunFormData,
} from '../../lib/schemas/billing';

export type MatterLookup = { id: string; matterNumber: string; name: string; label: string };
export type TrustAccountLookup = { id: string; name: string; label: string };
export type InvoiceLookup = { id: string; invoiceNumber: string; label: string };

export type BillingInvoice = {
  id: string;
  invoiceNumber: string;
  matterId?: string | null;
  matter?: { name?: string | null } | null;
  status: string;
  total: number | string;
  balanceDue: number | string;
};

export type TrustReportRow = {
  id: string;
  trustAccountId?: string | null;
  trustAccount?: { name?: string | null } | null;
  matterId?: string | null;
  matter?: { name?: string | null } | null;
  balance: number | string;
};

export type ReconciliationDiscrepancy = { id: string; status: string };

export type ReconciliationRun = {
  id: string;
  status: string;
  statementStartAt: string;
  statementEndAt: string;
  discrepancies?: ReconciliationDiscrepancy[];
};

export type LedesProfile = { id: string; name: string; format: string; isDefault?: boolean };

export type LedesJob = {
  id: string;
  profileId: string;
  profile?: { name?: string | null } | null;
  status: string;
  validationStatus?: string | null;
  lineCount?: number | null;
  totalAmount?: number | string | null;
  summaryJson?: { validationErrorCount?: number } | null;
};

export function useBillingPage() {
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);
  const [trustRows, setTrustRows] = useState<TrustReportRow[]>([]);
  const [reconciliationRuns, setReconciliationRuns] = useState<ReconciliationRun[]>([]);
  const [ledesProfiles, setLedesProfiles] = useState<LedesProfile[]>([]);
  const [ledesJobs, setLedesJobs] = useState<LedesJob[]>([]);
  const [matterOptions, setMatterOptions] = useState<MatterLookup[]>([]);
  const [trustAccountOptions, setTrustAccountOptions] = useState<TrustAccountLookup[]>([]);
  const [invoiceOptions, setInvoiceOptions] = useState<InvoiceLookup[]>([]);

  const [invoiceStatus, setInvoiceStatus] = useState<string | null>(null);
  const [reconciliationStatus, setReconciliationStatus] = useState<string | null>(null);
  const [selectedLedesInvoiceIds, setSelectedLedesInvoiceIds] = useState<string[]>([]);
  const [ledesStatus, setLedesStatus] = useState<string | null>(null);

  const {
    register: registerInvoice,
    handleSubmit: handleInvoiceSubmit,
    setValue: setInvoiceValue,
    getValues: getInvoiceValues,
    formState: { errors: invoiceErrors, isSubmitting: creatingInvoice },
  } = useForm<CreateInvoiceFormData>({
    resolver: zodResolver(createInvoiceSchema),
    mode: 'onBlur',
    defaultValues: { matterId: '' },
  });

  const {
    register: registerReconciliation,
    handleSubmit: handleReconciliationSubmit,
    setValue: setReconciliationValue,
    getValues: getReconciliationValues,
    formState: { errors: reconciliationErrors, isSubmitting: creatingReconciliation },
  } = useForm<CreateReconciliationRunFormData>({
    resolver: zodResolver(createReconciliationRunSchema),
    mode: 'onBlur',
    defaultValues: {
      trustAccountId: '',
      statementStartAt: '',
      statementEndAt: '',
    },
  });

  const {
    register: registerLedesProfile,
    handleSubmit: handleLedesProfileSubmit,
    setValue: setLedesProfileValue,
    formState: { errors: ledesProfileErrors, isSubmitting: creatingLedesProfile },
  } = useForm<CreateLedesProfileFormData>({
    resolver: zodResolver(createLedesProfileSchema),
    mode: 'onBlur',
    defaultValues: { name: 'Default LEDES 1998B' },
  });

  const {
    register: registerLedesJob,
    handleSubmit: handleLedesJobSubmit,
    setValue: setLedesJobValue,
    getValues: getLedesJobValues,
    formState: { errors: ledesJobErrors, isSubmitting: creatingLedesJob },
  } = useForm<CreateLedesJobFormData>({
    resolver: zodResolver(createLedesJobSchema),
    mode: 'onBlur',
    defaultValues: {
      profileId: '',
      invoiceId: '',
    },
  });

  const load = useCallback(async () => {
    const [invoiceData, trustData, reconciliationData, profileData, ledesJobData, mattersData, trustLookupData, invoiceLookupData] =
      await Promise.all([
        apiFetch<BillingInvoice[]>('/billing/invoices'),
        apiFetch<TrustReportRow[]>('/billing/trust/report'),
        apiFetch<ReconciliationRun[]>('/billing/trust/reconciliation/runs'),
        apiFetch<LedesProfile[]>('/billing/ledes/profiles'),
        apiFetch<LedesJob[]>('/billing/ledes/jobs'),
        apiFetch<MatterLookup[]>('/lookups/matters?limit=200'),
        apiFetch<TrustAccountLookup[]>('/lookups/trust-accounts?limit=200'),
        apiFetch<InvoiceLookup[]>('/lookups/invoices?limit=200'),
      ]);

    setInvoices(invoiceData);
    setTrustRows(trustData);
    setReconciliationRuns(reconciliationData);
    setLedesProfiles(profileData);
    setLedesJobs(ledesJobData);
    setMatterOptions(mattersData);
    setTrustAccountOptions(trustLookupData);
    setInvoiceOptions(invoiceLookupData);

    if (!getInvoiceValues('matterId')) setInvoiceValue('matterId', mattersData[0]?.id || '');
    if (!getReconciliationValues('trustAccountId')) setReconciliationValue('trustAccountId', trustLookupData[0]?.id || '');
    if (!getLedesJobValues('invoiceId')) setLedesJobValue('invoiceId', invoiceLookupData[0]?.id || '');

    if (!getLedesJobValues('profileId')) {
      const defaultProfile = profileData.find((profile) => profile.isDefault);
      setLedesJobValue('profileId', defaultProfile?.id || profileData[0]?.id || '');
    }
  }, [
    getInvoiceValues,
    getLedesJobValues,
    getReconciliationValues,
    setInvoiceValue,
    setLedesJobValue,
    setReconciliationValue,
  ]);

  useEffect(() => {
    load().catch(() => undefined);
  }, [load]);

  const createInvoice = handleInvoiceSubmit(async (data) => {
    if (!data.matterId) {
      setInvoiceStatus('Select a matter before creating an invoice.');
      return;
    }

    await apiFetch('/billing/invoices', {
      method: 'POST',
      body: JSON.stringify({
        matterId: data.matterId,
        lineItems: [{ description: 'Legal Services', quantity: 2, unitPrice: 425 }],
      }),
    });
    setInvoiceStatus('Created invoice draft for selected matter.');
    await load();
  });

  const createReconciliationRun = handleReconciliationSubmit(async (data) => {
    const payload: Record<string, string> = {};
    if (data.trustAccountId) payload.trustAccountId = data.trustAccountId;
    if (data.statementStartAt) payload.statementStartAt = new Date(data.statementStartAt).toISOString();
    if (data.statementEndAt) payload.statementEndAt = new Date(data.statementEndAt).toISOString();

    await apiFetch('/billing/trust/reconciliation/runs', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setReconciliationStatus('Created reconciliation run.');
    await load();
  });

  async function submitRun(runId: string) {
    await apiFetch(`/billing/trust/reconciliation/runs/${runId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ notes: 'Submitted for attorney review.' }),
    });
    setReconciliationStatus('Submitted reconciliation run for review.');
    await load();
  }

  async function resolveDiscrepancy(discrepancyId: string) {
    await apiFetch(`/billing/trust/reconciliation/discrepancies/${discrepancyId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({
        status: 'RESOLVED',
        resolutionNote: 'Reconciled against source statement and ledger adjustment record.',
      }),
    });
    setReconciliationStatus('Resolved reconciliation discrepancy.');
    await load();
  }

  async function completeRun(runId: string) {
    await apiFetch(`/billing/trust/reconciliation/runs/${runId}/complete`, {
      method: 'POST',
      body: JSON.stringify({ notes: 'Signed off by attorney.' }),
    });
    setReconciliationStatus('Completed reconciliation run.');
    await load();
  }

  const createLedesProfile = handleLedesProfileSubmit(async (data) => {
    const name = data.name.trim();
    if (!name) return;

    await apiFetch('/billing/ledes/profiles', {
      method: 'POST',
      body: JSON.stringify({
        name,
        format: 'LEDES98B',
        isDefault: true,
        requireUtbmsPhaseCode: true,
        requireUtbmsTaskCode: true,
        includeExpenseLineItems: true,
      }),
    });
    setLedesProfileValue('name', name, { shouldDirty: true });
    setLedesStatus(`Created LEDES profile "${name}".`);
    await load();
  });

  const createLedesJob = handleLedesJobSubmit(
    async (data) => {
      const invoiceIds = selectedLedesInvoiceIds.filter(Boolean);
      const created = await apiFetch<LedesJob>('/billing/ledes/jobs', {
        method: 'POST',
        body: JSON.stringify({
          profileId: data.profileId,
          invoiceIds: invoiceIds.length > 0 ? invoiceIds : undefined,
        }),
      });

      if (created.status === 'FAILED') {
        const count = created.summaryJson?.validationErrorCount || 0;
        setLedesStatus(`LEDES export validation failed (${count} issues).`);
      } else {
        setLedesStatus(`Created LEDES export job ${created.id}.`);
      }

      await load();
    },
    (formErrors) => {
      setLedesStatus(formErrors.profileId?.message || 'Select a LEDES profile before running export.');
    },
  );

  function addSelectedLedesInvoice() {
    const selectedInvoiceId = getLedesJobValues('invoiceId');
    if (!selectedInvoiceId) return;

    setSelectedLedesInvoiceIds((current) => {
      if (current.includes(selectedInvoiceId)) return current;
      return [...current, selectedInvoiceId];
    });
  }

  function removeSelectedLedesInvoice(invoiceId: string) {
    setSelectedLedesInvoiceIds((current) => current.filter((item) => item !== invoiceId));
  }

  async function downloadLedesJob(jobId: string) {
    const result = await apiFetch<{ downloadUrl: string }>(`/billing/ledes/jobs/${jobId}/download`);
    if (typeof window !== 'undefined') {
      window.open(result.downloadUrl, '_blank', 'noopener,noreferrer');
    }
    setLedesStatus('Generated LEDES export download URL.');
  }

  function resolveMatterLabel(matterId: string | null | undefined): string {
    if (!matterId) return '-';
    return matterOptions.find((matter) => matter.id === matterId)?.label || matterId;
  }

  return {
    invoices,
    trustRows,
    reconciliationRuns,
    ledesProfiles,
    ledesJobs,
    matterOptions,
    trustAccountOptions,
    invoiceOptions,
    invoiceStatus,
    reconciliationStatus,
    selectedLedesInvoiceIds,
    ledesStatus,
    registerInvoice,
    registerReconciliation,
    registerLedesProfile,
    registerLedesJob,
    getInvoiceValues,
    invoiceErrors,
    reconciliationErrors,
    ledesProfileErrors,
    ledesJobErrors,
    creatingInvoice,
    creatingReconciliation,
    creatingLedesProfile,
    creatingLedesJob,
    createInvoice,
    createReconciliationRun,
    submitRun,
    resolveDiscrepancy,
    completeRun,
    createLedesProfile,
    createLedesJob,
    addSelectedLedesInvoice,
    removeSelectedLedesInvoice,
    downloadLedesJob,
    resolveMatterLabel,
    setInvoiceStatus,
  };
}

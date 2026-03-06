'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '../../lib/api';
import type {
  AdminConflictCheckFormData,
  AdminConflictResolutionFormData,
  ConflictProfileConfigFormData,
  CustomFieldConfigFormData,
  ParticipantRoleConfigFormData,
  SectionConfigFormData,
} from '../../lib/schemas/admin-config';

export type WebhookEndpointSummary = {
  id: string;
  url: string;
  isActive: boolean;
  events: string[];
};

export type WebhookDeliverySummary = {
  id: string;
  eventType: string;
  status: string;
  attemptCount: number;
  responseCode?: number | null;
  createdAt: string;
  lastAttemptAt?: string | null;
  webhookEndpoint: {
    id: string;
    url: string;
    isActive: boolean;
  };
};

export type ProviderStatusRow = {
  key: string;
  mode: string;
  provider?: string;
  critical: boolean;
  healthy: boolean;
  issues?: string[];
  checkedAt?: string;
  detail: string;
  missingEnv?: string[];
};

export type ProviderStatusSnapshot = {
  profile: string;
  healthy: boolean;
  evaluatedAt: string;
  providers: ProviderStatusRow[];
};

export type LaunchBlocker = {
  key: string;
  title: string;
  severity: 'critical' | 'warning';
  status: 'blocked' | 'warning';
  observedAt: string;
  summary: string;
  runbookUrl: string;
};

export type LaunchBlockersSnapshot = {
  evaluatedAt: string;
  healthy: boolean;
  blockers: LaunchBlocker[];
};

export function useAdminPage() {
  const [org, setOrg] = useState<{ name: string; slug: string } | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; user: { email: string }; role?: { name: string } }>>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [stages, setStages] = useState<Array<{ id: string; practiceArea: string; name: string }>>([]);
  const [participantRoles, setParticipantRoles] = useState<
    Array<{ id: string; key: string; label: string; sideDefault?: 'CLIENT_SIDE' | 'OPPOSING_SIDE' | 'NEUTRAL' | 'COURT' }>
  >([]);
  const [auditEvents, setAuditEvents] = useState<Array<{ id: string; action: string; createdAt: string }>>([]);
  const [customFields, setCustomFields] = useState<Array<{ id: string; key: string; entityType: string; label: string }>>([]);
  const [sections, setSections] = useState<Array<{ id: string; name: string }>>([]);
  const [conflictProfiles, setConflictProfiles] = useState<
    Array<{ id: string; name: string; isDefault: boolean; thresholds: { warn: number; block: number } }>
  >([]);
  const [conflictChecks, setConflictChecks] = useState<
    Array<{
      id: string;
      queryText: string;
      createdAt: string;
      resultJson?: {
        recommendation?: 'CLEAR' | 'WARN' | 'BLOCK';
        score?: number;
        resolution?: { status?: string; decision?: string; rationale?: string };
      };
    }>
  >([]);
  const [webhookEndpoints, setWebhookEndpoints] = useState<WebhookEndpointSummary[]>([]);
  const [webhookDeliveries, setWebhookDeliveries] = useState<WebhookDeliverySummary[]>([]);
  const [webhookStatusFilter, setWebhookStatusFilter] = useState<'ALL' | 'PENDING' | 'RETRYING' | 'FAILED' | 'DELIVERED'>('FAILED');
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [retryingDeliveryId, setRetryingDeliveryId] = useState<string | null>(null);
  const [providerStatus, setProviderStatus] = useState<ProviderStatusSnapshot | null>(null);
  const [providerStatusError, setProviderStatusError] = useState<string | null>(null);
  const [launchBlockers, setLaunchBlockers] = useState<LaunchBlockersSnapshot | null>(null);
  const [launchBlockersError, setLaunchBlockersError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<{ name: string; slug: string }>('/admin/organization'),
      apiFetch<Array<{ id: string; user: { email: string }; role?: { name: string } }>>('/admin/users'),
      apiFetch<Array<{ id: string; name: string }>>('/admin/roles'),
      apiFetch<Array<{ id: string; practiceArea: string; name: string }>>('/admin/stages'),
      apiFetch<Array<{ id: string; key: string; label: string; sideDefault?: 'CLIENT_SIDE' | 'OPPOSING_SIDE' | 'NEUTRAL' | 'COURT' }>>(
        '/admin/participant-roles',
      ),
      apiFetch<Array<{ id: string; action: string; createdAt: string }>>('/audit?limit=25'),
      apiFetch<Array<{ id: string; key: string; entityType: string; label: string }>>('/config/custom-fields'),
      apiFetch<Array<{ id: string; name: string }>>('/config/sections'),
      apiFetch<Array<{ id: string; name: string; isDefault: boolean; thresholds: { warn: number; block: number } }>>(
        '/admin/conflict-rule-profiles',
      ),
      apiFetch<
        Array<{
          id: string;
          queryText: string;
          createdAt: string;
          resultJson?: {
            recommendation?: 'CLEAR' | 'WARN' | 'BLOCK';
            score?: number;
            resolution?: { status?: string; decision?: string; rationale?: string };
          };
        }>
      >('/admin/conflict-checks?limit=15'),
      apiFetch<WebhookEndpointSummary[]>('/webhooks/endpoints'),
      apiFetch<WebhookDeliverySummary[]>('/webhooks/deliveries?status=FAILED&limit=25'),
    ])
      .then(([o, u, r, s, pr, a, cf, sec, cProfiles, cChecks, wEndpoints, wDeliveries]) => {
        setOrg(o);
        setUsers(u);
        setRoles(r);
        setStages(s);
        setParticipantRoles(pr);
        setAuditEvents(a);
        setCustomFields(cf);
        setSections(sec);
        setConflictProfiles(cProfiles);
        setConflictChecks(cChecks);
        setWebhookEndpoints(wEndpoints);
        setWebhookDeliveries(wDeliveries);
      })
      .catch(() => undefined);

    apiFetch<ProviderStatusSnapshot>('/ops/provider-status')
      .then((status) => {
        setProviderStatus(status);
        setProviderStatusError(null);
      })
      .catch(() => {
        setProviderStatusError('Provider diagnostics unavailable.');
      });

    apiFetch<LaunchBlockersSnapshot>('/ops/launch-blockers')
      .then((snapshot) => {
        setLaunchBlockers(snapshot);
        setLaunchBlockersError(null);
      })
      .catch(() => {
        setLaunchBlockersError('Launch blocker diagnostics unavailable.');
      });
  }, []);

  async function createCustomField(values: CustomFieldConfigFormData) {
    await apiFetch('/config/custom-fields', {
      method: 'POST',
      body: JSON.stringify({
        entityType: 'matter',
        key: values.key,
        label: values.label,
        fieldType: 'text',
      }),
    });
    setCustomFields(await apiFetch<Array<{ id: string; key: string; entityType: string; label: string }>>('/config/custom-fields'));
  }

  async function createSection(values: SectionConfigFormData) {
    await apiFetch('/config/sections', {
      method: 'POST',
      body: JSON.stringify({
        name: values.name,
        schemaJson: { type: 'object', properties: { summary: { type: 'string' } } },
      }),
    });
    setSections(await apiFetch<Array<{ id: string; name: string }>>('/config/sections'));
  }

  async function createParticipantRole(values: ParticipantRoleConfigFormData) {
    await apiFetch('/admin/participant-roles', {
      method: 'POST',
      body: JSON.stringify({
        key: values.key,
        label: values.label,
        sideDefault: values.sideDefault,
      }),
    });
    setParticipantRoles(
      await apiFetch<Array<{ id: string; key: string; label: string; sideDefault?: 'CLIENT_SIDE' | 'OPPOSING_SIDE' | 'NEUTRAL' | 'COURT' }>>(
        '/admin/participant-roles',
      ),
    );
  }

  async function createConflictProfile(values: ConflictProfileConfigFormData) {
    await apiFetch('/admin/conflict-rule-profiles', {
      method: 'POST',
      body: JSON.stringify({
        name: values.name,
        isDefault: true,
        thresholds: {
          warn: Number(values.warnThreshold) || 45,
          block: Number(values.blockThreshold) || 70,
        },
      }),
    });
    const profiles = await apiFetch<Array<{ id: string; name: string; isDefault: boolean; thresholds: { warn: number; block: number } }>>(
      '/admin/conflict-rule-profiles',
    );
    setConflictProfiles(profiles);
  }

  async function runConflictCheck(values: AdminConflictCheckFormData) {
    await apiFetch('/admin/conflict-checks', {
      method: 'POST',
      body: JSON.stringify({
        queryText: values.queryText,
        profileId: values.profileId || undefined,
      }),
    });
    setConflictChecks(
      await apiFetch<
        Array<{
          id: string;
          queryText: string;
          createdAt: string;
          resultJson?: {
            recommendation?: 'CLEAR' | 'WARN' | 'BLOCK';
            score?: number;
            resolution?: { status?: string; decision?: string; rationale?: string };
          };
        }>
      >('/admin/conflict-checks?limit=15'),
    );
  }

  async function resolveConflictCheck(checkId: string, values: AdminConflictResolutionFormData) {
    await apiFetch(`/admin/conflict-checks/${checkId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({
        decision: values.decision,
        rationale: values.rationale,
      }),
    });
    setConflictChecks(
      await apiFetch<
        Array<{
          id: string;
          queryText: string;
          createdAt: string;
          resultJson?: {
            recommendation?: 'CLEAR' | 'WARN' | 'BLOCK';
            score?: number;
            resolution?: { status?: string; decision?: string; rationale?: string };
          };
        }>
      >('/admin/conflict-checks?limit=15'),
    );
  }

  async function refreshWebhookDeliveries(nextFilter = webhookStatusFilter) {
    const params = new URLSearchParams({ limit: '25' });
    if (nextFilter !== 'ALL') {
      params.set('status', nextFilter);
    }
    setWebhookDeliveries(await apiFetch<WebhookDeliverySummary[]>(`/webhooks/deliveries?${params.toString()}`));
  }

  async function updateWebhookFilter(nextFilter: 'ALL' | 'PENDING' | 'RETRYING' | 'FAILED' | 'DELIVERED') {
    setWebhookStatusFilter(nextFilter);
    setWebhookError(null);
    await refreshWebhookDeliveries(nextFilter);
  }

  async function retryWebhookDelivery(deliveryId: string) {
    setWebhookError(null);
    setRetryingDeliveryId(deliveryId);
    try {
      await apiFetch(`/webhooks/deliveries/${deliveryId}/retry`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const endpoints = await apiFetch<WebhookEndpointSummary[]>('/webhooks/endpoints');
      setWebhookEndpoints(endpoints);
      await refreshWebhookDeliveries();
    } catch (error) {
      setWebhookError(error instanceof Error ? error.message : 'Failed to retry webhook delivery');
    } finally {
      setRetryingDeliveryId(null);
    }
  }

  return {
    org,
    users,
    roles,
    stages,
    participantRoles,
    auditEvents,
    customFields,
    sections,
    conflictProfiles,
    conflictChecks,
    webhookEndpoints,
    webhookDeliveries,
    webhookStatusFilter,
    webhookError,
    retryingDeliveryId,
    providerStatus,
    providerStatusError,
    launchBlockers,
    launchBlockersError,
    createCustomField,
    createSection,
    createParticipantRole,
    createConflictProfile,
    runConflictCheck,
    resolveConflictCheck,
    updateWebhookFilter,
    retryWebhookDelivery,
  };
}

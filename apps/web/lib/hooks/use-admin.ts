'use client';

import { useApiQuery, type UseApiQueryResult } from './use-api-query';

export interface ConflictProfile {
  id: string;
  name: string;
  threshold: number;
  active: boolean;
}

export interface WebhookDelivery {
  id: string;
  url: string;
  event: string;
  status: number;
  deliveredAt: string;
}

export interface AdminSettings {
  orgName: string;
  timezone: string;
  features: Record<string, boolean>;
  conflictProfiles: ConflictProfile[];
  webhookDeliveries: WebhookDelivery[];
}

export function useAdminSettings(): UseApiQueryResult<AdminSettings> {
  return useApiQuery<AdminSettings>({
    key: 'admin:settings',
    endpoint: '/admin/settings',
  });
}

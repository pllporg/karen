'use client';

import { useApiQuery, type UseApiQueryResult } from './use-api-query';

export interface DashboardSnapshot {
  openMatters: number;
  contacts: number;
  pendingTasks: number;
  openInvoices: number;
  aiJobs: number;
}

export function useDashboardSnapshot(): UseApiQueryResult<DashboardSnapshot> {
  return useApiQuery<DashboardSnapshot>({
    key: 'dashboard:snapshot',
    endpoint: '/dashboard/snapshot',
  });
}

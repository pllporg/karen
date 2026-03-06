'use client';

import { useMemo } from 'react';
import { useApiMutation } from './use-api-mutation';
import { useApiQuery, type UseApiQueryResult } from './use-api-query';
import { type Lead } from '../types/lead';

export interface UseLeadsFilters {
  stage?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useLeads(filters?: UseLeadsFilters): UseApiQueryResult<Lead[]> {
  const params = useMemo(
    () => ({
      stage: filters?.stage,
      search: filters?.search,
      page: filters?.page,
      pageSize: filters?.pageSize,
    }),
    [filters?.page, filters?.pageSize, filters?.search, filters?.stage],
  );

  const key = useMemo(() => `leads:${JSON.stringify(params)}`, [params]);

  return useApiQuery<Lead[]>({
    key,
    endpoint: '/leads',
    params,
  });
}

export function useLead(id: string | null): UseApiQueryResult<Lead> {
  return useApiQuery<Lead>({
    key: id ? `lead:${id}` : null,
    endpoint: id ? `/leads/${id}` : '/leads',
  });
}

export function useCreateLead() {
  return useApiMutation<{ source: string; notes?: string }, Lead>({
    endpoint: '/leads',
    method: 'POST',
  });
}

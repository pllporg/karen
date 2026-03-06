'use client';

import { useMemo } from 'react';
import { useApiMutation } from './use-api-mutation';
import { useApiQuery, type UseApiQueryResult } from './use-api-query';
import { type Matter } from '../types/matter';

export interface UseMattersFilters {
  status?: string;
  practiceArea?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useMatters(filters?: UseMattersFilters): UseApiQueryResult<Matter[]> {
  const params = useMemo(
    () => ({
      status: filters?.status,
      practiceArea: filters?.practiceArea,
      search: filters?.search,
      page: filters?.page,
      pageSize: filters?.pageSize,
    }),
    [filters?.page, filters?.pageSize, filters?.practiceArea, filters?.search, filters?.status],
  );

  const key = useMemo(() => `matters:${JSON.stringify(params)}`, [params]);

  return useApiQuery<Matter[]>({
    key,
    endpoint: '/matters',
    params,
  });
}

export function useMatter(id: string | null): UseApiQueryResult<Matter> {
  return useApiQuery<Matter>({
    key: id ? `matter:${id}` : null,
    endpoint: id ? `/matters/${id}` : '/matters',
  });
}

export function useCreateMatter() {
  return useApiMutation<{ name: string; matterNumber: string; practiceArea: string; caseType?: string }, Matter>({
    endpoint: '/matters',
    method: 'POST',
  });
}

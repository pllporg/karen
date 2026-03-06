'use client';

import { useMemo } from 'react';
import { useApiMutation } from './use-api-mutation';
import { useApiQuery, type UseApiQueryResult } from './use-api-query';
import { type Contact } from '../types/contact';

export interface UseContactsFilters {
  type?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export function useContacts(filters?: UseContactsFilters): UseApiQueryResult<Contact[]> {
  const params = useMemo(
    () => ({
      type: filters?.type,
      search: filters?.search,
      page: filters?.page,
      pageSize: filters?.pageSize,
    }),
    [filters?.page, filters?.pageSize, filters?.search, filters?.type],
  );

  const key = useMemo(() => `contacts:${JSON.stringify(params)}`, [params]);

  return useApiQuery<Contact[]>({
    key,
    endpoint: '/contacts',
    params,
  });
}

export function useCreateContact() {
  return useApiMutation<
    { firstName: string; lastName: string; email?: string; phone?: string; company?: string; type: string },
    Contact
  >({
    endpoint: '/contacts',
    method: 'POST',
  });
}

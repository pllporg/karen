'use client';

import { useMemo } from 'react';
import { useApiMutation } from './use-api-mutation';
import { useApiQuery, type UseApiQueryResult } from './use-api-query';
import { type Document } from '../types/document';

export interface UseDocumentsFilters {
  matterId?: string;
  search?: string;
  page?: number;
}

export function useDocuments(filters?: UseDocumentsFilters): UseApiQueryResult<Document[]> {
  const params = useMemo(
    () => ({
      matterId: filters?.matterId,
      search: filters?.search,
      page: filters?.page,
    }),
    [filters?.matterId, filters?.page, filters?.search],
  );

  const key = useMemo(() => `documents:${JSON.stringify(params)}`, [params]);

  return useApiQuery<Document[]>({
    key,
    endpoint: '/documents',
    params,
  });
}

export function useUploadDocument() {
  return useApiMutation<FormData, Document>({
    endpoint: '/documents/upload',
    method: 'POST',
  });
}

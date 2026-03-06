'use client';

import { useMemo } from 'react';
import { useApiMutation } from './use-api-mutation';
import { useApiQuery, type UseApiQueryResult } from './use-api-query';
import { type ReviewGateStatus } from '../types/common';

export interface AiJob {
  id: string;
  tool: string;
  matterId?: string;
  status: 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  reviewStatus: ReviewGateStatus;
  createdAt: string;
  completedAt?: string;
}

export interface StylePack {
  id: string;
  name: string;
  config: Record<string, unknown>;
}

export function useAiJobs(filters?: { status?: string; page?: number }): UseApiQueryResult<AiJob[]> {
  const params = useMemo(
    () => ({
      status: filters?.status,
      page: filters?.page,
    }),
    [filters?.page, filters?.status],
  );

  const key = useMemo(() => `ai:jobs:${JSON.stringify(params)}`, [params]);

  return useApiQuery<AiJob[]>({
    key,
    endpoint: '/ai/jobs',
    params,
  });
}

export function useStylePacks(): UseApiQueryResult<StylePack[]> {
  return useApiQuery<StylePack[]>({
    key: 'ai:style-packs',
    endpoint: '/ai/style-packs',
  });
}

export function useCreateAiJob() {
  return useApiMutation<{ tool: string; matterId?: string; parameters?: Record<string, unknown> }, AiJob>({
    endpoint: '/ai/jobs',
    method: 'POST',
  });
}

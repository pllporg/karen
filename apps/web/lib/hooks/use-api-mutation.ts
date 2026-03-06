'use client';

import { useCallback, useState } from 'react';
import { apiFetch } from '../api';
import { type ApiError } from '../types/common';

export interface UseApiMutationOptions {
  endpoint: string;
  method?: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
}

export interface UseApiMutationResult<TInput, TOutput> {
  mutate: (payload: TInput) => Promise<TOutput>;
  loading: boolean;
  error: ApiError | null;
  data: TOutput | null;
  reset: () => void;
}

function parseApiError(error: unknown): ApiError {
  if (error instanceof Error) {
    const status = Number.parseInt(error.message.slice(0, 3), 10);
    return {
      message: error.message || 'Request failed',
      statusCode: Number.isFinite(status) ? status : 500,
    };
  }
  return {
    message: 'Request failed',
    statusCode: 500,
  };
}

export function useApiMutation<TInput, TOutput>({
  endpoint,
  method = 'POST',
}: UseApiMutationOptions): UseApiMutationResult<TInput, TOutput> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);
  const [data, setData] = useState<TOutput | null>(null);

  const mutate = useCallback(
    async (payload: TInput): Promise<TOutput> => {
      setLoading(true);
      setError(null);

      try {
        const isFormDataPayload = payload instanceof FormData;
        const requestInit: RequestInit = { method };

        if (payload !== undefined) {
          requestInit.body = isFormDataPayload ? payload : JSON.stringify(payload);
        }

        const result = await apiFetch<TOutput>(endpoint, requestInit);
        setData(result);
        setError(null);
        return result;
      } catch (mutationError) {
        const parsedError = parseApiError(mutationError);
        setError(parsedError);
        throw mutationError;
      } finally {
        setLoading(false);
      }
    },
    [endpoint, method],
  );

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { mutate, loading, error, data, reset };
}

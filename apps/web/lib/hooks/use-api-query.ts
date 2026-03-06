'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { apiFetch } from '../api';
import { type ApiError } from '../types/common';

type QueryParamValue = string | number | boolean | undefined;

export interface UseApiQueryOptions<T> {
  key: string | null;
  endpoint: string;
  params?: Record<string, QueryParamValue>;
  initialData?: T | null;
}

export interface UseApiQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  refetch: () => void;
}

const inFlightRequests = new Map<string, Promise<unknown>>();

function buildQueryString(params: Record<string, QueryParamValue> | undefined): string {
  if (!params) return '';

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;
    searchParams.set(key, String(value));
  });

  const output = searchParams.toString();
  return output ? `?${output}` : '';
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

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

export function useApiQuery<T>(options: UseApiQueryOptions<T>): UseApiQueryResult<T> {
  const { key, endpoint, params, initialData = null } = options;
  const [data, setData] = useState<T | null>(initialData);
  const [loading, setLoading] = useState<boolean>(Boolean(key));
  const [error, setError] = useState<ApiError | null>(null);
  const [reloadVersion, setReloadVersion] = useState<number>(0);

  const paramsSignature = useMemo(() => JSON.stringify(params ?? {}), [params]);

  const requestPath = useMemo(() => {
    const parsedParams = JSON.parse(paramsSignature) as Record<string, QueryParamValue>;
    return `${endpoint}${buildQueryString(parsedParams)}`;
  }, [endpoint, paramsSignature]);

  const refetch = useCallback(() => {
    setReloadVersion((value) => value + 1);
  }, []);

  useEffect(() => {
    if (!key) {
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    const controller = new AbortController();

    const execute = async () => {
      setLoading(true);
      setError(null);

      try {
        let request = inFlightRequests.get(key) as Promise<T> | undefined;
        if (!request) {
          request = apiFetch<T>(requestPath, { signal: controller.signal }).finally(() => {
            if (inFlightRequests.get(key) === request) {
              inFlightRequests.delete(key);
            }
          });
          inFlightRequests.set(key, request);
        }

        const result = await request;
        if (!active) return;
        setData(result);
        setError(null);
      } catch (requestError) {
        if (!active || isAbortError(requestError)) return;
        setData(null);
        setError(parseApiError(requestError));
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void execute();

    return () => {
      active = false;
      controller.abort();
    };
  }, [key, reloadVersion, requestPath]);

  return { data, loading, error, refetch };
}

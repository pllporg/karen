'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';
let sessionBootstrapInFlight: Promise<boolean> | null = null;

export function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('session_token');
}

export function setSessionToken(token: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('session_token', token);
}

export function clearSessionToken() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('session_token');
}

function shouldSkipSessionBootstrap(path: string): boolean {
  return path.startsWith('/auth/');
}

function buildHeaders(init: RequestInit | undefined, token: string | null): Record<string, string> {
  return {
    'content-type': 'application/json',
    ...(token ? { 'x-session-token': token } : {}),
    ...(init?.headers || {}),
  } as Record<string, string>;
}

export async function bootstrapSession(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (sessionBootstrapInFlight) return sessionBootstrapInFlight;

  sessionBootstrapInFlight = (async () => {
    const token = getSessionToken();
    const response = await fetch(`${API_BASE}/auth/session`, {
      method: 'GET',
      headers: {
        'content-type': 'application/json',
        ...(token ? { 'x-session-token': token } : {}),
      },
      credentials: 'include',
    }).catch(() => null);

    if (!response || !response.ok) {
      clearSessionToken();
      return false;
    }

    const payload = (await response.json().catch(() => null)) as { token?: string | null; user?: unknown } | null;
    if (!payload?.user) {
      clearSessionToken();
      return false;
    }

    if (typeof payload.token === 'string' && payload.token) {
      setSessionToken(payload.token);
    }
    return true;
  })().finally(() => {
    sessionBootstrapInFlight = null;
  });

  return sessionBootstrapInFlight;
}

export async function logoutSession(): Promise<void> {
  const token = getSessionToken();
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(token ? { 'x-session-token': token } : {}),
    },
    credentials: 'include',
  }).catch(() => undefined);
  clearSessionToken();
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const execute = (token: string | null) =>
    fetch(`${API_BASE}${path}`, {
      ...init,
      headers: buildHeaders(init, token),
      credentials: 'include',
    });

  let token = getSessionToken();
  let response = await execute(token);

  if (response.status === 401 && !shouldSkipSessionBootstrap(path)) {
    clearSessionToken();
    const recovered = await bootstrapSession();
    if (recovered) {
      token = getSessionToken();
      response = await execute(token);
    }
  }

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

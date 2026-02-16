'use client';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

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

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getSessionToken();
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(token ? { 'x-session-token': token } : {}),
      ...(init?.headers || {}),
    },
    credentials: 'include',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status} ${response.statusText}: ${text}`);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

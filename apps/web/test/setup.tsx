import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, vi } from 'vitest';
import { resetSessionBootstrapForTests } from '../lib/api';

type AuthBootstrapHarnessConfig = {
  status: number;
  token: string | null;
  includeUser: boolean;
};

const DEFAULT_AUTH_BOOTSTRAP_HARNESS: AuthBootstrapHarnessConfig = {
  status: 200,
  token: 'test-session-token',
  includeUser: true,
};

const authBootstrapHarnessState: { config: AuthBootstrapHarnessConfig } = {
  config: { ...DEFAULT_AUTH_BOOTSTRAP_HARNESS },
};

function createAuthSessionResponse(config: AuthBootstrapHarnessConfig): Response {
  const ok = config.status >= 200 && config.status < 300;
  return {
    ok,
    status: config.status,
    statusText: ok ? 'OK' : 'Unauthorized',
    json: async () => ({
      ...(config.includeUser ? { user: { id: 'user-1' } } : {}),
      ...(config.token ? { token: config.token } : {}),
    }),
    text: async () => (ok ? '' : 'unauthorized'),
  } as Response;
}

function installAuthBootstrapHarness() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = init?.method?.toUpperCase() ?? 'GET';
    if (url.endsWith('/auth/session') && method === 'GET') {
      return createAuthSessionResponse(authBootstrapHarnessState.config);
    }
    return {
      ok: false,
      status: 500,
      statusText: 'Unexpected',
      json: async () => ({}),
      text: async () => 'Unexpected request',
    } as Response;
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

export function useStrictAuthBootstrapMode(overrides?: Partial<AuthBootstrapHarnessConfig>) {
  window.localStorage.removeItem('session_token');
  authBootstrapHarnessState.config = {
    ...DEFAULT_AUTH_BOOTSTRAP_HARNESS,
    ...overrides,
  };
}

export function getAuthBootstrapFetchMock() {
  return globalThis.fetch as unknown as ReturnType<typeof vi.fn>;
}

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/dashboard',
  useParams: () => ({}),
  useSearchParams: () => ({
    get: () => null,
  }),
  redirect: vi.fn(),
}));

beforeEach(() => {
  resetSessionBootstrapForTests();
  authBootstrapHarnessState.config = { ...DEFAULT_AUTH_BOOTSTRAP_HARNESS };
  window.localStorage.setItem('session_token', 'test-session-token');
  installAuthBootstrapHarness();
});

afterEach(() => {
  resetSessionBootstrapForTests();
  window.localStorage.removeItem('session_token');
  cleanup();
  vi.restoreAllMocks();
});

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import * as nextNavigation from 'next/navigation';
import { AppShell } from '../components/app-shell';

describe('AppShell auth bootstrap', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('bootstraps from cookie-backed session and restores local token', async () => {
    window.localStorage.removeItem('session_token');
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/session')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            user: { id: 'user-1' },
            token: 'restored-token',
          }),
          text: async () => '',
        } as Response;
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

    render(
      <AppShell>
        <div>Protected content</div>
      </AppShell>,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/auth/session',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        }),
      );
    });
    await screen.findByText('Protected content');
    expect(window.localStorage.getItem('session_token')).toBe('restored-token');
  });


  it('revalidates stale local token against server session before rendering protected content', async () => {
    window.localStorage.setItem('session_token', 'stale-token');

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({}),
      text: async () => 'invalid session',
    });
    vi.stubGlobal('fetch', fetchMock);

    const replace = vi.fn();
    vi.spyOn(nextNavigation, 'usePathname').mockReturnValue('/dashboard');
    vi.spyOn(nextNavigation, 'useRouter').mockReturnValue({
      push: vi.fn(),
      replace,
      prefetch: vi.fn(),
    } as any);

    render(
      <AppShell>
        <div>Protected content</div>
      </AppShell>,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/auth/session',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        }),
      );
    });

    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/login?next=%2Fdashboard');
    });
    expect(window.localStorage.getItem('session_token')).toBeNull();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });

  it('redirects to login when bootstrap session fails', async () => {
    window.localStorage.removeItem('session_token');
    const replace = vi.fn();
    vi.spyOn(nextNavigation, 'usePathname').mockReturnValue('/documents');
    vi.spyOn(nextNavigation, 'useRouter').mockReturnValue({
      push: vi.fn(),
      replace,
      prefetch: vi.fn(),
    } as any);

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({}),
      text: async () => 'unauthorized',
    });
    vi.stubGlobal('fetch', fetchMock);

    render(
      <AppShell>
        <div>Protected content</div>
      </AppShell>,
    );

    await screen.findByText('Verifying Session');
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/auth/session',
        expect.objectContaining({
          method: 'GET',
          credentials: 'include',
        }),
      );
    });
    await waitFor(() => {
      expect(replace).toHaveBeenCalledWith('/login?next=%2Fdocuments');
    });
    expect(window.localStorage.getItem('session_token')).toBeNull();
    expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
  });
});

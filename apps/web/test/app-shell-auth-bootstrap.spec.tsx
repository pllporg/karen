import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import * as nextNavigation from 'next/navigation';
import { AppShell } from '../components/app-shell';
import { getAuthBootstrapFetchMock, useStrictAuthBootstrapMode } from './setup';

describe('AppShell auth bootstrap', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('hydrates protected shell from stored token without a bootstrap roundtrip', async () => {
    const fetchMock = getAuthBootstrapFetchMock();

    render(
      <AppShell>
        <div>Protected content</div>
      </AppShell>,
    );

    await screen.findByText('Protected content');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('bootstraps from cookie-backed session and restores local token', async () => {
    useStrictAuthBootstrapMode({ token: 'restored-token' });
    const fetchMock = getAuthBootstrapFetchMock();

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

  it('redirects to login when bootstrap session fails', async () => {
    useStrictAuthBootstrapMode({ status: 401, token: null, includeUser: false });
    const replace = vi.fn();
    vi.spyOn(nextNavigation, 'usePathname').mockReturnValue('/documents');
    vi.spyOn(nextNavigation, 'useRouter').mockReturnValue({
      push: vi.fn(),
      replace,
      prefetch: vi.fn(),
    } as any);

    const fetchMock = getAuthBootstrapFetchMock();

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

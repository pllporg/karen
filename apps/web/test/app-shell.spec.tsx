import React from 'react';
import { render, screen } from '@testing-library/react';

import { AppShell } from '../components/app-shell';

describe('AppShell', () => {
  beforeEach(() => {
    window.localStorage.setItem('session_token', 'test-session-token');
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.endsWith('/auth/session')) {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          json: async () => ({
            user: { id: 'user-1' },
            token: 'test-session-token',
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
  });

  afterEach(() => {
    window.localStorage.removeItem('session_token');
  });

  it('renders standardized sidebar navigation with active route semantics', async () => {
    render(
      <AppShell>
        <div>Body Content</div>
      </AppShell>,
    );

    expect(await screen.findByText('Practice Operations')).toBeInTheDocument();
    expect(await screen.findByText('LIC Legal Suite')).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Menu' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute('href', '#lic-main-content');

    const activeLink = screen.getByRole('link', { name: /Dashboard/i });
    expect(activeLink).toHaveAttribute('aria-current', 'page');

    expect(screen.getByRole('link', { name: /Matters/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Out/i })).toBeInTheDocument();
    const mainPanelContent = document.querySelector('.main-panel-content');
    expect(mainPanelContent).toBeInTheDocument();
    expect(mainPanelContent).toContainElement(screen.getByText('Body Content'));
  });
});

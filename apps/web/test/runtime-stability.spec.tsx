import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardPage from '../app/dashboard/page';
import { AppShell } from '../components/app-shell';

function jsonResponse<T>(payload: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response;
}

function installRuntimeFetchMock() {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    const method = (init?.method || 'GET').toUpperCase();

    if (url.endsWith('/auth/session') && method === 'GET') {
      return jsonResponse({ token: 'runtime-stability-token', user: { id: 'user-1' } });
    }
    if (url.endsWith('/matters') && method === 'GET') {
      return jsonResponse([{ id: 'matter-1' }, { id: 'matter-2' }]);
    }
    if (url.endsWith('/contacts') && method === 'GET') {
      return jsonResponse([{ id: 'contact-1' }]);
    }
    if (url.endsWith('/tasks') && method === 'GET') {
      return jsonResponse([{ id: 'task-1' }, { id: 'task-2' }, { id: 'task-3' }]);
    }
    if (url.endsWith('/billing/invoices') && method === 'GET') {
      return jsonResponse([{ id: 'invoice-1' }]);
    }
    if (url.endsWith('/ai/jobs') && method === 'GET') {
      return jsonResponse([{ id: 'job-1' }, { id: 'job-2' }]);
    }

    return jsonResponse({ error: `Unexpected ${method} ${url}` }, 500);
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('web runtime stability guardrails', () => {
  it('keeps auth bootstrap stable across repeated shell mount cycles', async () => {
    installRuntimeFetchMock();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    for (let cycle = 1; cycle <= 20; cycle += 1) {
      const view = render(
        <AppShell>
          <div>Runtime cycle {cycle}</div>
        </AppShell>,
      );

      await screen.findByText(`Runtime cycle ${cycle}`);
      view.unmount();
    }

    expect(consoleError).not.toHaveBeenCalled();
  });

  it('keeps dashboard data snapshot stable across repeated render cycles', async () => {
    installRuntimeFetchMock();
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    for (let cycle = 1; cycle <= 8; cycle += 1) {
      const view = render(<DashboardPage />);

      await screen.findByText('Open Matters');
      await waitFor(() => {
        const openMattersCard = screen.getByText('Open Matters').closest('.card');
        const aiJobsCard = screen.getByText('AI Jobs').closest('.card');
        expect(openMattersCard).toHaveTextContent('2');
        expect(aiJobsCard).toHaveTextContent('2');
      });

      view.unmount();
    }

    expect(consoleError).not.toHaveBeenCalled();
  });
});

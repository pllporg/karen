import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import LoginPage from '../app/login/page';
import DashboardPage from '../app/dashboard/page';
import MattersPage from '../app/matters/page';
import PortalPage from '../app/portal/page';

function jsonResponse<T>(payload: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response;
}

describe('Web smoke journey', () => {
  it('covers sign-in -> dashboard -> matter creation -> portal messaging', { timeout: 20000 }, async () => {
    const state = {
      matters: [
        {
          id: 'matter-1',
          matterNumber: 'M-2026-001',
          name: 'Kitchen Remodel Defect - Ortega',
          practiceArea: 'Construction Litigation',
          status: 'OPEN',
        },
      ],
      contacts: [{ id: 'contact-1' }],
      tasks: [{ id: 'task-1' }, { id: 'task-2' }],
      invoices: [{ id: 'invoice-1' }],
      aiJobs: [{ id: 'ai-job-1' }],
      portalSnapshot: {
        matters: [{ id: 'matter-1' }],
        keyDates: [],
        invoices: [{ id: 'invoice-1' }],
        documents: [],
        messages: [],
        eSignEnvelopes: [],
      } as any,
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || 'GET';

      if (url.endsWith('/auth/login') && method === 'POST') {
        return jsonResponse({ token: 'session-token-1' });
      }

      if (url.endsWith('/matters') && method === 'GET') {
        return jsonResponse(state.matters);
      }
      if (url.endsWith('/matters') && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        const created = {
          id: `matter-${state.matters.length + 1}`,
          matterNumber: body.matterNumber || `M-2026-00${state.matters.length + 1}`,
          name: body.name || 'New Matter',
          practiceArea: body.practiceArea || 'Construction Litigation',
          status: 'OPEN',
        };
        state.matters = [created, ...state.matters];
        state.portalSnapshot = {
          ...state.portalSnapshot,
          matters: [{ id: created.id }, ...state.portalSnapshot.matters],
        };
        return jsonResponse(created);
      }

      if (url.endsWith('/matters/intake-wizard/drafts') && method === 'GET') {
        return jsonResponse([]);
      }

      if (url.endsWith('/contacts') && method === 'GET') return jsonResponse(state.contacts);
      if (url.endsWith('/tasks') && method === 'GET') return jsonResponse(state.tasks);
      if (url.endsWith('/billing/invoices') && method === 'GET') return jsonResponse(state.invoices);
      if (url.endsWith('/ai/jobs') && method === 'GET') return jsonResponse(state.aiJobs);

      if (url.endsWith('/portal/snapshot') && method === 'GET') {
        return jsonResponse(state.portalSnapshot);
      }
      if (url.endsWith('/portal/intake-form-definitions') && method === 'GET') {
        return jsonResponse([]);
      }
      if (url.endsWith('/portal/engagement-letter-templates') && method === 'GET') {
        return jsonResponse([]);
      }
      if (url.endsWith('/portal/messages') && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        state.portalSnapshot = {
          ...state.portalSnapshot,
          messages: [
            {
              id: `msg-${state.portalSnapshot.messages.length + 1}`,
              subject: 'Portal message',
              body: body.body,
              attachments: [],
            },
            ...state.portalSnapshot.messages,
          ],
        };
        return jsonResponse({ id: 'msg-created' });
      }

      return jsonResponse({ error: `Unexpected ${method} ${url}` }, 500);
    });

    vi.stubGlobal('fetch', fetchMock);

    const loginView = render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/auth/login',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(window.localStorage.getItem('session_token')).toBe('session-token-1');
    });
    loginView.unmount();

    const dashboardView = render(<DashboardPage />);
    await screen.findByText('Open Matters');
    const openMattersCard = screen.getByText('Open Matters').closest('.card');
    const tasksCard = screen.getByText('Tasks').closest('.card');
    expect(openMattersCard).toHaveTextContent('1');
    expect(tasksCard).toHaveTextContent('2');
    dashboardView.unmount();

    const mattersView = render(<MattersPage />);
    await screen.findByText('Construction Intake Wizard');
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/matters',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText('M-2026-001')).toBeInTheDocument();
    });
    mattersView.unmount();

    render(<PortalPage />);
    await screen.findByText('Portal Messages');
    fireEvent.change(screen.getByLabelText('Portal Matter'), {
      target: { value: state.matters[0]?.id || 'matter-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByRole('dialog', { name: 'Confirm Client Message Send' });
    fireEvent.click(screen.getByRole('button', { name: 'Approve Send' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/portal/messages',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText('Can you share the latest mediation timeline?')).toBeInTheDocument();
    });
  });
});

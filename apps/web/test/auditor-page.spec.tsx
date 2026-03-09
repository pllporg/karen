import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import AuditorPage from '../app/auditor/page';

function jsonResponse<T>(payload: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response;
}

const fixtureSignals = [
  {
    id: 'sig-1',
    severity: 'critical',
    signalType: 'deadline_risk',
    matterLabel: 'Acme v. Dawson',
    status: 'IN_REVIEW',
    updatedAt: '2026-02-27T12:00:00.000Z',
    summary: 'Critical deadline risk requires review.',
    detail: 'Pleading deadline is overdue by 2 days.',
  },
];

describe('AuditorPage', () => {
  let consoleErrorMock: ReturnType<typeof vi.spyOn> | undefined;

  beforeEach(() => {
    consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    expect(consoleErrorMock).toBeDefined();
    expect(consoleErrorMock).not.toHaveBeenCalled();
    consoleErrorMock?.mockRestore();
    vi.restoreAllMocks();
  });

  it('renders queue table with required columns', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method?.toUpperCase() ?? 'GET';
      if (url.endsWith('/auditor/signals') && method === 'GET') {
        return jsonResponse(fixtureSignals);
      }
      return jsonResponse({}, 500);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AuditorPage />);

    expect(await screen.findByRole('columnheader', { name: 'Severity' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Signal Type' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Matter Label' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Status' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Updated Timestamp' })).toBeInTheDocument();
    expect(await screen.findByRole('cell', { name: 'CRITICAL' })).toBeInTheDocument();
  });

  it('opens and closes review drawer while preserving queue context', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(fixtureSignals)));

    render(<AuditorPage />);

    const reviewButton = await screen.findByRole('button', { name: 'Review sig-1' });
    reviewButton.focus();
    fireEvent.click(reviewButton);

    expect(screen.getByText('Signal ID: sig-1')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => {
      expect(screen.queryByText('Signal ID: sig-1')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Acme v. Dawson')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Review sig-1' })).toHaveFocus();
    });
  });

  it('supports keyboard focus flow with interactive controls using focus-visible-compatible classes', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => jsonResponse(fixtureSignals)));

    render(<AuditorPage />);

    const severityFilter = await screen.findByRole('combobox', { name: 'Severity Filter' });
    const reviewButton = await screen.findByRole('button', { name: 'Review sig-1' });

    severityFilter.focus();
    expect(severityFilter).toHaveFocus();
    expect(severityFilter).toHaveClass('select');

    reviewButton.focus();
    expect(reviewButton).toHaveFocus();
    expect(reviewButton).toHaveClass('button');
  });

  it('shows success and error feedback for action transitions', async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method?.toUpperCase() ?? 'GET';

      if (url.endsWith('/auditor/signals') && method === 'GET') {
        return jsonResponse(fixtureSignals);
      }
      if (url.endsWith('/auditor/signals/sig-1/review') && method === 'POST') {
        return jsonResponse({ ok: true });
      }
      return jsonResponse({}, 500);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AuditorPage />);

    fireEvent.click(await screen.findByRole('button', { name: 'Review sig-1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Approve' }));

    expect(await screen.findByRole('status')).toHaveTextContent(/APPROVE recorded for sig-1/i);

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method?.toUpperCase() ?? 'GET';
      if (url.endsWith('/auditor/signals') && method === 'GET') {
        return jsonResponse(fixtureSignals);
      }
      if (url.includes('/auditor/signals/sig-1/')) {
        return jsonResponse({ message: 'transition blocked' }, 500);
      }
      return jsonResponse({}, 500);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Review sig-1' }));
    fireEvent.click(screen.getByRole('button', { name: 'Execute' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to execute signal sig-1. No transition applied.');
  });
});

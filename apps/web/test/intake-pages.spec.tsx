import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as nextNavigation from 'next/navigation';
import IntakeQueuePage from '../app/intake/page';
import IntakeNewLeadPage from '../app/intake/new/page';
import LeadConflictPage from '../app/intake/[leadId]/conflict/page';

function jsonResponse<T>(payload: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response;
}

describe('Intake routes', () => {
  beforeEach(() => {
    window.localStorage.setItem('session_token', 'test-session-token');
  });

  afterEach(() => {
    window.localStorage.removeItem('session_token');
    vi.restoreAllMocks();
  });

  it('renders intake queue rows from leads API', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse([
        {
          id: 'lead-1',
          source: 'Website Form',
          stage: 'NEW',
          notes: null,
          createdAt: '2026-02-20T01:00:00.000Z',
          updatedAt: '2026-02-20T01:00:00.000Z',
        },
      ]),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<IntakeQueuePage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/leads',
        expect.objectContaining({ credentials: 'include' }),
      );
    });

    expect(await screen.findByText('Website Form')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Intake' })).toHaveAttribute('href', '/intake/lead-1/intake');
    expect(screen.getByRole('link', { name: 'Conflict' })).toHaveAttribute('href', '/intake/lead-1/conflict');
    expect(screen.getByRole('link', { name: 'Engagement' })).toHaveAttribute('href', '/intake/lead-1/engagement');
    expect(screen.getByRole('link', { name: 'Convert' })).toHaveAttribute('href', '/intake/lead-1/convert');
  });

  it('creates lead then redirects from /intake/new', async () => {
    const push = vi.fn();
    vi.spyOn(nextNavigation, 'useRouter').mockReturnValue({
      push,
      replace: vi.fn(),
      refresh: vi.fn(),
      prefetch: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
    } as unknown as ReturnType<typeof nextNavigation.useRouter>);

    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        id: 'lead-9',
        source: 'Website Form',
        stage: 'NEW',
        notes: null,
        createdAt: '2026-02-20T01:00:00.000Z',
        updatedAt: '2026-02-20T01:00:00.000Z',
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<IntakeNewLeadPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Create Lead and Open Intake' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/leads',
        expect.objectContaining({ method: 'POST' }),
      );
    });
    expect(push).toHaveBeenCalledWith('/intake/lead-9/intake');
  });

  it('runs and resolves conflict on staged conflict route', async () => {
    vi.spyOn(nextNavigation, 'useParams').mockReturnValue({ leadId: 'lead-5' });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ id: 'cc-1' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'cc-1' }));
    vi.stubGlobal('fetch', fetchMock);

    render(<LeadConflictPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Run Conflict Check' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mark Resolved' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'http://localhost:4000/leads/lead-5/conflict-check',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'http://localhost:4000/leads/lead-5/conflict-resolution',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });
});

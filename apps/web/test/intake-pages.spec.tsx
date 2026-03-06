import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as nextNavigation from 'next/navigation';
import IntakeQueuePage from '../app/intake/page';
import IntakeNewLeadPage from '../app/intake/new/page';
import LeadConflictPage from '../app/intake/[leadId]/conflict/page';
import LeadEngagementPage from '../app/intake/[leadId]/engagement/page';
import LeadConvertPage from '../app/intake/[leadId]/convert/page';
import LeadIntakeDraftPage from '../app/intake/[leadId]/intake/page';

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

  it('blocks lead creation when source is blank', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<IntakeNewLeadPage />);

    fireEvent.change(screen.getByLabelText(/Lead Source/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Lead and Open Intake' }));

    expect(await screen.findByText('Lead source is required.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('validates the intake draft before submitting', async () => {
    vi.spyOn(nextNavigation, 'useParams').mockReturnValue({ leadId: 'lead-7' });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<LeadIntakeDraftPage />);

    fireEvent.change(screen.getByDisplayValue('1234 Orchard Lane'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Submit Intake Draft' }));

    expect(await screen.findByText('Property address is required.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
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

  it('blocks conflict check when query text is blank', async () => {
    vi.spyOn(nextNavigation, 'useParams').mockReturnValue({ leadId: 'lead-5' });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<LeadConflictPage />);

    fireEvent.change(screen.getByLabelText(/Conflict Query/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run Conflict Check' }));

    expect(await screen.findByText('Conflict query is required.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('generates then sends engagement routing payloads', async () => {
    vi.spyOn(nextNavigation, 'useParams').mockReturnValue({ leadId: 'lead-11' });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ id: 'env-9' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'env-9' }));
    vi.stubGlobal('fetch', fetchMock);

    render(<LeadEngagementPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Generate Envelope' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'http://localhost:4000/leads/lead-11/engagement/generate',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    expect(screen.getByLabelText(/Envelope ID/i)).toHaveValue('env-9');

    fireEvent.click(screen.getByRole('button', { name: 'Send Envelope' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'http://localhost:4000/leads/lead-11/engagement/send',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });

  it('blocks conversion when required matter fields are blank', async () => {
    vi.spyOn(nextNavigation, 'useParams').mockReturnValue({ leadId: 'lead-19' });
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse({
        leadId: 'lead-19',
        intakeDraft: true,
        conflictResolved: true,
        engagementSigned: true,
        readyToConvert: true,
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<LeadConvertPage />);

    await screen.findByText('Yes');

    fireEvent.change(screen.getByLabelText(/Matter Name/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Convert Lead' }));

    expect(await screen.findByText('Matter name is required.')).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

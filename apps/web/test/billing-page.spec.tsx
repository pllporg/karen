import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import BillingPage from '../app/billing/page';

function jsonResponse<T>(payload: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response;
}

describe('BillingPage trust reconciliation workflow', () => {
  it('creates, resolves, and completes trust reconciliation runs', async () => {
    const runDraft = {
      id: 'run-1',
      status: 'DRAFT',
      statementStartAt: '2026-01-01T00:00:00.000Z',
      statementEndAt: '2026-01-31T23:59:59.999Z',
      discrepancies: [{ id: 'disc-1', status: 'OPEN' }],
    };
    const runInReviewOpen = {
      ...runDraft,
      status: 'IN_REVIEW',
      discrepancies: [{ id: 'disc-1', status: 'OPEN' }],
    };
    const runInReviewResolved = {
      ...runDraft,
      status: 'IN_REVIEW',
      discrepancies: [{ id: 'disc-1', status: 'RESOLVED' }],
    };
    const runCompleted = {
      ...runDraft,
      status: 'COMPLETED',
      discrepancies: [{ id: 'disc-1', status: 'RESOLVED' }],
    };

    let runs = [runDraft];
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || 'GET';

      if (url.endsWith('/billing/invoices')) return jsonResponse([]);
      if (url.endsWith('/billing/trust/report')) return jsonResponse([]);
      if (url.endsWith('/billing/ledes/profiles')) return jsonResponse([]);
      if (url.endsWith('/billing/ledes/jobs')) return jsonResponse([]);

      if (url.endsWith('/billing/trust/reconciliation/runs') && method === 'GET') return jsonResponse(runs);
      if (url.endsWith('/billing/trust/reconciliation/runs') && method === 'POST') {
        runs = [runInReviewOpen];
        return jsonResponse({ id: 'created-run' });
      }

      if (url.endsWith('/billing/trust/reconciliation/discrepancies/disc-1/resolve') && method === 'POST') {
        runs = [runInReviewResolved];
        return jsonResponse({ id: 'resolved-discrepancy' });
      }

      if (url.endsWith('/billing/trust/reconciliation/runs/run-1/complete') && method === 'POST') {
        runs = [runCompleted];
        return jsonResponse({ id: 'completed-run' });
      }

      return jsonResponse({ error: `Unexpected ${method} ${url}` }, 500);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<BillingPage />);
    await screen.findByText('run-1');

    fireEvent.click(screen.getByRole('button', { name: 'Create Reconciliation Run' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/billing/trust/reconciliation/runs',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText('Created reconciliation run.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Resolve disc-1' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/billing/trust/reconciliation/discrepancies/disc-1/resolve',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText('Resolved discrepancy disc-1.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Complete' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/billing/trust/reconciliation/runs/run-1/complete',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText('Completed reconciliation run run-1.')).toBeInTheDocument();
    });
  });
});

describe('BillingPage LEDES export workflow', () => {
  it('creates profile, runs export job, and fetches download url', async () => {
    let profiles: any[] = [];
    let jobs: any[] = [];
    const openMock = vi.fn();
    Object.defineProperty(window, 'open', { value: openMock, writable: true });

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || 'GET';

      if (url.endsWith('/billing/invoices')) return jsonResponse([]);
      if (url.endsWith('/billing/trust/report')) return jsonResponse([]);
      if (url.endsWith('/billing/trust/reconciliation/runs')) return jsonResponse([]);

      if (url.endsWith('/billing/ledes/profiles') && method === 'GET') return jsonResponse(profiles);
      if (url.endsWith('/billing/ledes/profiles') && method === 'POST') {
        const profile = { id: 'profile-1', name: 'Default LEDES 1998B', format: 'LEDES98B', isDefault: true };
        profiles = [profile];
        return jsonResponse(profile);
      }

      if (url.endsWith('/billing/ledes/jobs') && method === 'GET') return jsonResponse(jobs);
      if (url.endsWith('/billing/ledes/jobs') && method === 'POST') {
        const job = {
          id: 'job-1',
          profileId: 'profile-1',
          profile: profiles[0],
          status: 'COMPLETED',
          validationStatus: 'PASSED',
          lineCount: 2,
          totalAmount: 2200,
        };
        jobs = [job];
        return jsonResponse(job);
      }

      if (url.endsWith('/billing/ledes/jobs/job-1/download') && method === 'GET') {
        return jsonResponse({ jobId: 'job-1', downloadUrl: 'https://download.local/ledes-job-1.txt' });
      }

      return jsonResponse({ error: `Unexpected ${method} ${url}` }, 500);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<BillingPage />);

    fireEvent.change(screen.getByPlaceholderText('New LEDES profile name'), {
      target: { value: 'Default LEDES 1998B' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Profile' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/billing/ledes/profiles',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText('Created LEDES profile "Default LEDES 1998B".')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Run LEDES Export' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/billing/ledes/jobs',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText('Created LEDES export job job-1.')).toBeInTheDocument();
    });

    await screen.findByText('job-1');
    fireEvent.click(screen.getByRole('button', { name: 'Download' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/billing/ledes/jobs/job-1/download',
        expect.objectContaining({ credentials: 'include' }),
      );
      expect(openMock).toHaveBeenCalledWith('https://download.local/ledes-job-1.txt', '_blank', 'noopener,noreferrer');
    });
  });
});

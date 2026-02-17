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

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([runDraft]))
      .mockResolvedValueOnce(jsonResponse({ id: 'created-run' }))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([runInReviewOpen]))
      .mockResolvedValueOnce(jsonResponse({ id: 'resolved-discrepancy' }))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([runInReviewResolved]))
      .mockResolvedValueOnce(jsonResponse({ id: 'completed-run' }))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([runCompleted]));

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

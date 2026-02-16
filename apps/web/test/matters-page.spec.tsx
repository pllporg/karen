import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import MattersPage from '../app/matters/page';

function jsonResponse<T>(payload: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response;
}

describe('MattersPage', () => {
  it('creates a matter and refreshes the list', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ id: 'created' }))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 'matter-1',
            matterNumber: 'M-2026-001',
            name: 'Kitchen Remodel Defect - Ortega',
            practiceArea: 'Construction Litigation',
            status: 'OPEN',
          },
        ]),
      );
    vi.stubGlobal('fetch', fetchMock);

    render(<MattersPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/matters',
        expect.objectContaining({
          credentials: 'include',
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
        }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/matters',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"matterNumber":"M-2026-001"'),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'M-2026-001' })).toBeInTheDocument();
    });
  });

  it('creates a matter via intake wizard and refreshes the list', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ id: 'created-intake' }))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 'matter-2',
            matterNumber: 'M-2026-001-INTAKE',
            name: 'Kitchen Remodel Defect - Ortega (Intake)',
            practiceArea: 'Construction Litigation',
            status: 'OPEN',
          },
        ]),
      );
    vi.stubGlobal('fetch', fetchMock);

    render(<MattersPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/matters',
        expect.objectContaining({
          credentials: 'include',
        }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create via Intake Wizard' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/matters/intake-wizard',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"defects":[{"category":"Water Intrusion","severity":"High"}]'),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'M-2026-001-INTAKE' })).toBeInTheDocument();
    });
  });
});

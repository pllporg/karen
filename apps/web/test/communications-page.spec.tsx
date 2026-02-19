import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import CommunicationsPage from '../app/communications/page';

function jsonResponse<T>(payload: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response;
}

describe('CommunicationsPage', () => {
  it('renders thread choices as keyboard-safe buttons and updates active selection', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(
      jsonResponse([
        { id: 'thread-1', subject: 'Mediation Scheduling' },
        { id: 'thread-2', subject: 'Inspection Follow-Up' },
      ]),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<CommunicationsPage />);

    const mediationThread = await screen.findByRole('button', { name: /Mediation Scheduling/i });
    const inspectionThread = screen.getByRole('button', { name: /Inspection Follow-Up/i });

    expect(mediationThread).toHaveAttribute('aria-pressed', 'true');
    expect(inspectionThread).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(inspectionThread);

    expect(inspectionThread).toHaveAttribute('aria-pressed', 'true');
    expect(mediationThread).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText('Active thread: thread-2')).toBeInTheDocument();
  });

  it('executes keyword search and reports result count via live status', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([{ id: 'thread-1', subject: 'Mediation Scheduling' }]))
      .mockResolvedValueOnce(
        jsonResponse([
          { id: 'msg-1', subject: 'Mediation dates', body: 'Proposed dates for mediation hearing.' },
          { id: 'msg-2', subject: 'Witness call', body: 'Confirmed witness call notes.' },
        ]),
      );
    vi.stubGlobal('fetch', fetchMock);

    render(<CommunicationsPage />);

    await screen.findByRole('button', { name: /Mediation Scheduling/i });

    fireEvent.change(screen.getByPlaceholderText('Search communications...'), { target: { value: 'mediation' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith('http://localhost:4000/communications/search?q=mediation', expect.anything());
      expect(screen.getByText('Results: 2')).toBeInTheDocument();
    });
  });
});

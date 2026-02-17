import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import * as nextNavigation from 'next/navigation';
import MatterDashboardPage from '../app/matters/[id]/page';

function jsonResponse<T>(payload: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response;
}

describe('MatterDashboardPage deadline rules pack flow', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('previews and applies deadlines from selected rules pack', async () => {
    vi.spyOn(nextNavigation, 'useParams').mockReturnValue({ id: 'matter-1' });

    const dashboardFixture = {
      matterNumber: 'M-100',
      name: 'Doe v. Builder',
      practiceArea: 'Construction Litigation',
      status: 'OPEN',
      venue: 'Superior',
      jurisdiction: 'CA',
      participants: [],
      docketEntries: [],
      tasks: [],
      calendarEvents: [],
      communicationThreads: [],
      documents: [],
      invoices: [],
      aiJobs: [],
      domainSectionCompleteness: { completedCount: 0, totalCount: 0, completionPercent: 0, sections: {} },
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse(dashboardFixture))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 'pack-1',
            name: 'CA Superior Civil v1',
            pack: { version: '1.0' },
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          previewRows: [
            {
              ruleId: 'rule-1',
              name: 'Initial disclosures',
              eventType: 'Initial disclosures',
              computedDate: '2026-02-25T00:00:00.000Z',
            },
          ],
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ created: [{ id: 'evt-1' }] }))
      .mockResolvedValueOnce({
        ...jsonResponse({
          ...dashboardFixture,
          calendarEvents: [{ id: 'evt-1', type: 'Initial disclosures', startAt: '2026-02-25T00:00:00.000Z' }],
        }),
      });

    vi.stubGlobal('fetch', fetchMock);

    render(<MatterDashboardPage />);

    await screen.findByText('M-100 - Doe v. Builder');
    await screen.findByText('Preview rules to review computed deadlines before creating events.');

    fireEvent.change(screen.getByLabelText('Trigger Date'), { target: { value: '2026-01-20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Preview Deadlines' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/calendar/deadline-preview',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
    });

    fireEvent.change(screen.getByLabelText('Override Reason rule-1'), {
      target: { value: 'Court requested extension' },
    });
    fireEvent.change(screen.getByLabelText('Override Date rule-1'), { target: { value: '2026-02-27' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply Selected' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/calendar/deadline-preview/apply',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText('Created 1 calendar events from rules pack.')).toBeInTheDocument();
    });
  });
});

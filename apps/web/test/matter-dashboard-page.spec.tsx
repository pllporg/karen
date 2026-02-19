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

  it('creates tasks, updates task status, and logs calendar events', async () => {
    vi.spyOn(nextNavigation, 'useParams').mockReturnValue({ id: 'matter-1' });

    const state: {
      tasks: Array<{ id: string; title: string; status: string; dueAt: string | null }>;
      calendarEvents: Array<{ id: string; type: string; startAt: string }>;
    } = {
      tasks: [],
      calendarEvents: [],
    };

    const dashboardFixture = () => ({
      matterNumber: 'M-100',
      name: 'Doe v. Builder',
      practiceArea: 'Construction Litigation',
      status: 'OPEN',
      venue: 'Superior',
      jurisdiction: 'CA',
      participants: [],
      docketEntries: [],
      tasks: state.tasks,
      calendarEvents: state.calendarEvents,
      communicationThreads: [],
      documents: [],
      invoices: [],
      aiJobs: [],
      domainSectionCompleteness: { completedCount: 0, totalCount: 0, completionPercent: 0, sections: {} },
    });

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method || 'GET').toUpperCase();

      if (url.endsWith('/matters/matter-1/dashboard') && method === 'GET') {
        return jsonResponse(dashboardFixture());
      }

      if (url.endsWith('/calendar/rules-packs') && method === 'GET') {
        return jsonResponse([{ id: 'pack-1', name: 'CA Superior Civil v1', pack: { version: '1.0' } }]);
      }

      if (url.endsWith('/tasks') && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        const task = {
          id: `task-${state.tasks.length + 1}`,
          title: body.title,
          status: body.status || 'TODO',
          dueAt: body.dueAt || null,
        };
        state.tasks.push(task);
        return jsonResponse(task);
      }

      if (url.endsWith('/tasks/task-1') && method === 'PATCH') {
        const body = JSON.parse(String(init?.body || '{}'));
        state.tasks = state.tasks.map((task) => (task.id === 'task-1' ? { ...task, status: body.status } : task));
        return jsonResponse(state.tasks[0]);
      }

      if (url.endsWith('/calendar/events') && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        const event = {
          id: `event-${state.calendarEvents.length + 1}`,
          type: body.type,
          startAt: body.startAt,
        };
        state.calendarEvents.push(event);
        return jsonResponse(event);
      }

      throw new Error(`Unhandled request: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<MatterDashboardPage />);

    await screen.findByText('M-100 - Doe v. Builder');

    fireEvent.change(screen.getByLabelText('Task Title'), { target: { value: 'Draft meet-and-confer email' } });
    fireEvent.change(screen.getByLabelText('Task Due At'), { target: { value: '2026-03-01T09:30' } });
    fireEvent.change(screen.getByLabelText('Task Priority'), { target: { value: 'HIGH' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Task' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/tasks',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText('Task created.')).toBeInTheDocument();
      expect(screen.getByText('Draft meet-and-confer email')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Task Status task-1'), { target: { value: 'DONE' } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/tasks/task-1',
        expect.objectContaining({ method: 'PATCH', credentials: 'include' }),
      );
      expect(screen.getByText('Task status updated to DONE.')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Calendar Event Type'), { target: { value: 'Site inspection' } });
    fireEvent.change(screen.getByLabelText('Calendar Event Start'), { target: { value: '2026-03-02T14:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/calendar/events',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText('Calendar event created.')).toBeInTheDocument();
      expect(screen.getByText(/Site inspection/)).toBeInTheDocument();
    });
  });
});

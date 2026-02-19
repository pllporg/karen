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

function createDashboardState() {
  return {
    participants: [] as Array<{
      id: string;
      contactId: string;
      participantRoleKey: string;
      side: string;
      contact: { id: string; displayName: string };
      participantRoleDefinition?: { id: string; label: string; key: string } | null;
    }>,
    tasks: [] as Array<{ id: string; title: string; status: string; dueAt: string | null; priority?: string }>,
    calendarEvents: [] as Array<{
      id: string;
      type: string;
      startAt: string;
      endAt?: string | null;
      location?: string | null;
    }>,
    communicationThreads: [] as Array<{
      id: string;
      subject: string | null;
      messages: Array<{
        id: string;
        type: 'EMAIL' | 'SMS' | 'CALL_LOG' | 'PORTAL_MESSAGE' | 'INTERNAL_NOTE';
        direction: 'INBOUND' | 'OUTBOUND' | 'INTERNAL';
        subject: string | null;
        body: string;
        occurredAt: string;
      }>;
    }>,
  };
}

function buildDashboardFixture(
  state: ReturnType<typeof createDashboardState>,
  overrides: Partial<Record<string, unknown>> = {},
) {
  return {
    matterNumber: 'M-100',
    name: 'Doe v. Builder',
    practiceArea: 'Construction Litigation',
    status: 'OPEN',
    venue: 'Superior',
    jurisdiction: 'CA',
    participants: state.participants,
    docketEntries: [],
    tasks: state.tasks,
    calendarEvents: state.calendarEvents,
    communicationThreads: state.communicationThreads,
    documents: [],
    invoices: [],
    aiJobs: [],
    domainSectionCompleteness: { completedCount: 0, totalCount: 0, completionPercent: 0, sections: {} },
    ...overrides,
  };
}

describe('MatterDashboardPage operational workflows', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('previews and applies deadlines from selected rules pack', async () => {
    vi.spyOn(nextNavigation, 'useParams').mockReturnValue({ id: 'matter-1' });

    const state = createDashboardState();
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method || 'GET').toUpperCase();

      if (url.endsWith('/matters/matter-1/dashboard') && method === 'GET') {
        return jsonResponse(buildDashboardFixture(state));
      }
      if (url.endsWith('/calendar/rules-packs') && method === 'GET') {
        return jsonResponse([{ id: 'pack-1', name: 'CA Superior Civil v1', pack: { version: '1.0' } }]);
      }
      if (url.endsWith('/contacts') && method === 'GET') {
        return jsonResponse([]);
      }
      if (url.endsWith('/matters/matter-1/participant-roles') && method === 'GET') {
        return jsonResponse([]);
      }
      if (url.endsWith('/calendar/deadline-preview') && method === 'POST') {
        return jsonResponse({
          previewRows: [
            {
              ruleId: 'rule-1',
              name: 'Initial disclosures',
              eventType: 'Initial disclosures',
              computedDate: '2026-02-25T00:00:00.000Z',
            },
          ],
        });
      }
      if (url.endsWith('/calendar/deadline-preview/apply') && method === 'POST') {
        state.calendarEvents.push({
          id: 'evt-1',
          type: 'Initial disclosures',
          startAt: '2026-02-27T00:00:00.000Z',
        });
        return jsonResponse({ created: [{ id: 'evt-1' }] });
      }

      throw new Error(`Unhandled request: ${method} ${url}`);
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

  it('creates, edits, updates status, and deletes tasks plus calendar events', async () => {
    vi.spyOn(nextNavigation, 'useParams').mockReturnValue({ id: 'matter-1' });

    const state = createDashboardState();

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method || 'GET').toUpperCase();

      if (url.endsWith('/matters/matter-1/dashboard') && method === 'GET') {
        return jsonResponse(buildDashboardFixture(state));
      }
      if (url.endsWith('/calendar/rules-packs') && method === 'GET') {
        return jsonResponse([{ id: 'pack-1', name: 'CA Superior Civil v1', pack: { version: '1.0' } }]);
      }
      if (url.endsWith('/contacts') && method === 'GET') {
        return jsonResponse([{ id: 'contact-1', displayName: 'Jordan Homeowner', kind: 'PERSON' }]);
      }
      if (url.endsWith('/matters/matter-1/participant-roles') && method === 'GET') {
        return jsonResponse([{ id: 'role-1', key: 'expert', label: 'Expert Witness', sideDefault: 'NEUTRAL' }]);
      }
      if (url.endsWith('/tasks') && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        const task = {
          id: `task-${state.tasks.length + 1}`,
          title: body.title,
          status: body.status || 'TODO',
          dueAt: body.dueAt || null,
          priority: body.priority || 'MEDIUM',
        };
        state.tasks.push(task);
        return jsonResponse(task);
      }
      if (url.endsWith('/tasks/task-1') && method === 'PATCH') {
        const body = JSON.parse(String(init?.body || '{}'));
        state.tasks = state.tasks.map((task) =>
          task.id === 'task-1'
            ? {
                ...task,
                ...(body.status ? { status: body.status } : {}),
                ...(body.title ? { title: body.title } : {}),
                ...(body.dueAt ? { dueAt: body.dueAt } : {}),
                ...(body.priority ? { priority: body.priority } : {}),
              }
            : task,
        );
        return jsonResponse(state.tasks[0]);
      }
      if (url.endsWith('/tasks/task-1') && method === 'DELETE') {
        state.tasks = state.tasks.filter((task) => task.id !== 'task-1');
        return jsonResponse({ id: 'task-1', removed: true });
      }
      if (url.endsWith('/calendar/events') && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        const event = {
          id: `event-${state.calendarEvents.length + 1}`,
          type: body.type,
          startAt: body.startAt,
          endAt: body.endAt || null,
          location: body.location || null,
        };
        state.calendarEvents.push(event);
        return jsonResponse(event);
      }
      if (url.endsWith('/calendar/events/event-1') && method === 'PATCH') {
        const body = JSON.parse(String(init?.body || '{}'));
        state.calendarEvents = state.calendarEvents.map((event) =>
          event.id === 'event-1'
            ? {
                ...event,
                ...(body.type ? { type: body.type } : {}),
                ...(body.startAt ? { startAt: body.startAt } : {}),
                ...(body.endAt ? { endAt: body.endAt } : {}),
                ...(body.clearEndAt ? { endAt: null } : {}),
                ...(body.location ? { location: body.location } : {}),
              }
            : event,
        );
        return jsonResponse(state.calendarEvents[0]);
      }
      if (url.endsWith('/calendar/events/event-1') && method === 'DELETE') {
        state.calendarEvents = state.calendarEvents.filter((event) => event.id !== 'event-1');
        return jsonResponse({ id: 'event-1', removed: true });
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

    fireEvent.click(screen.getByRole('button', { name: 'Edit Task task-1' }));
    fireEvent.change(screen.getByLabelText('Task Title'), { target: { value: 'Send revised meet-and-confer email' } });
    fireEvent.change(screen.getByLabelText('Task Priority'), { target: { value: 'URGENT' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Task Edit' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/tasks/task-1',
        expect.objectContaining({ method: 'PATCH', credentials: 'include' }),
      );
      expect(screen.getByText('Task updated.')).toBeInTheDocument();
      expect(screen.getByText('Send revised meet-and-confer email')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Task Status task-1'), { target: { value: 'DONE' } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/tasks/task-1',
        expect.objectContaining({ method: 'PATCH', credentials: 'include' }),
      );
      expect(screen.getByText('Task status updated to DONE.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete Task task-1' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/tasks/task-1',
        expect.objectContaining({ method: 'DELETE', credentials: 'include' }),
      );
      expect(screen.getByText('Task removed.')).toBeInTheDocument();
      expect(screen.queryByText('Send revised meet-and-confer email')).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Calendar Event Type'), { target: { value: 'Site inspection' } });
    fireEvent.change(screen.getByLabelText('Calendar Event Start'), { target: { value: '2026-03-02T14:00' } });
    fireEvent.change(screen.getByLabelText('Calendar Event End'), { target: { value: '2026-03-02T15:00' } });
    fireEvent.change(screen.getByLabelText('Calendar Event Location'), { target: { value: 'Property address' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/calendar/events',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText('Calendar event created.')).toBeInTheDocument();
      expect(screen.getByText(/Site inspection/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit Calendar Event event-1' }));
    fireEvent.change(screen.getByLabelText('Calendar Event Type'), { target: { value: 'Updated site inspection' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Event Edit' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/calendar/events/event-1',
        expect.objectContaining({ method: 'PATCH', credentials: 'include' }),
      );
      expect(screen.getByText('Calendar event updated.')).toBeInTheDocument();
      expect(screen.getByText('Updated site inspection')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete Calendar Event event-1' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/calendar/events/event-1',
        expect.objectContaining({ method: 'DELETE', credentials: 'include' }),
      );
      expect(screen.getByText('Calendar event removed.')).toBeInTheDocument();
      expect(screen.getByText('No calendar events for this matter yet.')).toBeInTheDocument();
    });
  });

  it('adds and removes participants in matter context', async () => {
    vi.spyOn(nextNavigation, 'useParams').mockReturnValue({ id: 'matter-1' });

    const state = createDashboardState();
    const contacts = [
      { id: 'contact-1', displayName: 'Jordan Homeowner', kind: 'PERSON' },
      { id: 'contact-2', displayName: 'Taylor Expert', kind: 'PERSON' },
    ];
    const roles = [
      { id: 'role-1', key: 'expert', label: 'Expert Witness', sideDefault: 'NEUTRAL' as const },
      { id: 'role-2', key: 'opposing_party', label: 'Opposing Party', sideDefault: 'OPPOSING_SIDE' as const },
    ];

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method || 'GET').toUpperCase();

      if (url.endsWith('/matters/matter-1/dashboard') && method === 'GET') {
        return jsonResponse(buildDashboardFixture(state));
      }
      if (url.endsWith('/calendar/rules-packs') && method === 'GET') {
        return jsonResponse([{ id: 'pack-1', name: 'CA Superior Civil v1', pack: { version: '1.0' } }]);
      }
      if (url.endsWith('/contacts') && method === 'GET') {
        return jsonResponse(contacts);
      }
      if (url.endsWith('/matters/matter-1/participant-roles') && method === 'GET') {
        return jsonResponse(roles);
      }
      if (url.endsWith('/matters/matter-1/participants') && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        const contact = contacts.find((item) => item.id === body.contactId);
        const role = roles.find((item) => item.key === body.participantRoleKey);
        const participant = {
          id: `participant-${state.participants.length + 1}`,
          contactId: body.contactId,
          participantRoleKey: body.participantRoleKey,
          side: role?.sideDefault || 'NEUTRAL',
          contact: contact ? { id: contact.id, displayName: contact.displayName } : { id: body.contactId, displayName: body.contactId },
          participantRoleDefinition: role ? { id: role.id, key: role.key, label: role.label } : null,
        };
        state.participants.push(participant);
        return jsonResponse(participant);
      }
      if (url.endsWith('/matters/matter-1/participants/participant-1') && method === 'DELETE') {
        state.participants = state.participants.filter((participant) => participant.id !== 'participant-1');
        return jsonResponse({ id: 'participant-1', removed: true });
      }

      throw new Error(`Unhandled request: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<MatterDashboardPage />);

    await screen.findByText('M-100 - Doe v. Builder');

    fireEvent.change(screen.getByLabelText('Participant Contact'), { target: { value: 'contact-2' } });
    fireEvent.change(screen.getByLabelText('Participant Role'), { target: { value: 'expert' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Participant' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/matters/matter-1/participants',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText('Participant added.')).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Taylor Expert' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Expert Witness' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Remove Participant participant-1' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/matters/matter-1/participants/participant-1',
        expect.objectContaining({ method: 'DELETE', credentials: 'include' }),
      );
      expect(screen.getByText('Participant removed.')).toBeInTheDocument();
      expect(screen.queryByRole('cell', { name: 'Taylor Expert' })).not.toBeInTheDocument();
    });
  });

  it('logs, edits, and deletes communications from matter dashboard context', async () => {
    vi.spyOn(nextNavigation, 'useParams').mockReturnValue({ id: 'matter-1' });

    const state = createDashboardState();
    state.communicationThreads.push({
      id: 'thread-1',
      subject: 'Initial Intake',
      messages: [],
    });

    const contacts = [
      { id: 'contact-1', displayName: 'Jordan Homeowner', kind: 'PERSON' },
      { id: 'contact-2', displayName: 'Taylor Expert', kind: 'PERSON' },
    ];

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method || 'GET').toUpperCase();

      if (url.endsWith('/matters/matter-1/dashboard') && method === 'GET') {
        return jsonResponse(buildDashboardFixture(state));
      }
      if (url.endsWith('/calendar/rules-packs') && method === 'GET') {
        return jsonResponse([{ id: 'pack-1', name: 'CA Superior Civil v1', pack: { version: '1.0' } }]);
      }
      if (url.endsWith('/contacts') && method === 'GET') {
        return jsonResponse(contacts);
      }
      if (url.endsWith('/matters/matter-1/participant-roles') && method === 'GET') {
        return jsonResponse([]);
      }
      if (url.endsWith('/matters/matter-1/communications/log') && method === 'POST') {
        const payload = JSON.parse(String(init?.body || '{}'));
        let thread = state.communicationThreads.find((item) => item.id === payload.threadId);
        if (!thread) {
          thread = {
            id: `thread-${state.communicationThreads.length + 1}`,
            subject: payload.threadSubject || 'Thread',
            messages: [],
          };
          state.communicationThreads.unshift(thread);
        }
        const message = {
          id: `message-${thread.messages.length + 1}`,
          type: payload.type,
          direction: payload.direction,
          subject: payload.subject || null,
          body: payload.body,
          occurredAt: payload.occurredAt || '2026-02-19T14:15:00.000Z',
          participants: payload.participantContactId
            ? [
                {
                  id: `participant-${thread.messages.length + 1}`,
                  role: payload.direction === 'INBOUND' ? 'FROM' : payload.direction === 'OUTBOUND' ? 'TO' : 'OTHER',
                  contact: contacts.find((contact) => contact.id === payload.participantContactId) || null,
                },
              ]
            : [],
        };
        thread.messages.unshift(message);
        return jsonResponse({
          ...message,
          threadId: thread.id,
        });
      }
      if (url.endsWith('/matters/matter-1/communications/message-1') && method === 'PATCH') {
        const payload = JSON.parse(String(init?.body || '{}'));
        const thread = state.communicationThreads.find((item) => item.id === payload.threadId);
        if (!thread) {
          throw new Error(`Thread not found: ${payload.threadId}`);
        }

        for (const candidate of state.communicationThreads) {
          candidate.messages = candidate.messages.filter((item) => item.id !== 'message-1');
        }

        const updatedMessage = {
          id: 'message-1',
          type: payload.type,
          direction: payload.direction,
          subject: payload.subject || null,
          body: payload.body,
          occurredAt: payload.occurredAt || '2026-02-19T15:00:00.000Z',
          participants: payload.participantContactId
            ? [
                {
                  id: 'participant-updated',
                  role: payload.direction === 'INBOUND' ? 'FROM' : payload.direction === 'OUTBOUND' ? 'TO' : 'OTHER',
                  contact: contacts.find((contact) => contact.id === payload.participantContactId) || null,
                },
              ]
            : [],
        };
        thread.messages.unshift(updatedMessage);
        return jsonResponse({
          ...updatedMessage,
          threadId: thread.id,
        });
      }
      if (url.endsWith('/matters/matter-1/communications/message-1') && method === 'DELETE') {
        for (const thread of state.communicationThreads) {
          thread.messages = thread.messages.filter((item) => item.id !== 'message-1');
        }
        return jsonResponse({ id: 'message-1', removed: true });
      }

      throw new Error(`Unhandled request: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<MatterDashboardPage />);

    await screen.findByText('M-100 - Doe v. Builder');
    await screen.findByText('No communications logged for this matter yet.');

    fireEvent.change(screen.getByLabelText('Communication Thread'), { target: { value: '__new__' } });
    fireEvent.change(screen.getByLabelText('Communication Thread Subject'), { target: { value: 'Mediation updates' } });
    fireEvent.change(screen.getByLabelText('Communication Type'), { target: { value: 'CALL_LOG' } });
    fireEvent.change(screen.getByLabelText('Communication Direction'), { target: { value: 'INBOUND' } });
    fireEvent.change(screen.getByLabelText('Communication Contact'), { target: { value: 'contact-1' } });
    fireEvent.change(screen.getByLabelText('Communication Occurred At'), { target: { value: '2026-03-04T09:30' } });
    fireEvent.change(screen.getByLabelText('Communication Subject'), { target: { value: 'Mediation slot follow-up' } });
    fireEvent.change(screen.getByLabelText('Communication Body'), {
      target: { value: 'Client called to confirm proposed mediation windows.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Log Communication' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/matters/matter-1/communications/log',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText('Communication entry logged.')).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Mediation updates' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'CALL_LOG' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'INBOUND' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Jordan Homeowner' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Mediation slot follow-up' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit Communication message-1' }));
    fireEvent.change(screen.getByLabelText('Communication Type'), { target: { value: 'EMAIL' } });
    fireEvent.change(screen.getByLabelText('Communication Direction'), { target: { value: 'OUTBOUND' } });
    fireEvent.change(screen.getByLabelText('Communication Contact'), { target: { value: 'contact-2' } });
    fireEvent.change(screen.getByLabelText('Communication Subject'), { target: { value: 'Updated mediation confirmation' } });
    fireEvent.change(screen.getByLabelText('Communication Body'), {
      target: { value: 'Sent confirmed mediation windows to client via email.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save Communication Edit' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/matters/matter-1/communications/message-1',
        expect.objectContaining({ method: 'PATCH', credentials: 'include' }),
      );
      expect(screen.getByText('Communication entry updated.')).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'EMAIL' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'OUTBOUND' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Taylor Expert' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Updated mediation confirmation' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete Communication message-1' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/matters/matter-1/communications/message-1',
        expect.objectContaining({ method: 'DELETE', credentials: 'include' }),
      );
      expect(screen.getByText('Communication entry removed.')).toBeInTheDocument();
      expect(screen.getByText('No communications logged for this matter yet.')).toBeInTheDocument();
    });
  });
});

import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
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
      isPrimary?: boolean;
      representedByContactId?: string | null;
      lawFirmContactId?: string | null;
      notes?: string | null;
      contact: { id: string; displayName: string };
      representedByContact?: { id: string; displayName: string } | null;
      lawFirmContact?: { id: string; displayName: string } | null;
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
    documents: [] as Array<{
      id: string;
      title: string;
      sharedWithClient: boolean;
      versions: Array<{ id: string }>;
    }>,
    invoices: [] as Array<{
      id: string;
      invoiceNumber: string;
      status: string;
      total: number;
      balanceDue: number;
      payments: Array<{ id: string; amount: number; method: string; reference?: string | null }>;
      lineItems: Array<{ id: string; description: string; quantity: number; unitPrice: number }>;
    }>,
    timeEntries: [] as Array<{
      id: string;
      startedAt: string;
      durationMinutes: number;
      amount: number;
    }>,
    expenses: [] as Array<{
      id: string;
      description: string;
      incurredAt: string;
      amount: number;
    }>,
    trustLedgers: [] as Array<{
      id: string;
      trustAccountId: string;
      balance: number;
      trustAccount?: { id: string; name: string } | null;
    }>,
    trustTransactions: [] as Array<{
      id: string;
      type: string;
      amount: number;
      occurredAt: string;
      trustAccountId: string;
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
    documents: state.documents,
    invoices: state.invoices,
    timeEntries: state.timeEntries,
    expenses: state.expenses,
    trustLedgers: state.trustLedgers,
    trustTransactions: state.trustTransactions,
    aiJobs: [],
    domainSectionCompleteness: { completedCount: 0, totalCount: 0, completionPercent: 0, sections: {} },
    ...overrides,
  };
}

async function expectFetchRequest(
  fetchMock: ReturnType<typeof vi.fn>,
  url: string,
  method: string,
) {
  await waitFor(() => {
    const hasRequest = fetchMock.mock.calls.some(([input, init]) => {
      const requestUrl = String(input);
      const requestMethod = String(init?.method || 'GET').toUpperCase();
      return requestUrl === url && requestMethod === method.toUpperCase();
    });
    expect(hasRequest).toBe(true);
  });
}

describe('MatterDashboardPage operational workflows', () => {
  afterEach(() => {
    cleanup();
    vi.clearAllTimers();
    vi.useRealTimers();
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
    await waitFor(() => {
      expect(screen.getByLabelText('Rules Pack')).toHaveValue('pack-1');
    });

    fireEvent.change(screen.getByLabelText('Trigger Date'), { target: { value: '2026-01-20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Preview Deadlines' }));

    await expectFetchRequest(fetchMock, 'http://localhost:4000/calendar/deadline-preview', 'POST');

    fireEvent.change(await screen.findByLabelText('Override Reason rule-1'), {
      target: { value: 'Court requested extension' },
    });
    fireEvent.change(await screen.findByLabelText('Override Date rule-1'), { target: { value: '2026-02-27' } });
    fireEvent.click(screen.getByRole('button', { name: 'Apply Selected' }));

    await expectFetchRequest(fetchMock, 'http://localhost:4000/calendar/deadline-preview/apply', 'POST');
    expect(await screen.findByText('Created 1 calendar events from rules pack.')).toBeInTheDocument();
  });

  it('creates, edits, updates status, and deletes tasks plus calendar events', { timeout: 40000 }, async () => {
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

    await expectFetchRequest(fetchMock, 'http://localhost:4000/tasks', 'POST');
    expect(await screen.findByText('Task created.')).toBeInTheDocument();
    expect(await screen.findByText('Draft meet-and-confer email')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Edit Task task-1' }));
    fireEvent.change(screen.getByLabelText('Task Title'), { target: { value: 'Send revised meet-and-confer email' } });
    fireEvent.change(screen.getByLabelText('Task Priority'), { target: { value: 'URGENT' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Task Edit' }));

    await expectFetchRequest(fetchMock, 'http://localhost:4000/tasks/task-1', 'PATCH');
    expect(await screen.findByText('Task updated.')).toBeInTheDocument();
    expect(await screen.findByText('Send revised meet-and-confer email')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Task Status task-1'), { target: { value: 'DONE' } });

    await expectFetchRequest(fetchMock, 'http://localhost:4000/tasks/task-1', 'PATCH');
    expect(await screen.findByText('Task status updated to DONE.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Delete Task task-1' }));

    await expectFetchRequest(fetchMock, 'http://localhost:4000/tasks/task-1', 'DELETE');
    expect(await screen.findByText('Task removed.')).toBeInTheDocument();
    expect(screen.queryByText('Send revised meet-and-confer email')).not.toBeInTheDocument();

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

  it(
    'executes matter-level billing operations (time, expense, invoice, payment, trust)',
    { timeout: 40000 },
    async () => {
    vi.spyOn(nextNavigation, 'useParams').mockReturnValue({ id: 'matter-1' });

    const state = createDashboardState();
    state.trustLedgers.push({
      id: 'ledger-1',
      trustAccountId: 'trust-1',
      balance: 5000,
      trustAccount: { id: 'trust-1', name: 'Client Trust Main' },
    });

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method || 'GET').toUpperCase();

      if (url.endsWith('/matters/matter-1/dashboard') && method === 'GET') {
        return jsonResponse(buildDashboardFixture(state));
      }
      if (url.endsWith('/calendar/rules-packs') && method === 'GET') {
        return jsonResponse([]);
      }
      if (url.endsWith('/contacts') && method === 'GET') {
        return jsonResponse([]);
      }
      if (url.endsWith('/matters/matter-1/participant-roles') && method === 'GET') {
        return jsonResponse([]);
      }
      if (url.endsWith('/billing/time-entries') && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        const startedAt = new Date(body.startedAt);
        const endedAt = new Date(body.endedAt);
        const durationMinutes = Math.max(1, Math.round((endedAt.getTime() - startedAt.getTime()) / 60000));
        const billableRate = Number(body.billableRate || 350);
        const amount = Number(((durationMinutes / 60) * billableRate).toFixed(2));
        const row = {
          id: `time-${state.timeEntries.length + 1}`,
          startedAt: body.startedAt,
          durationMinutes,
          amount,
        };
        state.timeEntries.unshift(row);
        return jsonResponse({ ...row, billableRate });
      }
      if (url.endsWith('/billing/expenses') && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        const row = {
          id: `expense-${state.expenses.length + 1}`,
          description: body.description,
          incurredAt: body.incurredAt,
          amount: Number(body.amount),
        };
        state.expenses.unshift(row);
        return jsonResponse(row);
      }
      if (url.endsWith('/billing/invoices') && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        const line = body.lineItems?.[0] || { description: 'Matter services', quantity: 1, unitPrice: 425 };
        const total = Number((Number(line.quantity) * Number(line.unitPrice)).toFixed(2));
        const invoice = {
          id: 'invoice-1',
          invoiceNumber: 'INV-00001',
          status: 'DRAFT',
          total,
          balanceDue: total,
          payments: [] as Array<{ id: string; amount: number; method: string; reference?: string | null }>,
          lineItems: [{ id: 'line-1', description: line.description, quantity: line.quantity, unitPrice: line.unitPrice }],
        };
        state.invoices.unshift(invoice);
        return jsonResponse(invoice);
      }
      if (url.endsWith('/billing/invoices/invoice-1/checkout') && method === 'POST') {
        return jsonResponse({
          url: 'https://checkout.example.test/invoice-1',
        });
      }
      if (url.endsWith('/billing/invoices/invoice-1/payments') && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        const invoice = state.invoices.find((item) => item.id === 'invoice-1');
        if (!invoice) throw new Error('Missing invoice in test state');
        const payment = {
          id: `payment-${invoice.payments.length + 1}`,
          amount: Number(body.amount),
          method: body.method,
          reference: body.reference || null,
        };
        invoice.payments.unshift(payment);
        invoice.balanceDue = Number((invoice.balanceDue - payment.amount).toFixed(2));
        return jsonResponse(payment);
      }
      if (url.endsWith('/billing/trust/transactions') && method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        const row = {
          id: `trust-tx-${state.trustTransactions.length + 1}`,
          type: body.type,
          amount: Number(body.amount),
          occurredAt: new Date().toISOString(),
          trustAccountId: body.trustAccountId,
        };
        state.trustTransactions.unshift(row);
        const ledger = state.trustLedgers.find((item) => item.trustAccountId === body.trustAccountId);
        if (ledger) {
          ledger.balance = Number((ledger.balance + Number(body.amount)).toFixed(2));
        }
        return jsonResponse(row);
      }

      throw new Error(`Unhandled request: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<MatterDashboardPage />);

    await screen.findByText('M-100 - Doe v. Builder');

    fireEvent.change(screen.getByLabelText('Billing Time Description'), { target: { value: 'Prepare status memo' } });
    fireEvent.change(screen.getByLabelText('Billing Time Start'), { target: { value: '2026-02-20T09:00' } });
    fireEvent.change(screen.getByLabelText('Billing Time End'), { target: { value: '2026-02-20T10:30' } });
    fireEvent.change(screen.getByLabelText('Billing Time Rate'), { target: { value: '400' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Time Entry' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/billing/time-entries',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText(/Time entry created/)).toBeInTheDocument();
      expect(screen.getByText('90m')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Billing Expense Description'), { target: { value: 'Court filing fee' } });
    fireEvent.change(screen.getByLabelText('Billing Expense Amount'), { target: { value: '95' } });
    fireEvent.change(screen.getByLabelText('Billing Expense Incurred At'), { target: { value: '2026-02-20T12:00' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Expense' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/billing/expenses',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText(/Expense created/)).toBeInTheDocument();
      expect(screen.getByText('Court filing fee')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Billing Invoice Line Description'), { target: { value: 'Litigation services' } });
    fireEvent.change(screen.getByLabelText('Billing Invoice Quantity'), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText('Billing Invoice Unit Price'), { target: { value: '300' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Invoice' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/billing/invoices',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText(/Invoice INV-00001 created/)).toBeInTheDocument();
      expect(screen.getByText('INV-00001')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Invoice Payment Amount invoice-1'), { target: { value: '150' } });
    fireEvent.change(screen.getByLabelText('Invoice Payment Method invoice-1'), { target: { value: 'CHECK' } });
    fireEvent.change(screen.getByLabelText('Invoice Payment Reference invoice-1'), { target: { value: 'CHK-778' } });
    fireEvent.click(screen.getByRole('button', { name: 'Record Payment invoice-1' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/billing/invoices/invoice-1/payments',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText(/Payment recorded for invoice invoice-1/)).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: '$450.00' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Checkout Link invoice-1' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/billing/invoices/invoice-1/checkout',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText(/Checkout link issued for invoice invoice-1/)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Billing Trust Transaction Type'), { target: { value: 'DEPOSIT' } });
    fireEvent.change(screen.getByLabelText('Billing Trust Transaction Amount'), { target: { value: '500' } });
    fireEvent.change(screen.getByLabelText('Billing Trust Transaction Description'), { target: { value: 'Retainer replenish' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create Trust Transaction' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/billing/trust/transactions',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText(/Trust transaction DEPOSIT posted/)).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: '$5500.00' })).toBeInTheDocument();
    });
    },
  );

  it('exports matter calendar events as an ICS file', async () => {
    vi.spyOn(nextNavigation, 'useParams').mockReturnValue({ id: 'matter-1' });

    const state = createDashboardState();
    const createObjectUrl = vi.fn(() => 'blob:calendar-ics');
    const revokeObjectUrl = vi.fn();
    const anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    const originalCreateObjectUrl = URL.createObjectURL;
    const originalRevokeObjectUrl = URL.revokeObjectURL;
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, writable: true, value: createObjectUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, writable: true, value: revokeObjectUrl });

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method || 'GET').toUpperCase();

      if (url.endsWith('/matters/matter-1/dashboard') && method === 'GET') {
        return jsonResponse(buildDashboardFixture(state));
      }
      if (url.endsWith('/calendar/rules-packs') && method === 'GET') {
        return jsonResponse([]);
      }
      if (url.endsWith('/contacts') && method === 'GET') {
        return jsonResponse([]);
      }
      if (url.endsWith('/matters/matter-1/participant-roles') && method === 'GET') {
        return jsonResponse([]);
      }
      if (url.endsWith('/calendar/events/matter-1/ics') && method === 'GET') {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Headers({
            'content-disposition': 'attachment; filename=\"matter-1.ics\"',
          }),
          blob: async () => new Blob(['BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n'], { type: 'text/calendar' }),
          text: async () => '',
          json: async () => ({}),
        } as Response;
      }

      throw new Error(`Unhandled request: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    try {
      render(<MatterDashboardPage />);

      await screen.findByText('M-100 - Doe v. Builder');
      fireEvent.click(screen.getByRole('button', { name: 'Export ICS' }));

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          'http://localhost:4000/calendar/events/matter-1/ics',
          expect.objectContaining({
            method: 'GET',
            credentials: 'include',
          }),
        );
        expect(createObjectUrl).toHaveBeenCalled();
        expect(anchorClick).toHaveBeenCalled();
        expect(revokeObjectUrl).toHaveBeenCalledWith('blob:calendar-ics');
        expect(screen.getByText('Calendar ICS exported: matter-1.ics.')).toBeInTheDocument();
      });
    } finally {
      Object.defineProperty(URL, 'createObjectURL', {
        configurable: true,
        writable: true,
        value: originalCreateObjectUrl,
      });
      Object.defineProperty(URL, 'revokeObjectURL', {
        configurable: true,
        writable: true,
        value: originalRevokeObjectUrl,
      });
    }
  });

  it('edits and saves matter overview fields', { timeout: 40000 }, async () => {
    vi.spyOn(nextNavigation, 'useParams').mockReturnValue({ id: 'matter-1' });

    const state = createDashboardState();
    const overview = {
      matterNumber: 'M-100',
      name: 'Doe v. Builder',
      practiceArea: 'Construction Litigation',
      status: 'OPEN',
      venue: 'Superior',
      jurisdiction: 'CA',
      openedAt: '2026-01-02T16:00:00.000Z',
      closedAt: null as string | null,
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method || 'GET').toUpperCase();

      if (url.endsWith('/matters/matter-1/dashboard') && method === 'GET') {
        return jsonResponse(buildDashboardFixture(state, overview));
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
      if (url.endsWith('/matters/matter-1') && method === 'PATCH') {
        const body = JSON.parse(String(init?.body || '{}'));
        overview.name = body.name;
        overview.matterNumber = body.matterNumber;
        overview.practiceArea = body.practiceArea;
        overview.status = body.status;
        overview.venue = body.venue;
        overview.jurisdiction = body.jurisdiction;
        overview.openedAt = body.openedAt;
        overview.closedAt = body.closedAt;
        return jsonResponse(buildDashboardFixture(state, overview));
      }

      throw new Error(`Unhandled request: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<MatterDashboardPage />);

    await screen.findByText('M-100 - Doe v. Builder');
    fireEvent.click(screen.getByRole('button', { name: 'Edit Overview' }));

    fireEvent.change(screen.getByLabelText('Matter Name'), { target: { value: 'Updated Builder Dispute' } });
    fireEvent.change(screen.getByLabelText('Matter Number'), { target: { value: 'M-101' } });
    fireEvent.change(screen.getByLabelText('Practice Area'), { target: { value: 'General Civil Litigation' } });
    fireEvent.change(screen.getByLabelText('Matter Status'), { target: { value: 'PENDING' } });
    fireEvent.change(screen.getByLabelText('Matter Venue'), { target: { value: 'Downtown Court' } });
    fireEvent.change(screen.getByLabelText('Matter Jurisdiction'), { target: { value: 'NV' } });
    fireEvent.change(screen.getByLabelText('Matter Opened At'), { target: { value: '2026-02-03T11:45' } });
    fireEvent.change(screen.getByLabelText('Matter Closed At'), { target: { value: '2026-03-03T15:30' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Overview' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/matters/matter-1',
        expect.objectContaining({ method: 'PATCH', credentials: 'include' }),
      );
      expect(screen.getByText('Matter overview updated.')).toBeInTheDocument();
      expect(screen.getByText('M-101 - Updated Builder Dispute')).toBeInTheDocument();
      expect(screen.getByText('Practice Area: General Civil Litigation')).toBeInTheDocument();
      expect(screen.getByText('Status: PENDING')).toBeInTheDocument();
      expect(screen.getByText('Venue: Downtown Court')).toBeInTheDocument();
      expect(screen.getByText('Jurisdiction: NV')).toBeInTheDocument();
    });
  });

  it('adds, edits, and removes participants in matter context', async () => {
    vi.spyOn(nextNavigation, 'useParams').mockReturnValue({ id: 'matter-1' });

    const state = createDashboardState();
    const contacts = [
      { id: 'contact-1', displayName: 'Jordan Homeowner', kind: 'PERSON' },
      { id: 'contact-2', displayName: 'Taylor Expert', kind: 'PERSON' },
      { id: 'contact-3', displayName: 'Opposing Counsel', kind: 'PERSON' },
      { id: 'contact-4', displayName: 'Builder Defense LLP', kind: 'ORGANIZATION' },
    ];
    const roles = [
      { id: 'role-1', key: 'expert', label: 'Expert Witness', sideDefault: 'NEUTRAL' as const },
      { id: 'role-2', key: 'opposing_counsel', label: 'Opposing Counsel', sideDefault: 'OPPOSING_SIDE' as const },
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
        const representedBy = contacts.find((item) => item.id === body.representedByContactId);
        const lawFirm = contacts.find((item) => item.id === body.lawFirmContactId);
        const participant = {
          id: `participant-${state.participants.length + 1}`,
          contactId: body.contactId,
          participantRoleKey: body.participantRoleKey,
          side: body.side || role?.sideDefault || 'NEUTRAL',
          isPrimary: Boolean(body.isPrimary),
          representedByContactId: body.representedByContactId || null,
          lawFirmContactId: body.lawFirmContactId || null,
          notes: body.notes || null,
          contact: contact ? { id: contact.id, displayName: contact.displayName } : { id: body.contactId, displayName: body.contactId },
          participantRoleDefinition: role ? { id: role.id, key: role.key, label: role.label } : null,
          representedByContact: representedBy
            ? { id: representedBy.id, displayName: representedBy.displayName }
            : null,
          lawFirmContact: lawFirm ? { id: lawFirm.id, displayName: lawFirm.displayName } : null,
        };
        state.participants.push(participant);
        return jsonResponse(participant);
      }
      if (url.endsWith('/matters/matter-1/participants/participant-1') && method === 'PATCH') {
        const body = JSON.parse(String(init?.body || '{}'));
        const contact = contacts.find((item) => item.id === body.contactId);
        const role = roles.find((item) => item.key === body.participantRoleKey);
        const representedBy = contacts.find((item) => item.id === body.representedByContactId);
        const lawFirm = contacts.find((item) => item.id === body.lawFirmContactId);
        state.participants = state.participants.map((participant) =>
          participant.id === 'participant-1'
            ? {
                ...participant,
                contactId: body.contactId || participant.contactId,
                participantRoleKey: body.participantRoleKey || participant.participantRoleKey,
                side: body.side || participant.side,
                isPrimary: body.isPrimary ?? participant.isPrimary,
                representedByContactId: body.representedByContactId || null,
                lawFirmContactId: body.lawFirmContactId || null,
                notes: body.notes || null,
                contact: contact
                  ? { id: contact.id, displayName: contact.displayName }
                  : participant.contact,
                participantRoleDefinition: role
                  ? { id: role.id, key: role.key, label: role.label }
                  : participant.participantRoleDefinition,
                representedByContact: representedBy
                  ? { id: representedBy.id, displayName: representedBy.displayName }
                  : null,
                lawFirmContact: lawFirm
                  ? { id: lawFirm.id, displayName: lawFirm.displayName }
                  : null,
              }
            : participant,
        );
        return jsonResponse(state.participants[0]);
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
    fireEvent.change(screen.getByLabelText('Participant Side'), { target: { value: 'NEUTRAL' } });
    fireEvent.click(screen.getByLabelText('Participant Is Primary'));
    fireEvent.change(screen.getByLabelText('Participant Represented By Contact'), { target: { value: 'contact-1' } });
    fireEvent.change(screen.getByLabelText('Participant Notes'), { target: { value: 'Initial expert disclosure' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Participant' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/matters/matter-1/participants',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText('Participant added.')).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Taylor Expert' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Expert Witness' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'YES' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Jordan Homeowner' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Initial expert disclosure' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Edit Participant participant-1' }));
    fireEvent.change(screen.getByLabelText('Participant Role'), { target: { value: 'opposing_counsel' } });
    fireEvent.change(screen.getByLabelText('Participant Law Firm Contact'), { target: { value: 'contact-4' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Participant Edit' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/matters/matter-1/participants/participant-1',
        expect.objectContaining({ method: 'PATCH', credentials: 'include' }),
      );
      expect(screen.getByText('Participant updated.')).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Opposing Counsel' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Builder Defense LLP' })).toBeInTheDocument();
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

  it('manages document lifecycle actions in matter dashboard context', async () => {
    vi.spyOn(nextNavigation, 'useParams').mockReturnValue({ id: 'matter-1' });

    const state = createDashboardState();
    state.documents.push({
      id: 'doc-1',
      title: 'Inspection Report',
      sharedWithClient: false,
      versions: [{ id: 'version-1' }],
    });

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
      if (url.endsWith('/documents/upload') && method === 'POST') {
        const formData = init?.body as FormData;
        const title = String(formData.get('title') || 'Matter Document');
        state.documents.unshift({
          id: `doc-${state.documents.length + 1}`,
          title,
          sharedWithClient: false,
          versions: [{ id: `version-${state.documents.length + 1}` }],
        });
        return jsonResponse({ document: { id: state.documents[0].id } });
      }
      if (url.endsWith('/documents/doc-1/versions') && method === 'POST') {
        const document = state.documents.find((doc) => doc.id === 'doc-1');
        if (document) {
          document.versions.unshift({ id: 'version-2' });
        }
        return jsonResponse({ id: 'version-2' });
      }
      if (url.endsWith('/documents/doc-1') && method === 'PATCH') {
        const payload = JSON.parse(String(init?.body || '{}'));
        const document = state.documents.find((doc) => doc.id === 'doc-1');
        if (document && typeof payload.sharedWithClient === 'boolean') {
          document.sharedWithClient = payload.sharedWithClient;
        }
        return jsonResponse({ id: 'doc-1', sharedWithClient: payload.sharedWithClient });
      }
      if (url.endsWith('/documents/doc-1/share-link') && method === 'POST') {
        return jsonResponse({
          url: 'http://localhost:3000/shared-doc/share-token-1',
          expiresAt: '2026-03-09T12:00:00.000Z',
        });
      }
      if (url.endsWith('/documents/versions/version-2/download-url') && method === 'GET') {
        return jsonResponse({
          url: 'http://localhost:9000/download/version-2',
        });
      }

      throw new Error(`Unhandled request: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<MatterDashboardPage />);

    await screen.findByText('M-100 - Doe v. Builder');
    await screen.findByRole('cell', { name: 'Inspection Report' });

    fireEvent.change(screen.getByLabelText('Matter Document Title'), { target: { value: 'Uploaded Scope Photo' } });
    fireEvent.change(screen.getByLabelText('Matter Document File'), {
      target: { files: [new File(['scope photo'], 'scope-photo.txt', { type: 'text/plain' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Upload Document' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/documents/upload',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText('Document uploaded.')).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Uploaded Scope Photo' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Document Version File doc-1'), {
      target: { files: [new File(['v2'], 'inspection-v2.txt', { type: 'text/plain' })] },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Upload Document Version doc-1' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/documents/doc-1/versions',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText('Document version uploaded.')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Toggle Document Sharing doc-1' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/documents/doc-1',
        expect.objectContaining({ method: 'PATCH', credentials: 'include' }),
      );
      expect(screen.getByText('Client sharing enabled.')).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Yes' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Document Share Link doc-1' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/documents/doc-1/share-link',
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      );
      expect(screen.getByText(/Share link issued/)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Issue Document Download URL doc-1' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/documents/versions/version-2/download-url',
        expect.objectContaining({ credentials: 'include' }),
      );
      expect(screen.getByText(/Signed download URL issued/)).toBeInTheDocument();
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

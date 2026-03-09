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
  let consoleErrorMock: ReturnType<typeof vi.spyOn> | undefined;

  beforeEach(() => {
    consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => {});
    window.localStorage.setItem('session_token', 'test-session-token');
  });

  afterEach(() => {
    expect(consoleErrorMock).toBeDefined();
    expect(consoleErrorMock).not.toHaveBeenCalled();
    consoleErrorMock?.mockRestore();
    window.localStorage.removeItem('session_token');
    vi.restoreAllMocks();
  });

  it('renders intake queue rows from leads API', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([
        {
          id: 'lead-1',
          name: 'John Smith',
          source: 'Portal Intake',
          stage: 'NEW',
          type: 'CD',
          attorneyName: 'KL',
          isPortalOrigin: true,
          createdAt: '2026-02-20T01:00:00.000Z',
          updatedAt: '2026-02-20T01:00:00.000Z',
        },
      ]),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<IntakeQueuePage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/leads?page=1&pageSize=25',
        expect.objectContaining({ credentials: 'include' }),
      );
    });

    expect(await screen.findByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Portal Intake')).toBeInTheDocument();
    expect(screen.getByText('KL')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open' })).toHaveAttribute('href', '/intake/lead-1/intake');
    expect(screen.getByText(/Showing 1-1 of 1/i)).toBeInTheDocument();
  });

  it('filters queue rows by stage tab and search input', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([
        {
          id: 'lead-1',
          name: 'John Smith',
          source: 'Website Form',
          stage: 'NEW',
          type: 'CD',
          attorneyName: 'KL',
          isPortalOrigin: false,
          createdAt: '2026-02-20T01:00:00.000Z',
          updatedAt: '2026-02-20T01:00:00.000Z',
        },
        {
          id: 'lead-2',
          name: 'Builder Supply',
          source: 'Portal Intake',
          stage: 'CONFLICT_HOLD',
          type: 'CL',
          attorneyName: 'MR',
          isPortalOrigin: true,
          createdAt: '2026-02-20T01:00:00.000Z',
          updatedAt: '2026-02-20T01:00:00.000Z',
        },
      ]),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<IntakeQueuePage />);

    expect(await screen.findByText('John Smith')).toBeInTheDocument();
    expect(screen.getByText('Builder Supply')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('tab', { name: /Conflict Hold/i }));

    await waitFor(() => {
      expect(screen.queryByText('John Smith')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Builder Supply')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Search leads/i), { target: { value: 'absent record' } });

    await waitFor(() => {
      expect(screen.getByText('No leads match the current filter.')).toBeInTheDocument();
    });
  });

  it('supports keyboard roving tab order for stage filters', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      jsonResponse([
        {
          id: 'lead-1',
          name: 'John Smith',
          source: 'Website Form',
          stage: 'NEW',
          type: 'CD',
          attorneyName: 'KL',
          isPortalOrigin: false,
          createdAt: '2026-02-20T01:00:00.000Z',
          updatedAt: '2026-02-20T01:00:00.000Z',
        },
        {
          id: 'lead-2',
          name: 'Builder Supply',
          source: 'Portal Intake',
          stage: 'CONFLICT_HOLD',
          type: 'CL',
          attorneyName: 'MR',
          isPortalOrigin: true,
          createdAt: '2026-02-20T01:00:00.000Z',
          updatedAt: '2026-02-20T01:00:00.000Z',
        },
      ]),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<IntakeQueuePage />);

    const allTab = await screen.findByRole('tab', { name: /All/i });
    const newTab = screen.getByRole('tab', { name: /New/i });
    const readyTab = screen.getByRole('tab', { name: /Ready/i });

    expect(allTab).toHaveAttribute('tabindex', '0');
    expect(newTab).toHaveAttribute('tabindex', '-1');
    expect(readyTab).toHaveAttribute('tabindex', '-1');

    allTab.focus();
    fireEvent.keyDown(allTab, { key: 'ArrowRight' });

    await waitFor(() => {
      expect(newTab).toHaveAttribute('aria-selected', 'true');
    });
    expect(newTab).toHaveFocus();
    expect(newTab).toHaveAttribute('tabindex', '0');
    expect(allTab).toHaveAttribute('tabindex', '-1');

    await waitFor(() => {
      expect(screen.queryByText('Builder Supply')).not.toBeInTheDocument();
    });

    fireEvent.keyDown(newTab, { key: 'End' });
    await waitFor(() => {
      expect(readyTab).toHaveAttribute('aria-selected', 'true');
    });
    expect(readyTab).toHaveFocus();
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

  it('validates the intake wizard and saves draft between steps', async () => {
    vi.spyOn(nextNavigation, 'useParams').mockReturnValue({ leadId: 'lead-7' });
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.startsWith('http://localhost:4000/leads/lead-7/intake-drafts')) {
        return jsonResponse({ id: 'draft-1' });
      }

      if (url.startsWith('http://localhost:4000/contacts?search=')) {
        return jsonResponse([]);
      }

      return jsonResponse({ error: `Unexpected ${url}` }, 500);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<LeadIntakeDraftPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('First name is required.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Smith' } });
    fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: 'john@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/leads/lead-7/intake-drafts',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    expect(await screen.findByRole('heading', { name: 'PROPERTY' })).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Address Line 1/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(await screen.findByText('Property address is required.')).toBeInTheDocument();
  });

  it('surfaces duplicate contact matches during client intake', async () => {
    vi.spyOn(nextNavigation, 'useParams').mockReturnValue({ leadId: 'lead-7' });
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url.startsWith('http://localhost:4000/contacts?search=')) {
        return jsonResponse([
          {
            id: 'contact-1',
            firstName: 'John',
            lastName: 'Smith',
            email: 'john@example.com',
            type: 'INDIVIDUAL',
            createdAt: '2026-02-20T01:00:00.000Z',
            updatedAt: '2026-02-20T01:00:00.000Z',
          },
        ]);
      }

      if (url.startsWith('http://localhost:4000/leads/lead-7/intake-drafts')) {
        return jsonResponse({ id: 'draft-1' });
      }

      return jsonResponse({ error: `Unexpected ${url}` }, 500);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<LeadIntakeDraftPage />);

    fireEvent.change(screen.getByLabelText(/First Name/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/Last Name/i), { target: { value: 'Smith' } });
    fireEvent.change(screen.getByLabelText(/^Email/i), { target: { value: 'john@example.com' } });
    fireEvent.blur(screen.getByLabelText(/^Email/i));

    expect(await screen.findByText('Potential duplicate contacts detected.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Link to Existing' })).toBeInTheDocument();
  });

  it('runs and resolves conflict on staged conflict route', async () => {
    vi.spyOn(nextNavigation, 'useParams').mockReturnValue({ leadId: 'lead-5' });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ id: 'cc-1' }))
      .mockResolvedValueOnce(jsonResponse({ id: 'cc-1' }));
    vi.stubGlobal('fetch', fetchMock);

    render(<LeadConflictPage />);

    expect(screen.getByRole('button', { name: 'Proceed to Engagement' })).toBeDisabled();

    fireEvent.click(screen.getByRole('button', { name: 'Run Conflict Check' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        1,
        'http://localhost:4000/leads/lead-5/conflict-check',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    expect(await screen.findByText('Contact')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Resolution row 1'), { target: { value: 'CLEAR' } });
    fireEvent.change(screen.getByLabelText('Resolution row 2'), { target: { value: 'POTENTIAL' } });
    fireEvent.change(screen.getByLabelText('Notes row 2'), {
      target: { value: 'Prior matter cleared after reviewer check.' },
    });
    fireEvent.change(screen.getByLabelText('Resolution row 3'), { target: { value: 'CLEAR' } });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Proceed to Engagement' })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Proceed to Engagement' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'http://localhost:4000/leads/lead-5/conflict-resolution',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    expect(await screen.findByRole('link', { name: 'Proceed to Engagement' })).toHaveAttribute(
      'href',
      '/intake/lead-5/engagement',
    );
  });

  it('blocks conflict check when query text is blank', async () => {
    vi.spyOn(nextNavigation, 'useParams').mockReturnValue({ leadId: 'lead-5' });
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    render(<LeadConflictPage />);

    fireEvent.change(screen.getByLabelText(/Conflict Query/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Run Conflict Check' }));

    expect(await screen.findByText('This field is required.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('generates then sends engagement routing payloads', async () => {
    vi.spyOn(nextNavigation, 'useParams').mockReturnValue({ leadId: 'lead-11' });
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url === 'http://localhost:4000/leads/lead-11/engagement/latest') {
        return jsonResponse(null);
      }

      if (url === 'http://localhost:4000/leads/lead-11/engagement/generate') {
        return jsonResponse({
          id: 'env-9',
          status: 'DRAFT',
          provider: 'INTERNAL',
          createdAt: '2026-03-06T15:10:00.000Z',
          updatedAt: '2026-03-06T15:10:00.000Z',
          payloadJson: JSON.parse(String(init?.body ?? '{}')).payloadJson,
        });
      }

      if (url === 'http://localhost:4000/leads/lead-11/engagement/send') {
        return jsonResponse({
          id: 'env-9',
          status: 'SENT',
          provider: 'INTERNAL',
          createdAt: '2026-03-06T15:10:00.000Z',
          updatedAt: '2026-03-06T15:12:00.000Z',
          payloadJson: {},
        });
      }

      return jsonResponse({ error: `Unexpected ${url}` }, 500);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<LeadEngagementPage />);

    await screen.findByText('No envelope generated yet. Generate an engagement packet to begin the e-sign lifecycle.');

    fireEvent.change(screen.getByLabelText(/Recipient Name/i), { target: { value: 'John Smith' } });
    fireEvent.change(screen.getByLabelText(/Recipient Email/i), { target: { value: 'john@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate Engagement Letter' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        2,
        'http://localhost:4000/leads/lead-11/engagement/generate',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    expect(await screen.findByText('Engagement envelope env-9 generated in DRAFT status.')).toBeInTheDocument();
    expect(screen.getByText('env-9')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Send Envelope' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenNthCalledWith(
        3,
        'http://localhost:4000/leads/lead-11/engagement/send',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    expect(await screen.findByText(/Current status: SENT/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Proceed to Convert' })).toBeDisabled();
  });

  it('blocks conversion when required matter fields are blank', async () => {
    vi.spyOn(nextNavigation, 'useParams').mockReturnValue({ leadId: 'lead-19' });
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url === 'http://localhost:4000/leads/lead-19/setup-checklist') {
        return jsonResponse({
          leadId: 'lead-19',
          intakeDraftCreated: true,
          conflictChecked: true,
          conflictResolved: true,
          engagementGenerated: true,
          engagementSent: true,
          engagementSigned: true,
          convertible: true,
          intakeDraft: true,
          readyToConvert: true,
          conversionPreview: {
            clientName: 'John Smith',
            clientEmail: 'john@example.com',
            propertyAddress: '123 Main St, Springfield, IL 62701',
            suggestedMatterName: 'John Smith - 123 Main St',
            suggestedMatterNumber: 'M-2026-LEAD19',
            defaultParticipants: [
              {
                name: 'John Smith',
                roleKey: 'client',
                side: 'CLIENT_SIDE',
                isPrimary: true,
              },
            ],
          },
        });
      }

      if (url === 'http://localhost:4000/admin/users') {
        return jsonResponse([]);
      }

      if (url === 'http://localhost:4000/admin/participant-roles') {
        return jsonResponse([{ id: 'role-client', key: 'client', label: 'Client', sideDefault: 'CLIENT_SIDE' }]);
      }

      return jsonResponse({ error: `Unexpected ${url}` }, 500);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<LeadConvertPage />);

    await screen.findByDisplayValue('John Smith - 123 Main St');

    fireEvent.change(screen.getByLabelText(/Matter Name/i), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Convert Lead to Matter' }));

    expect(await screen.findByText('This field is required.')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalledWith(
      'http://localhost:4000/leads/lead-19/convert',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('submits participants and ethical wall selections during conversion', async () => {
    vi.spyOn(nextNavigation, 'useParams').mockReturnValue({ leadId: 'lead-21' });
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);

      if (url === 'http://localhost:4000/leads/lead-21/setup-checklist') {
        return jsonResponse({
          leadId: 'lead-21',
          intakeDraftCreated: true,
          conflictChecked: true,
          conflictResolved: true,
          engagementGenerated: true,
          engagementSent: true,
          engagementSigned: true,
          convertible: true,
          intakeDraft: true,
          readyToConvert: true,
          conversionPreview: {
            clientName: 'Taylor Smith',
            clientEmail: 'taylor@example.com',
            propertyAddress: '456 Cedar Ave, South Bend, IN 46601',
            suggestedMatterName: 'Taylor Smith - 456 Cedar Ave',
            suggestedMatterNumber: 'M-2026-LEAD21',
            defaultParticipants: [
              {
                name: 'Taylor Smith',
                roleKey: 'client',
                side: 'CLIENT_SIDE',
                isPrimary: true,
              },
            ],
          },
        });
      }

      if (url === 'http://localhost:4000/admin/users') {
        return jsonResponse([
          {
            id: 'membership-2',
            user: {
              id: 'user-2',
              email: 'billing@lic-demo.local',
              fullName: 'Billing User',
            },
            role: { name: 'Billing' },
          },
        ]);
      }

      if (url === 'http://localhost:4000/admin/participant-roles') {
        return jsonResponse([
          { id: 'role-client', key: 'client', label: 'Client', sideDefault: 'CLIENT_SIDE' },
          { id: 'role-counsel', key: 'opposing_counsel', label: 'Opposing Counsel', sideDefault: 'OPPOSING_SIDE' },
        ]);
      }

      if (url === 'http://localhost:4000/leads/lead-21/convert') {
        return jsonResponse({
          leadId: 'lead-21',
          matter: {
            id: 'matter-21',
            name: 'Taylor Smith - 456 Cedar Ave',
            matterNumber: 'M-2026-LEAD21',
          },
        });
      }

      return jsonResponse({ error: `Unexpected ${url}` }, 500);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<LeadConvertPage />);

    await screen.findByDisplayValue('Taylor Smith - 456 Cedar Ave');

    fireEvent.click(screen.getByLabelText(/Enable ethical wall review on matter creation/i));
    fireEvent.change(screen.getByLabelText(/Wall Notes/i), {
      target: { value: 'Limit access to review attorney and converting operator.' },
    });
    fireEvent.click(screen.getByLabelText(/Billing User · Billing/i));
    fireEvent.click(screen.getByRole('button', { name: 'Convert Lead to Matter' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/leads/lead-21/convert',
        expect.objectContaining({ method: 'POST' }),
      );
    });

    const convertCall = fetchMock.mock.calls.find(([url]) => String(url) === 'http://localhost:4000/leads/lead-21/convert');
    expect(convertCall).toBeTruthy();
    expect(JSON.parse(String(convertCall?.[1]?.body))).toMatchObject({
      ethicalWallEnabled: true,
      ethicalWallNotes: 'Limit access to review attorney and converting operator.',
      deniedUserIds: ['user-2'],
      participants: [
        expect.objectContaining({
          name: 'Taylor Smith',
          roleKey: 'client',
          side: 'CLIENT_SIDE',
          isPrimary: true,
        }),
      ],
    });

    expect(await screen.findByRole('link', { name: 'Open Matter Dashboard' })).toHaveAttribute(
      'href',
      '/matters/matter-21',
    );
  });
});

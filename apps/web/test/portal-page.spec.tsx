import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import PortalPage from '../app/portal/page';

function jsonResponse<T>(payload: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response;
}

describe('PortalPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('sends a portal message and refreshes snapshot counts', async () => {
    const state = {
      snapshot: {
        matters: [{ id: 'matter-1', matterNumber: 'M-001', name: 'Portal Matter' }],
        keyDates: [{ id: 'd1' }],
        invoices: [{ id: 'i1' }],
        messages: [],
        documents: [{ id: 'doc1' }, { id: 'doc2' }],
        eSignEnvelopes: [],
      } as any,
      intakeForms: [{ id: 'intake-def-1', name: 'Client Intake v1' }],
      templates: [{ id: 'letter-template-5', name: 'Engagement Letter v5' }],
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method || 'GET').toUpperCase();
      if (url.endsWith('/portal/snapshot') && method === 'GET') return jsonResponse(state.snapshot);
      if (url.endsWith('/portal/intake-form-definitions') && method === 'GET') return jsonResponse(state.intakeForms);
      if (url.endsWith('/portal/engagement-letter-templates') && method === 'GET') return jsonResponse(state.templates);
      if (url.endsWith('/portal/messages') && method === 'POST') {
        state.snapshot = {
          ...state.snapshot,
          matters: [...state.snapshot.matters, { id: 'matter-2', matterNumber: 'M-002', name: 'Second Matter' }],
          documents: [...state.snapshot.documents, { id: 'doc3' }],
        };
        return jsonResponse({ id: 'msg-1' });
      }
      return jsonResponse({ error: `Unexpected ${method} ${url}` }, 500);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<PortalPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/portal/snapshot',
        expect.objectContaining({
          credentials: 'include',
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
        }),
      );
    });

    await screen.findByText('1 visible matters');
    await screen.findByText('2 shared docs');
    await screen.findByRole('option', { name: 'M-001 - Portal Matter' });
    await waitFor(() => {
      expect((screen.getByLabelText('Portal Matter') as HTMLSelectElement).value).toBe('matter-1');
    });

    const messageMatterSelect = screen.getByLabelText('Portal Matter') as HTMLSelectElement;
    fireEvent.change(messageMatterSelect, { target: { value: 'matter-1' } });
    await waitFor(() => {
      expect(messageMatterSelect.value).toBe('matter-1');
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    const confirmDialog = await screen.findByRole('dialog', { name: 'Confirm Client Message Send' });
    expect(
      within(confirmDialog).getByText(
        'Approving this action sends the portal message to the client for matter review. Verify content and attachments before proceeding.',
      ),
    ).toBeInTheDocument();
    fireEvent.click(within(confirmDialog).getByRole('button', { name: 'Approve Send' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/portal/messages',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        }),
      );
    });

    const sendCall = fetchMock.mock.calls.find(([url]) => String(url) === 'http://localhost:4000/portal/messages');
    expect(sendCall).toBeDefined();
    expect(JSON.parse((sendCall?.[1]?.body as string) || '{}')).toEqual({
      matterId: 'matter-1',
      body: 'Can you share the latest mediation timeline?',
    });

    await waitFor(() => {
      expect(screen.getByText('2 visible matters')).toBeInTheDocument();
      expect(screen.getByText('3 shared docs')).toBeInTheDocument();
    });
  });

  it('submits intake and creates e-sign envelope from portal actions', async () => {
    const state = {
      snapshot: {
        matters: [{ id: 'matter-22', matterNumber: 'M-022', name: 'Client Matter 22' }],
        keyDates: [],
        invoices: [],
        messages: [],
        documents: [],
        eSignEnvelopes: [],
      } as any,
      intakeForms: [{ id: 'intake-def-1', name: 'Client Intake v1' }],
      templates: [{ id: 'letter-template-5', name: 'Engagement Letter v5' }],
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method || 'GET').toUpperCase();
      if (url.endsWith('/portal/snapshot') && method === 'GET') return jsonResponse(state.snapshot);
      if (url.endsWith('/portal/intake-form-definitions') && method === 'GET') return jsonResponse(state.intakeForms);
      if (url.endsWith('/portal/engagement-letter-templates') && method === 'GET') return jsonResponse(state.templates);
      if (url.endsWith('/portal/intake-submissions') && method === 'POST') return jsonResponse({ id: 'intake-1' });
      if (url.endsWith('/portal/esign') && method === 'POST') {
        state.snapshot = {
          ...state.snapshot,
          eSignEnvelopes: [{ id: 'esign-1', status: 'SENT', provider: 'stub' }],
        };
        return jsonResponse({ id: 'esign-1' });
      }
      return jsonResponse({ error: `Unexpected ${method} ${url}` }, 500);
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<PortalPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/portal/snapshot',
        expect.objectContaining({
          credentials: 'include',
        }),
      );
    });
    await screen.findByRole('option', { name: 'M-022 - Client Matter 22' });

    const intakeMatterSelect = screen.getByLabelText('Portal Matter') as HTMLSelectElement;
    fireEvent.change(intakeMatterSelect, { target: { value: 'matter-22' } });
    await waitFor(() => {
      expect(intakeMatterSelect.value).toBe('matter-22');
    });
    fireEvent.change(screen.getByLabelText('Portal Intake Form'), { target: { value: 'intake-def-1' } });
    fireEvent.change(screen.getByLabelText('Portal Engagement Template'), {
      target: { value: 'letter-template-5' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Submit Intake' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create E-Sign Envelope' }));
    const confirmDialog = await screen.findByRole('dialog', { name: 'Confirm E-Sign Envelope Dispatch' });
    expect(
      within(confirmDialog).getByText(
        'Approving this action dispatches an external envelope workflow to the selected provider and cannot be silently undone.',
      ),
    ).toBeInTheDocument();
    fireEvent.click(within(confirmDialog).getByRole('button', { name: 'Approve Send' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/portal/intake-submissions',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        }),
      );
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/portal/esign',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        }),
      );
    });

    const intakeCall = fetchMock.mock.calls.find(([url]) => String(url) === 'http://localhost:4000/portal/intake-submissions');
    expect(intakeCall).toBeDefined();
    expect(JSON.parse((intakeCall?.[1]?.body as string) || '{}')).toEqual(
      expect.objectContaining({
        intakeFormDefinitionId: 'intake-def-1',
      }),
    );

    const esignCall = fetchMock.mock.calls.find(([url]) => String(url) === 'http://localhost:4000/portal/esign');
    expect(esignCall).toBeDefined();
    expect(JSON.parse((esignCall?.[1]?.body as string) || '{}')).toEqual({
      engagementLetterTemplateId: 'letter-template-5',
      matterId: 'matter-22',
      provider: 'stub',
    });
  });

  it('refreshes an e-sign envelope status from the portal list', async () => {
    const state = {
      snapshot: {
        matters: [{ id: 'matter-9', matterNumber: 'M-009', name: 'Matter 9' }],
        keyDates: [],
        invoices: [],
        messages: [],
        documents: [],
        eSignEnvelopes: [
          {
            id: 'env-9',
            status: 'SENT',
            provider: 'sandbox',
            engagementLetterTemplate: { id: 'tpl-9', name: 'Engagement Letter v9' },
          },
        ],
      } as any,
      intakeForms: [],
      templates: [],
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method || 'GET').toUpperCase();
      if (url.endsWith('/portal/snapshot') && method === 'GET') return jsonResponse(state.snapshot);
      if (url.endsWith('/portal/intake-form-definitions') && method === 'GET') return jsonResponse(state.intakeForms);
      if (url.endsWith('/portal/engagement-letter-templates') && method === 'GET') return jsonResponse(state.templates);
      if (url.endsWith('/portal/esign/env-9/refresh') && method === 'POST') {
        state.snapshot = {
          ...state.snapshot,
          eSignEnvelopes: [
            {
              id: 'env-9',
              status: 'SIGNED',
              provider: 'sandbox',
              engagementLetterTemplate: { id: 'tpl-9', name: 'Engagement Letter v9' },
            },
          ],
        };
        return jsonResponse({ id: 'env-9', status: 'SIGNED', provider: 'sandbox' });
      }
      return jsonResponse({ error: `Unexpected ${method} ${url}` }, 500);
    });

    vi.stubGlobal('fetch', fetchMock);
    render(<PortalPage />);

    await screen.findByText('Status: SENT | Provider: sandbox');
    fireEvent.click(screen.getByRole('button', { name: 'Refresh Status' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/portal/esign/env-9/refresh',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        }),
      );
    });

    await screen.findByText('Status: SIGNED | Provider: sandbox');
  });

  it('uploads a portal attachment, links it to message, and downloads securely', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const state = {
      snapshot: {
        matters: [{ id: 'matter-1', matterNumber: 'M-001', name: 'Portal Matter' }],
        keyDates: [],
        invoices: [],
        messages: [],
        documents: [],
        eSignEnvelopes: [],
      } as any,
      intakeForms: [],
      templates: [],
    };

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = (init?.method || 'GET').toUpperCase();
      if (url.endsWith('/portal/snapshot') && method === 'GET') return jsonResponse(state.snapshot);
      if (url.endsWith('/portal/intake-form-definitions') && method === 'GET') return jsonResponse(state.intakeForms);
      if (url.endsWith('/portal/engagement-letter-templates') && method === 'GET') return jsonResponse(state.templates);
      if (url.endsWith('/portal/attachments/upload') && method === 'POST') {
        return jsonResponse({
          document: { id: 'doc-uploaded' },
          version: { id: 'ver-up' },
        });
      }
      if (url.endsWith('/portal/messages') && method === 'POST') {
        state.snapshot = {
          ...state.snapshot,
          documents: [
            {
              id: 'doc-uploaded',
              matterId: 'matter-1',
              title: 'Uploaded Portal Photo',
              latestVersion: { id: 'ver-up' },
            },
          ],
          messages: [
            {
              id: 'msg-uploaded',
              body: 'See attached defect photo',
              attachments: [
                {
                  documentVersionId: 'ver-up',
                  title: 'Uploaded Portal Photo',
                },
              ],
            },
          ],
        };
        return jsonResponse({ id: 'msg-uploaded' });
      }
      if (url.endsWith('/portal/attachments/ver-up/download-url') && method === 'GET') {
        return jsonResponse({ url: 'https://download.local/ver-up' });
      }
      return jsonResponse({ error: `Unexpected ${method} ${url}` }, 500);
    });

    vi.stubGlobal('fetch', fetchMock);

    render(<PortalPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/portal/snapshot',
        expect.objectContaining({ credentials: 'include' }),
      );
    });

    fireEvent.change(screen.getByLabelText('Portal Matter'), { target: { value: 'matter-1' } });
    fireEvent.change(screen.getByPlaceholderText('Message'), { target: { value: 'See attached defect photo' } });
    fireEvent.change(screen.getByPlaceholderText('Attachment Title (optional)'), {
      target: { value: 'Uploaded Portal Photo' },
    });

    const file = new File(['binary'], 'defect-photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Attachment File'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    await screen.findByRole('dialog', { name: 'Confirm Client Message Send' });
    fireEvent.click(screen.getByRole('button', { name: 'Approve Send' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/portal/attachments/upload',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        }),
      );
    });

    const sendCall = fetchMock.mock.calls.find(([url]) => String(url) === 'http://localhost:4000/portal/messages');
    expect(sendCall).toBeDefined();
    expect(JSON.parse((sendCall?.[1]?.body as string) || '{}')).toEqual({
      matterId: 'matter-1',
      body: 'See attached defect photo',
      attachmentVersionIds: ['ver-up'],
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Download Uploaded Portal Photo' })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Download Uploaded Portal Photo' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/portal/attachments/ver-up/download-url',
        expect.objectContaining({ credentials: 'include' }),
      );
      expect(openSpy).toHaveBeenCalledWith('https://download.local/ver-up', '_blank', 'noopener,noreferrer');
    });

    openSpy.mockRestore();
  });
});

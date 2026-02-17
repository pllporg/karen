import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
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
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          matters: [{ id: 'm1' }],
          keyDates: [{ id: 'd1' }],
          invoices: [{ id: 'i1' }],
          messages: [],
          documents: [{ id: 'doc1' }, { id: 'doc2' }],
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ id: 'msg-1' }))
      .mockResolvedValueOnce(
        jsonResponse({
          matters: [{ id: 'm1' }, { id: 'm2' }],
          keyDates: [{ id: 'd1' }],
          invoices: [{ id: 'i1' }],
          messages: [],
          documents: [{ id: 'doc1' }, { id: 'doc2' }, { id: 'doc3' }],
        }),
      );
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

    fireEvent.change(screen.getByPlaceholderText('Matter ID'), { target: { value: 'matter-1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/portal/messages',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        }),
      );
    });

    const sendCall = fetchMock.mock.calls[1];
    expect(JSON.parse(sendCall[1]?.body as string)).toEqual({
      matterId: 'matter-1',
      body: 'Can you share the latest mediation timeline?',
    });

    await waitFor(() => {
      expect(screen.getByText('2 visible matters')).toBeInTheDocument();
      expect(screen.getByText('3 shared docs')).toBeInTheDocument();
    });
  });

  it('submits intake and creates e-sign envelope from portal actions', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ matters: [], keyDates: [], invoices: [], messages: [], documents: [], eSignEnvelopes: [] }))
      .mockResolvedValueOnce(jsonResponse({ id: 'intake-1' }))
      .mockResolvedValueOnce(jsonResponse({ matters: [], keyDates: [], invoices: [], messages: [], documents: [], eSignEnvelopes: [] }))
      .mockResolvedValueOnce(jsonResponse({ id: 'esign-1' }))
      .mockResolvedValueOnce(jsonResponse({ matters: [], keyDates: [], invoices: [], messages: [], documents: [], eSignEnvelopes: [{ id: 'esign-1' }] }));
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

    fireEvent.change(screen.getByPlaceholderText('Matter ID'), { target: { value: 'matter-22' } });
    fireEvent.change(screen.getByPlaceholderText('Intake Form Definition ID'), { target: { value: 'intake-def-1' } });
    fireEvent.change(screen.getByPlaceholderText('Engagement Letter Template ID'), {
      target: { value: 'letter-template-5' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Submit Intake' }));
    fireEvent.click(screen.getByRole('button', { name: 'Create E-Sign Envelope' }));

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
        matterId: 'matter-22',
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

  it('uploads a portal attachment, links it to message, and downloads securely', async () => {
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({
          matters: [{ id: 'matter-1' }],
          keyDates: [],
          invoices: [],
          messages: [],
          documents: [],
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          document: { id: 'doc-uploaded' },
          version: { id: 'ver-up' },
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ id: 'msg-uploaded' }))
      .mockResolvedValueOnce(
        jsonResponse({
          matters: [{ id: 'matter-1' }],
          keyDates: [],
          invoices: [],
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
        }),
      )
      .mockResolvedValueOnce(jsonResponse({ url: 'https://download.local/ver-up' }));

    vi.stubGlobal('fetch', fetchMock);

    render(<PortalPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/portal/snapshot',
        expect.objectContaining({ credentials: 'include' }),
      );
    });

    fireEvent.change(screen.getByPlaceholderText('Matter ID'), { target: { value: 'matter-1' } });
    fireEvent.change(screen.getByPlaceholderText('Message'), { target: { value: 'See attached defect photo' } });
    fireEvent.change(screen.getByPlaceholderText('Attachment Title (optional)'), {
      target: { value: 'Uploaded Portal Photo' },
    });

    const file = new File(['binary'], 'defect-photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Attachment File'), { target: { files: [file] } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/portal/attachments/upload',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        }),
      );
    });

    const sendCall = fetchMock.mock.calls[2];
    expect(JSON.parse(sendCall[1]?.body as string)).toEqual({
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

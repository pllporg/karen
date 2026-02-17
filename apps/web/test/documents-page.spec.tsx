import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import DocumentsPage from '../app/documents/page';

function jsonResponse<T>(payload: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response;
}

describe('DocumentsPage', () => {
  it('uploads a document and refreshes the list', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ id: 'upload-ok' }))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 'doc-1',
            matterId: 'matter-1',
            title: 'Inspection Report',
            versions: [{ id: 'v1' }],
            sharedWithClient: false,
          },
        ]),
      );
    vi.stubGlobal('fetch', fetchMock);

    const { container } = render(<DocumentsPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/documents',
        expect.objectContaining({
          credentials: 'include',
        }),
      );
    });

    fireEvent.change(screen.getByPlaceholderText('Matter ID'), { target: { value: 'matter-1' } });
    const file = new File(['inspection text'], 'inspection.txt', { type: 'text/plain' });
    const fileInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: 'Upload' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/documents/upload',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        }),
      );
    });

    const uploadCall = fetchMock.mock.calls[1];
    const formData = uploadCall[1]?.body as FormData;
    expect(formData.get('matterId')).toBe('matter-1');
    expect(formData.get('title')).toBe('Inspection Report');
    expect((formData.get('file') as File).name).toBe('inspection.txt');

    await waitFor(() => {
      expect(screen.getByRole('cell', { name: 'Inspection Report' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'matter-1' })).toBeInTheDocument();
    });
  });

  it('generates a pdf draft and refreshes the document list', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ id: 'pdf-ok' }))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 'doc-2',
            matterId: 'matter-9',
            title: 'Generated Client Letter',
            versions: [{ id: 'v1' }],
            sharedWithClient: true,
          },
        ]),
      );
    vi.stubGlobal('fetch', fetchMock);

    render(<DocumentsPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/documents',
        expect.objectContaining({
          credentials: 'include',
        }),
      );
    });

    fireEvent.change(screen.getByPlaceholderText('Matter ID for generated PDF'), { target: { value: 'matter-9' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate PDF Draft' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/documents/generate-pdf',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
          credentials: 'include',
        }),
      );
    });

    const generateCall = fetchMock.mock.calls[1];
    const payload = JSON.parse(generateCall[1]?.body as string);
    expect(payload).toEqual(
      expect.objectContaining({
        matterId: 'matter-9',
        title: 'Generated Client Letter',
      }),
    );

    await waitFor(() => {
      expect(screen.getByRole('cell', { name: 'Generated Client Letter' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'matter-9' })).toBeInTheDocument();
      expect(screen.getByRole('cell', { name: 'Yes' })).toBeInTheDocument();
    });
  });

  it('manages retention policy, legal hold, and disposition run actions', async () => {
    const policy = {
      id: 'policy-1',
      name: 'Default 7-year retention',
      scope: 'ALL_DOCUMENTS',
      retentionDays: 2555,
    };
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 'doc-1',
            matterId: 'matter-1',
            title: 'Inspection Report',
            versions: [{ id: 'v1' }],
            sharedWithClient: false,
            legalHoldActive: false,
            dispositionStatus: 'ACTIVE',
            retentionPolicy: null,
          },
        ]),
      )
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse(policy))
      .mockResolvedValueOnce(jsonResponse([policy]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ id: 'assign-ok' }))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 'doc-1',
            matterId: 'matter-1',
            title: 'Inspection Report',
            versions: [{ id: 'v1' }],
            sharedWithClient: false,
            legalHoldActive: false,
            dispositionStatus: 'ACTIVE',
            retentionPolicy: policy,
          },
        ]),
      )
      .mockResolvedValueOnce(jsonResponse({ id: 'hold-ok' }))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 'doc-1',
            matterId: 'matter-1',
            title: 'Inspection Report',
            versions: [{ id: 'v1' }],
            sharedWithClient: false,
            legalHoldActive: true,
            dispositionStatus: 'ACTIVE',
            retentionPolicy: policy,
          },
        ]),
      )
      .mockResolvedValueOnce(jsonResponse({ id: 'run-1' }))
      .mockResolvedValueOnce(jsonResponse([policy]))
      .mockResolvedValueOnce(jsonResponse([{ id: 'run-1', status: 'PENDING_APPROVAL', cutoffAt: '2026-02-01T00:00:00.000Z', items: [] }]));
    vi.stubGlobal('fetch', fetchMock);

    render(<DocumentsPage />);

    await screen.findByRole('cell', { name: 'Inspection Report' });

    fireEvent.click(screen.getByRole('button', { name: 'Load Retention Data' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/documents/retention/policies',
        expect.objectContaining({ credentials: 'include' }),
      );
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/documents/disposition/runs',
        expect.objectContaining({ credentials: 'include' }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Policy' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/documents/retention/policies',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
        }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Assign Policy' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/documents/doc-1/retention-policy',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
        }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Place Hold' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/documents/doc-1/legal-hold',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
        }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Disposition Run' }));
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/documents/disposition/runs',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
        }),
      );
      expect(screen.getByText('Created disposition run.')).toBeInTheDocument();
    });
  });
});

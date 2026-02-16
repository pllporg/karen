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
});

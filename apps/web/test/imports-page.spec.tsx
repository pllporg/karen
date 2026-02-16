import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ImportsPage from '../app/imports/page';

function jsonResponse<T>(payload: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response;
}

describe('ImportsPage', () => {
  it('runs a generic csv import and refreshes batches', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ id: 'batch1234abcd', status: 'COMPLETED' }))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 'batch1234abcd',
            sourceSystem: 'generic_csv',
            status: 'COMPLETED',
          },
        ]),
      );
    vi.stubGlobal('fetch', fetchMock);

    const { container } = render(<ImportsPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/imports/batches',
        expect.objectContaining({
          credentials: 'include',
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
        }),
      );
    });

    const [sourceSelect, entitySelect] = screen.getAllByRole('combobox');
    fireEvent.change(sourceSelect, { target: { value: 'generic_csv' } });
    fireEvent.change(entitySelect, { target: { value: 'matter' } });

    const file = new File(['matter,name\nM-1,Ortega'], 'matters.csv', { type: 'text/csv' });
    const uploadInput = container.querySelector('input[type="file"]') as HTMLInputElement;
    expect(uploadInput).toBeTruthy();
    fireEvent.change(uploadInput, { target: { files: [file] } });

    fireEvent.click(screen.getByRole('button', { name: 'Run Import' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/imports/run',
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
        }),
      );
    });

    const runCall = fetchMock.mock.calls[1];
    const formData = runCall[1]?.body as FormData;
    expect(formData.get('sourceSystem')).toBe('generic_csv');
    expect(formData.get('entityType')).toBe('matter');
    expect((formData.get('file') as File).name).toBe('matters.csv');

    await waitFor(() => {
      expect(screen.getByText('batch123')).toBeInTheDocument();
      expect(screen.getByText('generic_csv')).toBeInTheDocument();
      expect(screen.getByText('COMPLETED')).toBeInTheDocument();
    });
  });
});

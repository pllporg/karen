import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AiPage from '../app/ai/page';

function jsonResponse<T>(payload: T, status = 200): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => payload,
    text: async () => JSON.stringify(payload),
  } as Response;
}

describe('AiPage', () => {
  it('requires explicit deadline confirmation and submits selected rows', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 'job-1',
            toolName: 'deadline_extraction',
            matterId: 'matter-1',
            status: 'COMPLETED',
            artifacts: [
              {
                id: 'artifact-1',
                type: 'deadline_extraction',
                content: 'Draft deadline table',
                reviewedStatus: 'DRAFT',
                metadataJson: {
                  banner: 'Attorney Review Required - AI output is a draft and not legal advice.',
                  deadlineCandidates: [
                    {
                      id: 'deadline-1',
                      date: '2026-03-01',
                      description: 'Serve initial disclosures',
                      chunkId: 'chunk-abc',
                      excerpt: 'Within 14 days after Rule 26(f) conference.',
                    },
                  ],
                  excerptEvidence: [
                    {
                      chunkId: 'chunk-abc',
                      excerpt: 'Within 14 days after Rule 26(f) conference.',
                    },
                  ],
                },
              },
            ],
          },
        ]),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          created: [
            { type: 'task', id: 'task-1' },
            { type: 'event', id: 'event-1' },
          ],
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    render(<AiPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/ai/jobs',
        expect.objectContaining({
          credentials: 'include',
          headers: expect.objectContaining({ 'content-type': 'application/json' }),
        }),
      );
    });

    expect(screen.getByRole('button', { name: 'Confirm Selected Deadlines' })).toBeDisabled();
    expect(screen.getByText('Within 14 days after Rule 26(f) conference.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: 'Confirm' }));
    expect(screen.getByRole('button', { name: 'Confirm Selected Deadlines' })).toBeEnabled();

    fireEvent.click(screen.getByRole('button', { name: 'Confirm Selected Deadlines' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/ai/artifacts/artifact-1/confirm-deadlines',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"date":"2026-03-01"'),
        }),
      );
    });

    const confirmCall = fetchMock.mock.calls[1];
    expect(JSON.parse(confirmCall[1]?.body as string)).toEqual({
      selections: [
        {
          date: '2026-03-01',
          description: 'Serve initial disclosures',
          createTask: true,
          createEvent: true,
        },
      ],
    });

    await waitFor(() => {
      expect(screen.getByText('Created 2 records from confirmed deadlines.')).toBeInTheDocument();
    });
  });

  it('approves artifact and reloads jobs', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 'job-2',
            toolName: 'case_summary',
            matterId: 'matter-2',
            status: 'COMPLETED',
            artifacts: [
              {
                id: 'artifact-2',
                type: 'case_summary',
                content: 'Draft case summary',
                reviewedStatus: 'DRAFT',
                metadataJson: {},
              },
            ],
          },
        ]),
      )
      .mockResolvedValueOnce(jsonResponse({ id: 'artifact-2', reviewedStatus: 'APPROVED' }))
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 'job-2',
            toolName: 'case_summary',
            matterId: 'matter-2',
            status: 'COMPLETED',
            artifacts: [
              {
                id: 'artifact-2',
                type: 'case_summary',
                content: 'Draft case summary',
                reviewedStatus: 'APPROVED',
                metadataJson: {},
              },
            ],
          },
        ]),
      );
    vi.stubGlobal('fetch', fetchMock);

    render(<AiPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/ai/jobs',
        expect.objectContaining({ credentials: 'include' }),
      );
    });

    const approveButton = await screen.findByRole('button', { name: 'Approve' });
    fireEvent.click(approveButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/ai/artifacts/artifact-2/review',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ status: 'APPROVED' }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText('APPROVED')).toBeInTheDocument();
    });
  });
});

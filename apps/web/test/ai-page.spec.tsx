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

function findCall(fetchMock: ReturnType<typeof vi.fn>, path: string) {
  return fetchMock.mock.calls.find((call) => call[0] === `http://localhost:4000${path}`);
}

describe('AiPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

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
      .mockResolvedValueOnce(jsonResponse([]))
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
    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/ai/style-packs',
        expect.objectContaining({ credentials: 'include' }),
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

    const confirmCall = findCall(fetchMock, '/ai/artifacts/artifact-1/confirm-deadlines');
    expect(confirmCall).toBeTruthy();
    expect(JSON.parse(confirmCall?.[1]?.body as string)).toEqual({
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

  it('shows validation error when selected deadline has no task/event outputs enabled', async () => {
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
                },
              },
            ],
          },
        ]),
      )
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(
        jsonResponse(
          {
            message: 'Select at least one output (task/event) at row 1',
          },
          400,
        ),
      );

    vi.stubGlobal('fetch', fetchMock);

    render(<AiPage />);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/ai/jobs',
        expect.objectContaining({ credentials: 'include' }),
      );
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/ai/style-packs',
        expect.objectContaining({ credentials: 'include' }),
      );
    });

    await screen.findByText('Serve initial disclosures');
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Confirm' }));
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Create task' }));
    fireEvent.click(await screen.findByRole('checkbox', { name: 'Create event' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm Selected Deadlines' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/ai/artifacts/artifact-1/confirm-deadlines',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"createTask":false'),
        }),
      );
      expect(screen.getByText(/Select at least one output/i)).toBeInTheDocument();
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
      .mockResolvedValueOnce(jsonResponse([]))
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
      )
      .mockResolvedValueOnce(jsonResponse([]));
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
      expect(screen.getAllByText('APPROVED').length).toBeGreaterThan(0);
    });
  });

  it('shows review-gate sequence and audit context for generated artifacts', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse([
          {
            id: 'job-ctx-1',
            toolName: 'case_summary',
            matterId: 'matter-ctx-1',
            status: 'COMPLETED',
            createdByUserId: 'user-42',
            createdAt: '2026-02-20T00:00:00.000Z',
            artifacts: [
              {
                id: 'artifact-ctx-1',
                type: 'case_summary',
                content: 'Draft case summary',
                reviewedStatus: 'DRAFT',
                reviewedByUserId: null,
                reviewedAt: null,
                createdAt: '2026-02-20T00:00:30.000Z',
                metadataJson: {},
              },
            ],
          },
        ]),
      )
      .mockResolvedValueOnce(jsonResponse([]));
    vi.stubGlobal('fetch', fetchMock);

    render(<AiPage />);

    await waitFor(() => {
      expect(screen.getAllByText('PROPOSED').length).toBeGreaterThan(0);
      expect(screen.getAllByText('IN REVIEW').length).toBeGreaterThan(0);
      expect(screen.getAllByText('APPROVED').length).toBeGreaterThan(0);
      expect(screen.getAllByText('EXECUTED').length).toBeGreaterThan(0);
      expect(screen.getAllByText('RETURNED').length).toBeGreaterThan(0);
    });

    expect(
      screen.getByText(
        'Submitted 2026-02-20T00:00:30.000Z by user-42 | Review: pending at pending',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('External send/file actions remain blocked until review status is APPROVED.')).toBeInTheDocument();
  });

  it('includes selected style pack id when creating AI jobs', async () => {
    const stylePacks = [
      {
        id: 'style-pack-1',
        name: 'Plaintiff Demand Tone',
        description: 'Assertive but concise',
        sourceDocs: [],
      },
    ];

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse(stylePacks))
      .mockResolvedValueOnce(jsonResponse({ id: 'job-3' }))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse(stylePacks));
    vi.stubGlobal('fetch', fetchMock);

    render(<AiPage />);

    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Plaintiff Demand Tone' })).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Matter ID'), {
      target: { value: 'matter-99' },
    });
    fireEvent.change(screen.getByDisplayValue('No style pack'), {
      target: { value: 'style-pack-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create AI Job' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/ai/jobs',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"stylePackId":"style-pack-1"'),
        }),
      );
    });
  });

  it('creates, updates, attaches, and removes style pack source docs', async () => {
    const stylePackBase = {
      id: 'style-pack-9',
      name: 'Builder Defense',
      description: 'Direct and plain-language',
    };

    const stylePackWithDoc = {
      ...stylePackBase,
      sourceDocs: [
        {
          id: 'spd-1',
          documentVersionId: 'ver-1',
          documentVersion: {
            id: 'ver-1',
            mimeType: 'application/pdf',
            size: 1024,
            uploadedAt: '2026-02-17T00:00:00Z',
            document: {
              id: 'doc-1',
              matterId: 'matter-1',
              title: 'Sample Demand',
            },
          },
        },
      ],
    };

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse({ ...stylePackBase, sourceDocs: [] }))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([{ ...stylePackBase, sourceDocs: [] }]))
      .mockResolvedValueOnce(jsonResponse({ ...stylePackBase, sourceDocs: [] }))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([{ ...stylePackBase, sourceDocs: [] }]))
      .mockResolvedValueOnce(jsonResponse(stylePackWithDoc))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([stylePackWithDoc]))
      .mockResolvedValueOnce(jsonResponse({ ...stylePackBase, sourceDocs: [] }))
      .mockResolvedValueOnce(jsonResponse([]))
      .mockResolvedValueOnce(jsonResponse([{ ...stylePackBase, sourceDocs: [] }]));
    vi.stubGlobal('fetch', fetchMock);

    render(<AiPage />);

    fireEvent.change(screen.getByPlaceholderText('Style pack name'), {
      target: { value: 'Builder Defense' },
    });
    fireEvent.change(screen.getByPlaceholderText('Description (optional)'), {
      target: { value: 'Direct and plain-language' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create Style Pack' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/ai/style-packs',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"name":"Builder Defense"'),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue('Builder Defense')).toBeInTheDocument();
    });

    const stylePackNameInputs = screen.getAllByDisplayValue('Builder Defense');
    fireEvent.change(stylePackNameInputs[0], { target: { value: 'Builder Defense Updated' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/ai/style-packs/style-pack-9',
        expect.objectContaining({
          method: 'PATCH',
          body: expect.stringContaining('"name":"Builder Defense Updated"'),
        }),
      );
    });

    fireEvent.change(screen.getByPlaceholderText('Attach source document version ID'), {
      target: { value: 'ver-1' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Attach Source Doc' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/ai/style-packs/style-pack-9/source-docs',
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"documentVersionId":"ver-1"'),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Sample Demand (ver-1)')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        'http://localhost:4000/ai/style-packs/style-pack-9/source-docs/ver-1',
        expect.objectContaining({
          method: 'DELETE',
        }),
      );
    });
  });
});

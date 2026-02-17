import { AiService } from '../src/ai/ai.service';

describe('AiService pgvector retrieval', () => {
  const vector = (value: number) => Array.from({ length: 1536 }, () => value);

  it('uses vector similarity retrieval when query embeddings are available', async () => {
    const prisma = {
      matter: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'matter-1',
          organizationId: 'org-1',
          matterNumber: 'M-001',
          name: 'Kitchen Remodel Defect',
        }),
      },
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: 'chunk-blocked',
          chunkText: '[FILTERED_UNTRUSTED_INSTRUCTION:override-instructions]',
          metadataJson: {
            promptInjection: {
              detected: true,
              maxSeverity: 'high',
              blockedFromAiContext: true,
            },
          },
          createdAt: new Date('2026-02-01T00:00:00.000Z'),
        },
        {
          id: 'chunk-safe',
          chunkText: 'Contractor failed to cure water intrusion defects after notice.',
          metadataJson: {
            promptInjection: {
              detected: false,
              maxSeverity: 'none',
              blockedFromAiContext: false,
            },
          },
          createdAt: new Date('2026-02-02T00:00:00.000Z'),
        },
      ]),
      aiSourceChunk: {
        findMany: jest.fn(),
      },
    } as any;

    const service = new AiService(
      prisma,
      { createWorker: jest.fn(), addJob: jest.fn() } as any,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn() } as any,
    );

    (service as any).embedText = jest.fn().mockResolvedValue(vector(0.1));

    const context = await (service as any).buildMatterContext(
      'org-1',
      'matter-1',
      'demand letter roof leak chronology',
    );

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(prisma.aiSourceChunk.findMany).not.toHaveBeenCalled();
    expect(context.retrieval).toEqual(
      expect.objectContaining({
        mode: 'vector',
        reason: 'pgvector_similarity',
      }),
    );
    expect(context.chunks).toHaveLength(1);
    expect(context.chunks[0].id).toBe('chunk-safe');
  });

  it('falls back to recent chunks when vector retrieval is unavailable', async () => {
    const prisma = {
      matter: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'matter-1',
          organizationId: 'org-1',
          matterNumber: 'M-001',
          name: 'Kitchen Remodel Defect',
        }),
      },
      $queryRaw: jest.fn().mockRejectedValue(new Error('operator does not exist: vector <=> vector')),
      aiSourceChunk: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'chunk-safe',
            chunkText: 'Fallback chunk text for chronology.',
            metadataJson: null,
            createdAt: new Date('2026-02-03T00:00:00.000Z'),
          },
        ]),
      },
    } as any;

    const service = new AiService(
      prisma,
      { createWorker: jest.fn(), addJob: jest.fn() } as any,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn() } as any,
    );

    (service as any).embedText = jest.fn().mockResolvedValue(vector(0.4));

    const context = await (service as any).buildMatterContext(
      'org-1',
      'matter-1',
      'construction timeline and damages',
    );

    expect(prisma.$queryRaw).toHaveBeenCalled();
    expect(prisma.aiSourceChunk.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: 'org-1' }),
        take: 50,
      }),
    );
    expect(context.retrieval).toEqual(
      expect.objectContaining({
        mode: 'recent',
        reason: 'vector_unavailable_or_empty',
      }),
    );
    expect(context.chunks).toHaveLength(1);
    expect(context.chunks[0].id).toBe('chunk-safe');
  });

  it('persists vector column values during ingestion when embeddings are present', async () => {
    const prisma = {
      aiSourceChunk: {
        create: jest.fn().mockResolvedValue({ id: 'chunk-1' }),
      },
      $executeRaw: jest.fn().mockResolvedValue(1),
    } as any;

    const access = {
      assertMatterAccess: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new AiService(
      prisma,
      { createWorker: jest.fn(), addJob: jest.fn() } as any,
      access,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
    );

    (service as any).embedText = jest.fn().mockResolvedValue(vector(0.01));

    await service.ingestDocument({
      user: { id: 'user-1', organizationId: 'org-1' } as any,
      matterId: 'matter-1',
      documentVersionId: 'doc-version-1',
      text: 'Scheduling order entered with trial date and expert cutoff deadlines.',
      metadata: { source: 'upload' },
    });

    expect(access.assertMatterAccess).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org-1' }),
      'matter-1',
      'write',
    );
    expect(prisma.aiSourceChunk.create).toHaveBeenCalled();
    expect(prisma.$executeRaw).toHaveBeenCalled();
  });
});

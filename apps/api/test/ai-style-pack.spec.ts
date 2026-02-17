import { AiService } from '../src/ai/ai.service';

describe('AiService style pack workflows', () => {
  it('queues AI jobs with selected style pack id', async () => {
    const prisma = {
      stylePack: {
        findFirst: jest.fn().mockResolvedValue({ id: 'style-pack-1', organizationId: 'org-1' }),
      },
      aiJob: {
        create: jest.fn().mockResolvedValue({ id: 'job-1', status: 'QUEUED' }),
      },
    } as any;

    const queue = {
      createWorker: jest.fn(),
      addJob: jest.fn().mockResolvedValue({ id: 'queue-job-1' }),
    } as any;

    const access = {
      assertMatterAccess: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new AiService(prisma, queue, access, { appendEvent: jest.fn() } as any);

    await service.createJob({
      user: { id: 'user-1', organizationId: 'org-1' } as any,
      matterId: 'matter-1',
      toolName: 'demand_letter',
      payload: { objective: 'settlement demand' },
      stylePackId: 'style-pack-1',
    });

    expect(prisma.stylePack.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'style-pack-1', organizationId: 'org-1' },
      }),
    );
    expect(queue.addJob).toHaveBeenCalledWith(
      'ai-jobs',
      'demand_letter',
      expect.objectContaining({
        stylePackId: 'style-pack-1',
      }),
      expect.any(Object),
    );
  });

  it('attaches source docs to style packs with matter access check', async () => {
    const getStylePackResult = {
      id: 'style-pack-1',
      name: 'Construction Litigation Tone',
      description: 'Forceful but neutral',
      sourceDocs: [
        {
          id: 'spd-1',
          documentVersionId: 'ver-1',
          documentVersion: {
            document: {
              id: 'doc-1',
              matterId: 'matter-1',
              title: 'Winning Demand Letter',
            },
          },
        },
      ],
    };

    const prisma = {
      stylePack: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({ id: 'style-pack-1', organizationId: 'org-1' })
          .mockResolvedValueOnce(getStylePackResult),
      },
      documentVersion: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'ver-1',
          documentId: 'doc-1',
          document: {
            id: 'doc-1',
            matterId: 'matter-1',
          },
        }),
      },
      stylePackSourceDoc: {
        upsert: jest.fn().mockResolvedValue({ id: 'spd-1' }),
      },
    } as any;

    const access = {
      assertMatterAccess: jest.fn().mockResolvedValue(undefined),
    } as any;

    const audit = {
      appendEvent: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new AiService(prisma, { createWorker: jest.fn(), addJob: jest.fn() } as any, access, audit);

    const result = await service.addStylePackSourceDoc({
      user: { id: 'user-1', organizationId: 'org-1' } as any,
      stylePackId: 'style-pack-1',
      documentVersionId: 'ver-1',
    });

    expect(access.assertMatterAccess).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1', organizationId: 'org-1' }),
      'matter-1',
      'read',
    );
    expect(prisma.stylePackSourceDoc.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          stylePackId_documentVersionId: {
            stylePackId: 'style-pack-1',
            documentVersionId: 'ver-1',
          },
        },
      }),
    );
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ai.style_pack.source_doc.attached',
        entityId: 'style-pack-1',
      }),
    );
    expect(result).toEqual(getStylePackResult);
  });

  it('records selected style pack in artifact and execution provenance', async () => {
    const aiJobUpdate = jest.fn().mockResolvedValue({ id: 'job-1' });
    const aiArtifactCreate = jest.fn().mockResolvedValue({ id: 'artifact-1' });
    const aiExecutionCreate = jest.fn().mockResolvedValue({ id: 'exec-1' });
    let workerProcessor: ((job: { data: Record<string, unknown> }) => Promise<void>) | undefined;

    const prisma = {
      aiJob: {
        update: aiJobUpdate,
      },
      matter: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'matter-1',
          name: 'Rivera v. North Harbor Builders',
          matterNumber: 'M-2026-0001',
        }),
      },
      aiSourceChunk: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'chunk-1',
            chunkText: 'Use plain language and direct section headings.',
            metadataJson: {},
          },
        ]),
      },
      stylePack: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'style-pack-1',
          name: 'Homeowner Plaintiffs',
          description: 'Assertive but concise',
          sourceDocs: [
            {
              documentVersionId: 'ver-1',
              documentVersion: {
                document: {
                  title: 'Sample Demand',
                  matterId: 'matter-1',
                },
              },
            },
          ],
        }),
      },
      aiArtifact: {
        create: aiArtifactCreate,
      },
      aiExecutionLog: {
        create: aiExecutionCreate,
      },
    } as any;

    const queue = {
      createWorker: jest.fn((_name: string, processor: (job: { data: Record<string, unknown> }) => Promise<void>) => {
        workerProcessor = processor;
      }),
      addJob: jest.fn(),
    } as any;

    const audit = {
      appendEvent: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new AiService(prisma, queue, { assertMatterAccess: jest.fn() } as any, audit);
    service.onModuleInit();
    expect(workerProcessor).toBeTruthy();
    if (!workerProcessor) {
      throw new Error('AI worker processor was not registered');
    }

    await workerProcessor({
      data: {
        aiJobId: 'job-1',
        organizationId: 'org-1',
        matterId: 'matter-1',
        toolName: 'demand_letter',
        input: {},
        createdByUserId: 'user-1',
        stylePackId: 'style-pack-1',
      },
    });

    expect(aiArtifactCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          metadataJson: expect.objectContaining({
            stylePack: expect.objectContaining({
              id: 'style-pack-1',
              name: 'Homeowner Plaintiffs',
              sourceDocCount: 1,
            }),
          }),
        }),
      }),
    );
    expect(aiExecutionCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          modelParamsJson: expect.objectContaining({
            stylePackId: 'style-pack-1',
            stylePackName: 'Homeowner Plaintiffs',
            stylePackSourceDocCount: 1,
          }),
        }),
      }),
    );
  });
});

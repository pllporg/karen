import { AiService } from '../src/ai/ai.service';

describe('AiService deadline confirmation governance', () => {
  function createHarness() {
    const prisma = {
      aiArtifact: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'artifact-1',
          organizationId: 'org-1',
          job: {
            id: 'job-1',
            matterId: 'matter-1',
          },
        }),
      },
      task: {
        create: jest.fn().mockResolvedValue({ id: 'task-1' }),
      },
      calendarEvent: {
        create: jest.fn().mockResolvedValue({ id: 'event-1' }),
      },
      aiJob: {
        create: jest.fn(),
      },
    } as any;

    const queue = {
      createWorker: jest.fn(),
      addJob: jest.fn(),
    } as any;

    const access = {
      assertMatterAccess: jest.fn().mockResolvedValue(undefined),
    } as any;

    const audit = {
      appendEvent: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    } as any;

    return {
      service: new AiService(prisma, queue, access, audit),
      prisma,
      access,
      audit,
    };
  }

  it('creates task/event outputs and appends audit evidence', async () => {
    const { service, prisma, access, audit } = createHarness();

    const result = await service.confirmDeadlines({
      user: { id: 'user-1', organizationId: 'org-1' } as any,
      artifactId: 'artifact-1',
      selections: [
        {
          date: '2026-03-01',
          description: 'Serve initial disclosures',
          createTask: true,
          createEvent: true,
        },
      ],
    });

    expect(access.assertMatterAccess).toHaveBeenCalledWith(
      expect.objectContaining({ organizationId: 'org-1' }),
      'matter-1',
      'write',
    );
    expect(prisma.task.create).toHaveBeenCalledTimes(1);
    expect(prisma.calendarEvent.create).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      created: [
        { type: 'task', id: 'task-1' },
        { type: 'event', id: 'event-1' },
      ],
    });

    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: 'org-1',
        actorUserId: 'user-1',
        action: 'ai.deadlines.confirmed',
        entityType: 'aiArtifact',
        entityId: 'artifact-1',
        metadata: expect.objectContaining({
          matterId: 'matter-1',
          selectionCount: 1,
          createdCount: 2,
        }),
      }),
    );
  });

  it('rejects empty selections', async () => {
    const { service, prisma, audit } = createHarness();

    await expect(
      service.confirmDeadlines({
        user: { id: 'user-1', organizationId: 'org-1' } as any,
        artifactId: 'artifact-1',
        selections: [],
      }),
    ).rejects.toThrow('At least one confirmed deadline selection is required');

    expect(prisma.task.create).not.toHaveBeenCalled();
    expect(prisma.calendarEvent.create).not.toHaveBeenCalled();
    expect(audit.appendEvent).not.toHaveBeenCalled();
  });

  it('rejects invalid dates and missing outputs', async () => {
    const { service, prisma, audit } = createHarness();

    await expect(
      service.confirmDeadlines({
        user: { id: 'user-1', organizationId: 'org-1' } as any,
        artifactId: 'artifact-1',
        selections: [
          {
            date: 'not-a-date',
            description: 'Serve initial disclosures',
            createTask: true,
            createEvent: true,
          },
        ],
      }),
    ).rejects.toThrow('Invalid deadline date at row 1');

    await expect(
      service.confirmDeadlines({
        user: { id: 'user-1', organizationId: 'org-1' } as any,
        artifactId: 'artifact-1',
        selections: [
          {
            date: '2026-03-01',
            description: 'Serve initial disclosures',
            createTask: false,
            createEvent: false,
          },
        ],
      }),
    ).rejects.toThrow('Select at least one output (task/event) at row 1');

    expect(prisma.task.create).not.toHaveBeenCalled();
    expect(prisma.calendarEvent.create).not.toHaveBeenCalled();
    expect(audit.appendEvent).not.toHaveBeenCalled();
  });

  it('supports task-only or event-only confirmed rows', async () => {
    const { service, prisma, audit } = createHarness();

    await service.confirmDeadlines({
      user: { id: 'user-1', organizationId: 'org-1' } as any,
      artifactId: 'artifact-1',
      selections: [
        {
          date: '2026-03-01',
          description: 'Serve initial disclosures',
          createTask: true,
          createEvent: false,
        },
      ],
    });

    expect(prisma.task.create).toHaveBeenCalledTimes(1);
    expect(prisma.calendarEvent.create).toHaveBeenCalledTimes(0);
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          createdCount: 1,
        }),
      }),
    );
  });
});

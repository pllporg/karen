import { AiArtifactReviewStatus } from '@prisma/client';
import { AiService } from '../src/ai/ai.service';

describe('AiService deadline confirmation governance', () => {
  function createHarness(overrides?: { metadataJson?: Record<string, unknown> | null }) {
    const prisma = {
      aiArtifact: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'artifact-1',
          organizationId: 'org-1',
          metadataJson: overrides?.metadataJson ?? null,
          job: {
            id: 'job-1',
            matterId: 'matter-1',
          },
        }),
        update: jest.fn().mockResolvedValue({ id: 'artifact-1' }),
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
    const { service, prisma, access, audit } = createHarness({
      metadataJson: {
        agentOrchestration: {
          id: 'run-1',
          organizationId: 'org-1',
          matterId: 'matter-1',
          artifactId: 'artifact-1',
          proposal: {
            id: 'proposal-1',
            status: 'APPROVED',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            updatedByUserId: 'user-1',
          },
          steps: [],
        },
      },
    });

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

    expect(prisma.aiArtifact.update).toHaveBeenCalledTimes(1);
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ai.agent.proposal.executed',
        entityType: 'agentProposal',
        metadata: expect.objectContaining({
          reason: 'Approved deadline selections executed as downstream records',
          transitionedAt: expect.any(String),
        }),
      }),
    );
  });

  it('rejects execution until the proposal is approved', async () => {
    const { service } = createHarness({ metadataJson: null });

    await expect(
      service.confirmDeadlines({
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
      }),
    ).rejects.toThrow('Execution is blocked until proposal is approved');
  });

  it('transitions proposal lifecycle through review and approval', async () => {
    const { service, audit, prisma } = createHarness({ metadataJson: null });

    await service.reviewArtifact({
      user: { id: 'user-1', organizationId: 'org-1' } as any,
      artifactId: 'artifact-1',
      status: AiArtifactReviewStatus.DRAFT,
    });

    await service.reviewArtifact({
      user: { id: 'user-1', organizationId: 'org-1' } as any,
      artifactId: 'artifact-1',
      status: AiArtifactReviewStatus.APPROVED,
    });

    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ai.agent.run.created',
        entityType: 'agentRun',
      }),
    );
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ai.agent.proposal.in_review',
      }),
    );
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ai.agent.proposal.approved',
        metadata: expect.objectContaining({ reason: 'Attorney approved draft artifact for execution' }),
      }),
    );
    expect(prisma.aiArtifact.update).toHaveBeenCalled();
  });

  it('rejects empty selections', async () => {
    const { service, prisma, audit } = createHarness({
      metadataJson: {
        agentOrchestration: {
          id: 'run-1',
          organizationId: 'org-1',
          matterId: 'matter-1',
          artifactId: 'artifact-1',
          proposal: {
            id: 'proposal-1',
            status: 'APPROVED',
            createdAt: '2026-01-01T00:00:00.000Z',
            updatedAt: '2026-01-01T00:00:00.000Z',
            updatedByUserId: 'user-1',
          },
          steps: [],
        },
      },
    });

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
});

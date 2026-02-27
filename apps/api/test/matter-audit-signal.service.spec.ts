import { MatterAuditSignalReviewState } from '@prisma/client';
import { MatterAuditSignalService } from '../src/audit/matter-audit-signal.service';

describe('MatterAuditSignalService', () => {
  it('generates missed-value signals with stable, sorted citations', async () => {
    const prisma = {
      aiExecutionLog: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'log-1',
            aiJobId: 'job-1',
            createdAt: new Date('2026-02-10T10:00:00.000Z'),
            sourceRefsJson: [{ chunkId: 'chunk-b' }, { chunkId: 'chunk-a' }, { chunkId: 'chunk-a' }],
            aiJob: { id: 'job-1', matterId: 'matter-1', toolName: 'timeline.extract' },
          },
        ]),
      },
      matterAuditSignal: {
        findUnique: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'signal-1' }),
      },
    } as any;

    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new MatterAuditSignalService(prisma, audit);

    const result = await service.generateMissedValueSignals({ organizationId: 'org-1', actorUserId: 'user-1' });

    expect(result).toEqual({ createdCount: 1, signalIds: ['signal-1'] });
    expect(prisma.matterAuditSignal.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ citationsJson: ['chunk-a', 'chunk-b'] }),
      }),
    );
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'matter_audit_signal.created', entityId: 'signal-1' }),
    );
  });

  it('lists signals in deterministic order for queue use', async () => {
    const prisma = {
      matterAuditSignal: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as any;

    const service = new MatterAuditSignalService(prisma, { appendEvent: jest.fn() } as any);

    await service.listSignals({ organizationId: 'org-1', reviewState: MatterAuditSignalReviewState.GENERATED });

    expect(prisma.matterAuditSignal.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ generatedAt: 'asc' }, { id: 'asc' }],
      }),
    );
  });

  it('updates review state and emits an audit event', async () => {
    const prisma = {
      matterAuditSignal: {
        findFirstOrThrow: jest.fn().mockResolvedValue({ id: 'signal-1', reviewState: MatterAuditSignalReviewState.GENERATED }),
        update: jest.fn().mockResolvedValue({ id: 'signal-1', reviewState: MatterAuditSignalReviewState.IN_REVIEW }),
      },
    } as any;

    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new MatterAuditSignalService(prisma, audit);

    const updated = await service.updateReviewState({
      organizationId: 'org-1',
      actorUserId: 'user-1',
      signalId: 'signal-1',
      reviewState: MatterAuditSignalReviewState.IN_REVIEW,
      reviewNotes: 'Needs attorney validation.',
    });

    expect(updated.reviewState).toBe(MatterAuditSignalReviewState.IN_REVIEW);
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'matter_audit_signal.updated',
        metadata: expect.objectContaining({
          previousReviewState: MatterAuditSignalReviewState.GENERATED,
          reviewState: MatterAuditSignalReviewState.IN_REVIEW,
        }),
      }),
    );
  });
});

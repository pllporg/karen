import { MembershipStatus } from '@prisma/client';
import { AuditScanSchedulerService } from '../src/communications/audit-scan-scheduler.service';

describe('AuditScanSchedulerService', () => {
  it('dispatches notifications for created signals and records outcomes', async () => {
    const prisma = {
      organization: {
        findMany: jest.fn().mockResolvedValue([{ id: 'org-1' }]),
      },
      matterAuditSignal: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'signal-1',
            matterId: 'matter-1',
            title: 'Potential missed-value finding',
            summary: 'Needs review',
            generatedAt: new Date('2026-02-10T00:00:00.000Z'),
            matter: { id: 'matter-1', name: 'Matter A' },
          },
        ]),
      },
      membership: {
        findMany: jest.fn().mockResolvedValue([
          {
            userId: 'user-1',
            user: { id: 'user-1', email: 'attorney@example.com' },
          },
        ]),
      },
      notification: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'notification-1' }),
      },
    } as any;

    const queue = {
      createWorker: jest.fn(),
      addJob: jest.fn(),
    } as any;

    const matterAuditSignals = {
      generateMissedValueSignals: jest.fn().mockResolvedValue({ createdCount: 1, signalIds: ['signal-1'] }),
    } as any;

    const audit = {
      appendEvent: jest.fn().mockResolvedValue(undefined),
    } as any;

    const messageDispatch = {
      sendEmail: jest.fn().mockResolvedValue({
        id: 'provider-1',
        provider: 'stub',
        status: 'sent',
      }),
    } as any;

    const service = new AuditScanSchedulerService(prisma, queue, matterAuditSignals, audit, messageDispatch);

    const run = await service.runScheduledScan('run-1');

    expect(run).toEqual(
      expect.objectContaining({
        correlationId: 'run-1',
        organizationsProcessed: 1,
        organizationsFailed: 0,
        createdSignals: 1,
        notificationsSent: 1,
        notificationsSkipped: 0,
      }),
    );
    expect(prisma.membership.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: MembershipStatus.ACTIVE,
        }),
      }),
    );
    expect(messageDispatch.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'attorney@example.com',
        idempotencyKey: 'audit-signal:signal-1:recipient:user-1',
      }),
    );
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'audit.scan.organization.completed',
      }),
    );
  });

  it('skips duplicate dispatch when idempotency key has already been recorded', async () => {
    const prisma = {
      organization: {
        findMany: jest.fn().mockResolvedValue([{ id: 'org-1' }]),
      },
      matterAuditSignal: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'signal-1',
            matterId: 'matter-1',
            title: 'Potential missed-value finding',
            summary: 'Needs review',
            generatedAt: new Date('2026-02-10T00:00:00.000Z'),
            matter: { id: 'matter-1', name: 'Matter A' },
          },
        ]),
      },
      membership: {
        findMany: jest.fn().mockResolvedValue([
          {
            userId: 'user-1',
            user: { id: 'user-1', email: 'attorney@example.com' },
          },
        ]),
      },
      notification: {
        findFirst: jest.fn().mockResolvedValue({ id: 'notification-1' }),
        create: jest.fn().mockResolvedValue({ id: 'notification-2' }),
      },
    } as any;

    const matterAuditSignals = {
      generateMissedValueSignals: jest.fn().mockResolvedValue({ createdCount: 1, signalIds: ['signal-1'] }),
    } as any;

    const service = new AuditScanSchedulerService(
      prisma,
      { createWorker: jest.fn(), addJob: jest.fn() } as any,
      matterAuditSignals,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      { sendEmail: jest.fn() } as any,
    );

    const run = await service.runScheduledScan('run-dup');

    expect(run.notificationsSent).toBe(0);
    expect(run.notificationsSkipped).toBe(1);
  });
});

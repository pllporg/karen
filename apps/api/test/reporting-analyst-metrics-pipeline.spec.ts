import { ReportingService } from '../src/reporting/reporting.service';

describe('ReportingService analystMetricsSnapshot', () => {
  it('computes scoped analyst metrics with deterministic ordering and window bounds', async () => {
    const prisma = {
      membership: {
        findMany: jest.fn().mockResolvedValue([
          { user: { id: 'user-b', fullName: 'Beta', email: 'beta@example.com' } },
          { user: { id: 'user-a', fullName: 'Alpha', email: 'alpha@example.com' } },
        ]),
      },
      task: {
        findMany: jest.fn().mockResolvedValue([
          {
            assigneeUserId: 'user-a',
            createdAt: new Date('2026-03-01T00:00:00.000Z'),
            updatedAt: new Date('2026-03-01T06:00:00.000Z'),
          },
          {
            assigneeUserId: 'user-a',
            createdAt: new Date('2026-03-01T00:00:00.000Z'),
            updatedAt: new Date('2026-03-01T03:00:00.000Z'),
          },
          {
            assigneeUserId: 'user-b',
            createdAt: new Date('2026-03-01T00:00:00.000Z'),
            updatedAt: new Date('2026-03-01T10:00:00.000Z'),
          },
        ]),
        groupBy: jest.fn().mockResolvedValue([
          { assigneeUserId: 'user-a', _count: { assigneeUserId: 3 } },
          { assigneeUserId: 'user-b', _count: { assigneeUserId: 1 } },
        ]),
      },
      timeEntry: {
        groupBy: jest.fn().mockResolvedValue([
          { userId: 'user-a', _sum: { durationMinutes: 300, amount: 500 } },
          { userId: 'user-b', _sum: { durationMinutes: 200, amount: 200 } },
        ]),
      },
      lead: {
        findMany: jest.fn().mockResolvedValue([
          {
            source: 'Partner',
            stage: 'RETAINED',
            referralContactId: 'contact-1',
            referralContact: { displayName: 'Ref Partner' },
          },
          {
            source: 'Partner',
            stage: 'NEW',
            referralContactId: 'contact-1',
            referralContact: { displayName: 'Ref Partner' },
          },
          {
            source: 'Web',
            stage: 'RETAINED',
            referralContactId: null,
            referralContact: null,
          },
        ]),
      },
      invoice: {
        findMany: jest.fn().mockResolvedValue([
          {
            matterId: 'matter-1',
            total: 1000,
            balanceDue: 400,
            matter: {
              teamMembers: [{ userId: 'user-a' }, { userId: 'user-b' }],
            },
          },
          {
            matterId: 'matter-2',
            total: 500,
            balanceDue: 0,
            matter: {
              teamMembers: [{ userId: 'user-a' }],
            },
          },
        ]),
      },
    } as any;

    const service = new ReportingService(prisma);
    const snapshot = await service.analystMetricsSnapshot('org-1', {
      asOf: new Date('2026-03-20T00:00:00.000Z'),
      windowDays: 30,
    });

    expect(prisma.membership.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { organizationId: 'org-1' } }));
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: 'org-1',
          createdAt: {
            gte: new Date('2026-02-18T00:00:00.000Z'),
            lte: new Date('2026-03-20T00:00:00.000Z'),
          },
        }),
      }),
    );

    expect(snapshot.cycleTime).toEqual([
      {
        userId: 'user-b',
        userName: 'Beta',
        userEmail: 'beta@example.com',
        completedTaskCount: 1,
        averageCycleHours: 10,
        medianCycleHours: 10,
      },
      {
        userId: 'user-a',
        userName: 'Alpha',
        userEmail: 'alpha@example.com',
        completedTaskCount: 2,
        averageCycleHours: 4.5,
        medianCycleHours: 4.5,
      },
    ]);

    expect(snapshot.turnaround).toEqual([
      {
        userId: 'user-b',
        userName: 'Beta',
        userEmail: 'beta@example.com',
        completedTaskCount: 1,
        averageTurnaroundHours: 10,
        p90TurnaroundHours: 10,
      },
      {
        userId: 'user-a',
        userName: 'Alpha',
        userEmail: 'alpha@example.com',
        completedTaskCount: 2,
        averageTurnaroundHours: 4.5,
        p90TurnaroundHours: 5.7,
      },
    ]);

    expect(snapshot.referral).toEqual([
      {
        source: 'Partner',
        referralContactId: 'contact-1',
        referralLabel: 'Ref Partner',
        leadCount: 2,
        retainedLeadCount: 1,
        retentionRate: 50,
      },
      {
        source: 'Web',
        referralContactId: null,
        referralLabel: 'Direct/Unknown',
        leadCount: 1,
        retainedLeadCount: 1,
        retentionRate: 100,
      },
    ]);

    expect(snapshot.value).toEqual([
      {
        userId: 'user-a',
        userName: 'Alpha',
        userEmail: 'alpha@example.com',
        matterCount: 2,
        timeEntryAmount: 500,
        invoicedAmount: 1000,
        collectedAmount: 800,
        totalValue: 1500,
      },
      {
        userId: 'user-b',
        userName: 'Beta',
        userEmail: 'beta@example.com',
        matterCount: 1,
        timeEntryAmount: 200,
        invoicedAmount: 500,
        collectedAmount: 300,
        totalValue: 700,
      },
    ]);
  });

  it('returns reproducible results for the same as-of input despite unsorted source rows', async () => {
    const prisma = {
      membership: {
        findMany: jest.fn().mockResolvedValue([
          { user: { id: 'user-2', fullName: null, email: 'b@example.com' } },
          { user: { id: 'user-1', fullName: null, email: 'a@example.com' } },
        ]),
      },
      task: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([
            {
              assigneeUserId: 'user-1',
              createdAt: new Date('2026-02-01T00:00:00.000Z'),
              updatedAt: new Date('2026-02-01T04:00:00.000Z'),
            },
            {
              assigneeUserId: 'user-2',
              createdAt: new Date('2026-02-01T00:00:00.000Z'),
              updatedAt: new Date('2026-02-01T02:00:00.000Z'),
            },
          ])
          .mockResolvedValueOnce([
            {
              assigneeUserId: 'user-2',
              createdAt: new Date('2026-02-01T00:00:00.000Z'),
              updatedAt: new Date('2026-02-01T02:00:00.000Z'),
            },
            {
              assigneeUserId: 'user-1',
              createdAt: new Date('2026-02-01T00:00:00.000Z'),
              updatedAt: new Date('2026-02-01T04:00:00.000Z'),
            },
          ]),
        groupBy: jest.fn().mockResolvedValue([]),
      },
      timeEntry: {
        groupBy: jest.fn().mockResolvedValue([]),
      },
      lead: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      invoice: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as any;

    const service = new ReportingService(prisma);
    const asOf = new Date('2026-02-15T00:00:00.000Z');

    const first = await service.analystMetricsSnapshot('org-repro', { asOf });
    const second = await service.analystMetricsSnapshot('org-repro', { asOf });

    expect(first).toEqual(second);
  });
});

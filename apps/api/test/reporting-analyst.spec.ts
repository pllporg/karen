import { BadRequestException } from '@nestjs/common';
import { ReportingController } from '../src/reporting/reporting.controller';
import { ReportingService } from '../src/reporting/reporting.service';

describe('Reporting analyst APIs', () => {
  describe('ReportingService analyst datasets', () => {
    it('returns bottlenecks shape and enforces organization scope in prisma queries', async () => {
      const prisma = {
        task: {
          groupBy: jest
            .fn()
            .mockResolvedValueOnce([{ matterId: 'matter-1', _count: { matterId: 2 } }])
            .mockResolvedValueOnce([
              { matterId: 'matter-1', _count: { matterId: 4 } },
              { matterId: 'matter-2', _count: { matterId: 1 } },
            ]),
        },
        matter: {
          findMany: jest.fn().mockResolvedValue([
            { id: 'matter-2', name: 'Matter Two', stage: null },
            { id: 'matter-1', name: 'Matter One', stage: { name: 'Discovery' } },
          ]),
        },
      } as any;

      const service = new ReportingService(prisma);
      const rows = await service.bottlenecks('org-a');

      expect(prisma.task.groupBy).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-a' }) }),
      );
      expect(prisma.task.groupBy).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-a' }) }),
      );
      expect(prisma.matter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-a' }) }),
      );
      expect(rows).toEqual([
        {
          matterId: 'matter-1',
          matterName: 'Matter One',
          stageName: 'Discovery',
          overdueTaskCount: 2,
          openTaskCount: 4,
        },
        {
          matterId: 'matter-2',
          matterName: 'Matter Two',
          stageName: 'Unassigned',
          overdueTaskCount: 0,
          openTaskCount: 1,
        },
      ]);
    });

    it('returns capacity shape and scoped aggregation by organization', async () => {
      const prisma = {
        task: {
          groupBy: jest
            .fn()
            .mockResolvedValue([{ assigneeUserId: 'user-2', _count: { assigneeUserId: 3 } }]),
        },
        timeEntry: {
          groupBy: jest.fn().mockResolvedValue([
            { userId: 'user-1', _sum: { durationMinutes: 60, amount: 100 } },
            { userId: 'user-2', _sum: { durationMinutes: 30, amount: 50 } },
          ]),
        },
        membership: {
          findMany: jest.fn().mockResolvedValue([
            { user: { id: 'user-1', fullName: 'A User', email: 'a@example.com' } },
            { user: { id: 'user-2', fullName: 'B User', email: 'b@example.com' } },
          ]),
        },
      } as any;

      const service = new ReportingService(prisma);
      const rows = await service.capacity('org-b');

      expect(prisma.task.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-b' }) }),
      );
      expect(prisma.timeEntry.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ organizationId: 'org-b' }) }),
      );
      expect(prisma.membership.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: 'org-b' } }),
      );
      expect(rows).toEqual([
        {
          userId: 'user-2',
          userName: 'B User',
          userEmail: 'b@example.com',
          openTaskCount: 3,
          billedMinutes: 30,
          billedAmount: 50,
        },
        {
          userId: 'user-1',
          userName: 'A User',
          userEmail: 'a@example.com',
          openTaskCount: 0,
          billedMinutes: 60,
          billedAmount: 100,
        },
      ]);
    });

    it('returns growth dataset in ascending month order', async () => {
      const prisma = {
        matter: {
          findMany: jest.fn().mockResolvedValue([
            { openedAt: new Date('2026-01-12T00:00:00.000Z') },
            { openedAt: new Date('2026-01-20T00:00:00.000Z') },
            { openedAt: new Date('2026-02-05T00:00:00.000Z') },
          ]),
        },
      } as any;

      const service = new ReportingService(prisma);
      const rows = await service.growth('org-c');

      expect(prisma.matter.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { organizationId: 'org-c' } }),
      );
      expect(rows).toEqual([
        { month: '2026-01', mattersOpened: 2, cumulativeMatters: 2 },
        { month: '2026-02', mattersOpened: 1, cumulativeMatters: 3 },
      ]);
    });
  });

  describe('ReportingController analyst CSV', () => {
    it('uses tenant-scoped analyst report and returns deterministic CSV columns + content', async () => {
      const service = {
        bottlenecks: jest.fn().mockResolvedValue([
          {
            matterId: 'matter-1',
            matterName: 'Matter One',
            stageName: 'Discovery',
            overdueTaskCount: 2,
            openTaskCount: 4,
          },
        ]),
        capacity: jest.fn(),
        growth: jest.fn(),
        toCsv: jest.fn().mockReturnValue('matterId,matterName,stageName,overdueTaskCount,openTaskCount\nmatter-1,Matter One,Discovery,2,4\n'),
      } as any;
      const controller = new ReportingController(service);

      const res = {
        setHeader: jest.fn(),
        send: jest.fn(),
      } as any;

      await controller.analystCsv({ organizationId: 'org-csv' } as any, 'bottlenecks', res);

      expect(service.bottlenecks).toHaveBeenCalledWith('org-csv');
      expect(service.toCsv).toHaveBeenCalledWith(
        expect.any(Array),
        ['matterId', 'matterName', 'stageName', 'overdueTaskCount', 'openTaskCount'],
      );
      expect(res.setHeader).toHaveBeenCalledWith('content-type', 'text/csv');
      expect(res.setHeader).toHaveBeenCalledWith('content-disposition', 'attachment; filename="analyst-bottlenecks.csv"');
      expect(res.send).toHaveBeenCalledWith(
        'matterId,matterName,stageName,overdueTaskCount,openTaskCount\nmatter-1,Matter One,Discovery,2,4\n',
      );
    });

    it('rejects analyst CSV requests with an unsupported report value', async () => {
      const controller = new ReportingController({} as ReportingService);

      await expect(
        controller.analystCsv({ organizationId: 'org-x' } as any, 'invalid', { setHeader: jest.fn(), send: jest.fn() } as any),
      ).rejects.toBeInstanceOf(BadRequestException);
    });
  });
});

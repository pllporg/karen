import { Injectable } from '@nestjs/common';
import { stringify } from 'csv-stringify/sync';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  async bottlenecks(organizationId: string) {
    const now = new Date();
    const [overdueByMatter, openByMatter] = await Promise.all([
      this.prisma.task.groupBy({
        by: ['matterId'],
        where: {
          organizationId,
          dueAt: { lt: now },
          status: { not: 'DONE' },
        },
        _count: { matterId: true },
      }),
      this.prisma.task.groupBy({
        by: ['matterId'],
        where: {
          organizationId,
          status: { not: 'DONE' },
        },
        _count: { matterId: true },
      }),
    ]);

    const matterIds = Array.from(new Set([...overdueByMatter.map((row) => row.matterId), ...openByMatter.map((row) => row.matterId)]));
    const matters =
      matterIds.length === 0
        ? []
        : await this.prisma.matter.findMany({
            where: { organizationId, id: { in: matterIds } },
            include: { stage: true },
          });

    const overdueMap = new Map(overdueByMatter.map((row) => [row.matterId, row._count.matterId]));
    const openMap = new Map(openByMatter.map((row) => [row.matterId, row._count.matterId]));

    return matters
      .map((matter) => ({
        matterId: matter.id,
        matterName: matter.name,
        stageName: matter.stage?.name ?? 'Unassigned',
        overdueTaskCount: overdueMap.get(matter.id) ?? 0,
        openTaskCount: openMap.get(matter.id) ?? 0,
      }))
      .sort((a, b) => b.overdueTaskCount - a.overdueTaskCount || b.openTaskCount - a.openTaskCount || a.matterId.localeCompare(b.matterId));
  }

  async capacity(organizationId: string) {
    const [tasksByAssignee, timeByAssignee, memberships] = await Promise.all([
      this.prisma.task.groupBy({
        by: ['assigneeUserId'],
        where: {
          organizationId,
          status: { not: 'DONE' },
        },
        _count: { assigneeUserId: true },
      }),
      this.prisma.timeEntry.groupBy({
        by: ['userId'],
        where: { organizationId },
        _sum: {
          durationMinutes: true,
          amount: true,
        },
      }),
      this.prisma.membership.findMany({
        where: { organizationId },
        select: { user: { select: { id: true, fullName: true, email: true } } },
      }),
    ]);

    const taskCountByAssignee = new Map(tasksByAssignee.map((row) => [row.assigneeUserId ?? null, row._count.assigneeUserId]));
    const timeByUser = new Map(
      timeByAssignee.map((row) => [row.userId ?? null, { billedMinutes: row._sum.durationMinutes ?? 0, billedAmount: row._sum.amount ?? 0 }]),
    );

    return memberships
      .map(({ user }) => ({
        userId: user.id,
        userName: user.fullName ?? user.email,
        userEmail: user.email,
        openTaskCount: taskCountByAssignee.get(user.id) ?? 0,
        billedMinutes: timeByUser.get(user.id)?.billedMinutes ?? 0,
        billedAmount: timeByUser.get(user.id)?.billedAmount ?? 0,
      }))
      .sort((a, b) => b.openTaskCount - a.openTaskCount || b.billedMinutes - a.billedMinutes || a.userId.localeCompare(b.userId));
  }

  async growth(organizationId: string) {
    const matters = await this.prisma.matter.findMany({
      where: { organizationId },
      select: { openedAt: true },
      orderBy: { openedAt: 'asc' },
    });

    const monthlyCount = new Map<string, number>();
    for (const matter of matters) {
      const month = matter.openedAt.toISOString().slice(0, 7);
      monthlyCount.set(month, (monthlyCount.get(month) ?? 0) + 1);
    }

    let cumulativeMatters = 0;
    return Array.from(monthlyCount.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, mattersOpened]) => {
        cumulativeMatters += mattersOpened;
        return {
          month,
          mattersOpened,
          cumulativeMatters,
        };
      });
  }

  async mattersByStage(organizationId: string) {
    const rows = await this.prisma.matter.groupBy({
      by: ['stageId'],
      where: { organizationId },
      _count: { stageId: true },
    });

    const stages = await this.prisma.matterStage.findMany({ where: { organizationId } });
    return rows.map((row) => ({
      stageId: row.stageId,
      stageName: stages.find((s) => s.id === row.stageId)?.name ?? 'Unassigned',
      count: row._count.stageId,
    }));
  }

  async upcomingDeadlines(organizationId: string, days = 30) {
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    return this.prisma.task.findMany({
      where: {
        organizationId,
        dueAt: {
          gte: new Date(),
          lte: until,
        },
      },
      include: { matter: true },
      orderBy: { dueAt: 'asc' },
    });
  }

  async wip(organizationId: string) {
    return this.prisma.timeEntry.groupBy({
      by: ['matterId'],
      where: { organizationId },
      _sum: {
        amount: true,
        durationMinutes: true,
      },
    });
  }

  async arAging(organizationId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        organizationId,
        balanceDue: { gt: 0 },
      },
      include: {
        matter: true,
      },
    });

    const now = Date.now();
    return invoices.map((invoice) => {
      const dueTime = invoice.dueAt?.getTime() ?? invoice.issuedAt.getTime();
      const ageDays = Math.max(0, Math.floor((now - dueTime) / (24 * 60 * 60 * 1000)));
      return {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        matterId: invoice.matterId,
        matterName: invoice.matter.name,
        balanceDue: invoice.balanceDue,
        ageDays,
        bucket: ageDays <= 30 ? '0-30' : ageDays <= 60 ? '31-60' : ageDays <= 90 ? '61-90' : '90+',
      };
    });
  }

  toCsv(rows: object[], columns?: string[]): string {
    if (rows.length === 0) return '';
    const csvColumns = columns ?? Object.keys(rows[0]);
    return stringify(rows, {
      header: true,
      columns: csvColumns,
      cast: {
        object: (value) => JSON.stringify(value),
      },
    });
  }
}

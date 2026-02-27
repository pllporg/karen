import { Injectable } from '@nestjs/common';
import { stringify } from 'csv-stringify/sync';
import { PrismaService } from '../prisma/prisma.service';

type AnalystMetricOptions = {
  asOf?: Date;
  windowDays?: number;
};

type AnalystSummary = {
  userId: string;
  userName: string;
  userEmail: string;
};

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

  private toHours(milliseconds: number): number {
    return milliseconds / (1000 * 60 * 60);
  }

  private round(value: number, decimals = 2): number {
    return Number(value.toFixed(decimals));
  }

  private percentile(sortedValues: number[], quantile: number): number {
    if (sortedValues.length === 0) return 0;
    if (sortedValues.length === 1) return sortedValues[0];
    const position = (sortedValues.length - 1) * quantile;
    const lowerIndex = Math.floor(position);
    const upperIndex = Math.ceil(position);
    if (lowerIndex === upperIndex) return sortedValues[lowerIndex];
    const lower = sortedValues[lowerIndex];
    const upper = sortedValues[upperIndex];
    return lower + (upper - lower) * (position - lowerIndex);
  }

  private summarizeMembers(
    memberships: Array<{ user: { id: string; fullName: string | null; email: string } }>,
  ): Map<string, AnalystSummary> {
    return new Map(
      memberships.map(({ user }) => [
        user.id,
        {
          userId: user.id,
          userName: user.fullName ?? user.email,
          userEmail: user.email,
        },
      ]),
    );
  }

  async analystMetricsSnapshot(organizationId: string, options: AnalystMetricOptions = {}) {
    const asOf = options.asOf ?? new Date();
    const windowDays = options.windowDays ?? 90;
    const windowStart = new Date(asOf.getTime() - windowDays * 24 * 60 * 60 * 1000);

    const [memberships, completedTasks, openTasksByAssignee, timeByAssignee, leads, invoices] = await Promise.all([
      this.prisma.membership.findMany({
        where: { organizationId },
        select: { user: { select: { id: true, fullName: true, email: true } } },
        orderBy: [{ user: { fullName: 'asc' } }, { user: { email: 'asc' } }, { user: { id: 'asc' } }],
      }),
      this.prisma.task.findMany({
        where: {
          organizationId,
          status: 'DONE',
          createdAt: { gte: windowStart, lte: asOf },
          updatedAt: { lte: asOf },
        },
        select: { assigneeUserId: true, createdAt: true, updatedAt: true },
        orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.task.groupBy({
        by: ['assigneeUserId'],
        where: {
          organizationId,
          status: { not: 'DONE' },
          createdAt: { lte: asOf },
        },
        _count: { assigneeUserId: true },
      }),
      this.prisma.timeEntry.groupBy({
        by: ['userId'],
        where: {
          organizationId,
          startedAt: { gte: windowStart, lte: asOf },
        },
        _sum: {
          durationMinutes: true,
          amount: true,
        },
      }),
      this.prisma.lead.findMany({
        where: {
          organizationId,
          createdAt: { gte: windowStart, lte: asOf },
        },
        select: {
          source: true,
          stage: true,
          referralContactId: true,
          referralContact: { select: { displayName: true } },
        },
        orderBy: [{ source: 'asc' }, { referralContactId: 'asc' }, { id: 'asc' }],
      }),
      this.prisma.invoice.findMany({
        where: {
          organizationId,
          issuedAt: { gte: windowStart, lte: asOf },
        },
        select: {
          matterId: true,
          total: true,
          balanceDue: true,
          matter: {
            select: {
              teamMembers: {
                select: {
                  userId: true,
                },
              },
            },
          },
        },
        orderBy: [{ issuedAt: 'asc' }, { id: 'asc' }],
      }),
    ]);

    const memberSummary = this.summarizeMembers(memberships);
    const cycleBuckets = new Map<string, number[]>();
    for (const task of completedTasks) {
      if (!task.assigneeUserId) continue;
      const durationHours = this.toHours(task.updatedAt.getTime() - task.createdAt.getTime());
      if (durationHours < 0) continue;
      const current = cycleBuckets.get(task.assigneeUserId) ?? [];
      current.push(durationHours);
      cycleBuckets.set(task.assigneeUserId, current);
    }

    const cycleTime = Array.from(cycleBuckets.entries())
      .map(([userId, values]) => {
        const sorted = [...values].sort((a, b) => a - b);
        const summary =
          memberSummary.get(userId) ??
          ({ userId, userName: userId, userEmail: `${userId}@unknown.invalid` } satisfies AnalystSummary);
        return {
          ...summary,
          completedTaskCount: sorted.length,
          averageCycleHours: this.round(sorted.reduce((sum, value) => sum + value, 0) / sorted.length),
          medianCycleHours: this.round(this.percentile(sorted, 0.5)),
        };
      })
      .sort(
        (a, b) =>
          b.averageCycleHours - a.averageCycleHours ||
          b.completedTaskCount - a.completedTaskCount ||
          a.userId.localeCompare(b.userId),
      );

    const turnaround = Array.from(cycleBuckets.entries())
      .map(([userId, values]) => {
        const sorted = [...values].sort((a, b) => a - b);
        const summary =
          memberSummary.get(userId) ??
          ({ userId, userName: userId, userEmail: `${userId}@unknown.invalid` } satisfies AnalystSummary);
        return {
          ...summary,
          completedTaskCount: sorted.length,
          averageTurnaroundHours: this.round(sorted.reduce((sum, value) => sum + value, 0) / sorted.length),
          p90TurnaroundHours: this.round(this.percentile(sorted, 0.9)),
        };
      })
      .sort(
        (a, b) =>
          b.p90TurnaroundHours - a.p90TurnaroundHours ||
          b.completedTaskCount - a.completedTaskCount ||
          a.userId.localeCompare(b.userId),
      );

    const taskCountByAssignee = new Map(openTasksByAssignee.map((row) => [row.assigneeUserId ?? '', row._count.assigneeUserId]));
    const timeByUser = new Map(
      timeByAssignee.map((row) => [row.userId ?? '', { billedMinutes: row._sum.durationMinutes ?? 0, billedAmount: row._sum.amount ?? 0 }]),
    );
    const capacity = memberships
      .map(({ user }) => {
        const openTaskCount = taskCountByAssignee.get(user.id) ?? 0;
        const billedMinutes = timeByUser.get(user.id)?.billedMinutes ?? 0;
        const billedAmount = timeByUser.get(user.id)?.billedAmount ?? 0;
        return {
          userId: user.id,
          userName: user.fullName ?? user.email,
          userEmail: user.email,
          openTaskCount,
          billedMinutes,
          billedAmount: this.round(billedAmount),
          utilizationScore: this.round((billedMinutes / Math.max(1, windowDays * 8 * 60)) * 100),
        };
      })
      .sort((a, b) => b.utilizationScore - a.utilizationScore || b.openTaskCount - a.openTaskCount || a.userId.localeCompare(b.userId));

    const referralBuckets = new Map<string, { source: string; referralContactId: string | null; referralLabel: string; leadCount: number; retainedLeadCount: number }>();
    for (const lead of leads) {
      const key = `${lead.source}::${lead.referralContactId ?? ''}`;
      const existing = referralBuckets.get(key) ?? {
        source: lead.source,
        referralContactId: lead.referralContactId,
        referralLabel: lead.referralContact?.displayName ?? 'Direct/Unknown',
        leadCount: 0,
        retainedLeadCount: 0,
      };
      existing.leadCount += 1;
      if (lead.stage === 'RETAINED') existing.retainedLeadCount += 1;
      referralBuckets.set(key, existing);
    }
    const referral = Array.from(referralBuckets.values())
      .map((row) => ({
        ...row,
        retentionRate: this.round((row.retainedLeadCount / Math.max(1, row.leadCount)) * 100),
      }))
      .sort((a, b) => b.leadCount - a.leadCount || b.retentionRate - a.retentionRate || a.source.localeCompare(b.source) || (a.referralContactId ?? '').localeCompare(b.referralContactId ?? ''));

    const valueByUser = new Map<string, { invoicedAmount: number; collectedAmount: number; matters: Set<string> }>();
    for (const invoice of invoices) {
      const teamMemberUserIds = Array.from(new Set(invoice.matter.teamMembers.map((member) => member.userId))).sort((a, b) => a.localeCompare(b));
      if (teamMemberUserIds.length === 0) continue;
      const apportionedTotal = invoice.total / teamMemberUserIds.length;
      const apportionedCollected = (invoice.total - invoice.balanceDue) / teamMemberUserIds.length;
      for (const userId of teamMemberUserIds) {
        const existing = valueByUser.get(userId) ?? { invoicedAmount: 0, collectedAmount: 0, matters: new Set<string>() };
        existing.invoicedAmount += apportionedTotal;
        existing.collectedAmount += apportionedCollected;
        existing.matters.add(invoice.matterId);
        valueByUser.set(userId, existing);
      }
    }

    const value = memberships
      .map(({ user }) => {
        const summary = valueByUser.get(user.id);
        const invoicedAmount = summary?.invoicedAmount ?? 0;
        const collectedAmount = summary?.collectedAmount ?? 0;
        const timeAmount = timeByUser.get(user.id)?.billedAmount ?? 0;
        return {
          userId: user.id,
          userName: user.fullName ?? user.email,
          userEmail: user.email,
          matterCount: summary?.matters.size ?? 0,
          timeEntryAmount: this.round(timeAmount),
          invoicedAmount: this.round(invoicedAmount),
          collectedAmount: this.round(collectedAmount),
          totalValue: this.round(invoicedAmount + timeAmount),
        };
      })
      .sort((a, b) => b.totalValue - a.totalValue || b.matterCount - a.matterCount || a.userId.localeCompare(b.userId));

    return {
      organizationId,
      asOf: asOf.toISOString(),
      windowStart: windowStart.toISOString(),
      windowDays,
      cycleTime,
      turnaround,
      capacity,
      referral,
      value,
    };
  }

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

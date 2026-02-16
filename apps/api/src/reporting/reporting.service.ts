import { Injectable } from '@nestjs/common';
import { stringify } from 'csv-stringify/sync';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportingService {
  constructor(private readonly prisma: PrismaService) {}

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

  toCsv(rows: object[]): string {
    if (rows.length === 0) return '';
    return stringify(rows, {
      header: true,
      columns: Object.keys(rows[0]),
      cast: {
        object: (value) => JSON.stringify(value),
      },
    });
  }
}

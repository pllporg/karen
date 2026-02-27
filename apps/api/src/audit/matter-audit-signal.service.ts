import { Injectable } from '@nestjs/common';
import { MatterAuditSignalReviewState, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';

type MonitorRiskLevel = 'none' | 'warning' | 'critical' | 'overdue';

type MatterMovementMonitor = {
  matterId: string;
  matterName: string;
  lastMovementAt: string;
  stalenessDays: number;
  stale: boolean;
  nearestDeadlineAt: string | null;
  deadlineRisk: MonitorRiskLevel;
  nearestStatuteAt: string | null;
  statuteRisk: MonitorRiskLevel;
};

type MonitorThresholds = {
  stalenessDays: number;
  deadlineWarningDays: number;
  deadlineCriticalDays: number;
  statuteWarningDays: number;
  statuteCriticalDays: number;
};

@Injectable()
export class MatterAuditSignalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async generateMissedValueSignals(input: {
    organizationId: string;
    actorUserId?: string;
    matterId?: string;
    limit?: number;
  }) {
    const logs = await this.prisma.aiExecutionLog.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.matterId ? { aiJob: { matterId: input.matterId } } : {}),
      },
      include: {
        aiJob: {
          select: { id: true, matterId: true, toolName: true },
        },
      },
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      take: input.limit ?? 100,
    });

    const createdSignals: Array<{ id: string }> = [];

    for (const log of logs) {
      const citations = this.extractCitations(log.sourceRefsJson);
      if (citations.length === 0) {
        continue;
      }

      const signalKey = `missed-value:${log.aiJobId}`;

      const existing = await this.prisma.matterAuditSignal.findUnique({
        where: {
          organizationId_signalKey: {
            organizationId: input.organizationId,
            signalKey,
          },
        },
        select: { id: true },
      });

      if (existing) {
        continue;
      }

      const created = await this.prisma.matterAuditSignal.create({
        data: {
          organizationId: input.organizationId,
          matterId: log.aiJob.matterId,
          signalKey,
          signalType: 'auditor.missed_value',
          title: 'Potential missed-value finding',
          summary: `AI tool ${log.aiJob.toolName} produced source-backed output that may need auditor follow-up.`,
          citationsJson: citations as unknown as Prisma.InputJsonValue,
          generatedAt: log.createdAt,
        },
        select: { id: true },
      });

      createdSignals.push({ id: created.id });
      await this.audit.appendEvent({
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        action: 'matter_audit_signal.created',
        entityType: 'MatterAuditSignal',
        entityId: created.id,
        metadata: {
          signalType: 'auditor.missed_value',
          citations,
        },
      });
    }

    return {
      createdCount: createdSignals.length,
      signalIds: createdSignals.map((signal) => signal.id),
    };
  }

  async generateMovementRiskSignals(input: {
    organizationId: string;
    actorUserId?: string;
    matterId?: string;
    limit?: number;
    asOf?: Date;
  }) {
    const monitors = await this.listMovementMonitors({
      organizationId: input.organizationId,
      matterId: input.matterId,
      limit: input.limit,
      asOf: input.asOf,
    });

    const createdSignals: string[] = [];

    for (const monitor of monitors.monitors) {
      if (monitor.stale) {
        const signalId = await this.createMonitorSignal({
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          matterId: monitor.matterId,
          signalKey: `movement-stale:${monitor.matterId}:${monitor.lastMovementAt}`,
          signalType: 'auditor.movement_stale',
          title: 'Matter movement is stale',
          summary: `${monitor.matterName} has no recorded movement for ${monitor.stalenessDays} day(s).`,
          citations: [
            `lastMovementAt:${monitor.lastMovementAt}`,
            `stalenessDays:${String(monitor.stalenessDays)}`,
          ],
        });
        if (signalId) createdSignals.push(signalId);
      }

      if (monitor.deadlineRisk !== 'none' && monitor.nearestDeadlineAt) {
        const signalId = await this.createMonitorSignal({
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          matterId: monitor.matterId,
          signalKey: `deadline-risk:${monitor.matterId}:${monitor.nearestDeadlineAt}:${monitor.deadlineRisk}`,
          signalType: 'auditor.deadline_risk',
          title: 'Upcoming deadline risk detected',
          summary: `${monitor.matterName} has a ${monitor.deadlineRisk} deadline risk at ${monitor.nearestDeadlineAt}.`,
          citations: [
            `nearestDeadlineAt:${monitor.nearestDeadlineAt}`,
            `deadlineRisk:${monitor.deadlineRisk}`,
          ],
        });
        if (signalId) createdSignals.push(signalId);
      }

      if (monitor.statuteRisk !== 'none' && monitor.nearestStatuteAt) {
        const signalId = await this.createMonitorSignal({
          organizationId: input.organizationId,
          actorUserId: input.actorUserId,
          matterId: monitor.matterId,
          signalKey: `statute-risk:${monitor.matterId}:${monitor.nearestStatuteAt}:${monitor.statuteRisk}`,
          signalType: 'auditor.statute_risk',
          title: 'Statute risk detected',
          summary: `${monitor.matterName} has a ${monitor.statuteRisk} statute risk at ${monitor.nearestStatuteAt}.`,
          citations: [
            `nearestStatuteAt:${monitor.nearestStatuteAt}`,
            `statuteRisk:${monitor.statuteRisk}`,
          ],
        });
        if (signalId) createdSignals.push(signalId);
      }
    }

    return {
      createdCount: createdSignals.length,
      signalIds: createdSignals,
      monitoredMatterCount: monitors.monitors.length,
      thresholds: monitors.thresholds,
      asOf: monitors.asOf,
    };
  }

  async listMovementMonitors(input: { organizationId: string; matterId?: string; limit?: number; asOf?: Date }) {
    const asOf = input.asOf ?? new Date();
    const thresholds = this.readThresholds();
    const matters = await this.prisma.matter.findMany({
      where: {
        organizationId: input.organizationId,
        status: 'OPEN',
        ...(input.matterId ? { id: input.matterId } : {}),
      },
      select: {
        id: true,
        name: true,
        openedAt: true,
        updatedAt: true,
        tasks: {
          where: {
            dueAt: { not: null },
            status: { not: 'DONE' },
          },
          select: {
            id: true,
            title: true,
            description: true,
            dueAt: true,
            updatedAt: true,
          },
          orderBy: [{ dueAt: 'asc' }, { id: 'asc' }],
          take: 10,
        },
        serviceEvents: {
          select: { occurredAt: true },
          orderBy: [{ occurredAt: 'desc' }],
          take: 1,
        },
        docketEntries: {
          select: { filedAt: true },
          orderBy: [{ filedAt: 'desc' }],
          take: 1,
        },
        calendarEvents: {
          where: { startAt: { gte: new Date(asOf.getTime() - 24 * 60 * 60_000) } },
          select: {
            id: true,
            startAt: true,
            type: true,
            description: true,
          },
          orderBy: [{ startAt: 'asc' }, { id: 'asc' }],
          take: 10,
        },
      },
      orderBy: [{ updatedAt: 'asc' }, { id: 'asc' }],
      take: input.limit ?? 100,
    });

    const monitors: MatterMovementMonitor[] = matters.map((matter) => {
      const lastMovementAt = this.maxDate([
        matter.openedAt,
        matter.updatedAt,
        matter.serviceEvents[0]?.occurredAt,
        matter.docketEntries[0]?.filedAt,
        matter.tasks[0]?.updatedAt,
        matter.calendarEvents[0]?.startAt,
      ]);
      const stalenessDays = this.diffDays(asOf, lastMovementAt);

      const nearestDeadlineAt = this.pickNearestFutureDate([
        ...matter.tasks.map((task) => task.dueAt).filter((value): value is Date => Boolean(value)),
        ...matter.calendarEvents.map((event) => event.startAt),
      ]);
      const deadlineRisk = this.computeDeadlineRisk(nearestDeadlineAt, asOf, thresholds.deadlineWarningDays, thresholds.deadlineCriticalDays);

      const nearestStatuteAt = this.pickNearestFutureDate([
        ...matter.tasks
          .filter((task) => this.looksLikeStatuteText(`${task.title} ${task.description ?? ''}`))
          .map((task) => task.dueAt)
          .filter((value): value is Date => Boolean(value)),
        ...matter.calendarEvents
          .filter((event) => this.looksLikeStatuteText(`${event.type} ${event.description ?? ''}`))
          .map((event) => event.startAt),
      ]);
      const statuteRisk = this.computeDeadlineRisk(nearestStatuteAt, asOf, thresholds.statuteWarningDays, thresholds.statuteCriticalDays);

      return {
        matterId: matter.id,
        matterName: matter.name,
        lastMovementAt: lastMovementAt.toISOString(),
        stalenessDays,
        stale: stalenessDays >= thresholds.stalenessDays,
        nearestDeadlineAt: nearestDeadlineAt?.toISOString() ?? null,
        deadlineRisk,
        nearestStatuteAt: nearestStatuteAt?.toISOString() ?? null,
        statuteRisk,
      };
    });

    return {
      asOf: asOf.toISOString(),
      thresholds,
      monitors,
    };
  }

  async listSignals(input: {
    organizationId: string;
    reviewState?: MatterAuditSignalReviewState;
    matterId?: string;
    limit?: number;
  }) {
    return this.prisma.matterAuditSignal.findMany({
      where: {
        organizationId: input.organizationId,
        ...(input.reviewState ? { reviewState: input.reviewState } : {}),
        ...(input.matterId ? { matterId: input.matterId } : {}),
      },
      orderBy: [{ generatedAt: 'asc' }, { id: 'asc' }],
      take: input.limit ?? 100,
    });
  }

  async updateReviewState(input: {
    organizationId: string;
    actorUserId: string;
    signalId: string;
    reviewState: MatterAuditSignalReviewState;
    reviewNotes?: string;
  }) {
    const existing = await this.prisma.matterAuditSignal.findFirstOrThrow({
      where: {
        id: input.signalId,
        organizationId: input.organizationId,
      },
    });

    const updated = await this.prisma.matterAuditSignal.update({
      where: { id: existing.id },
      data: {
        reviewState: input.reviewState,
        reviewNotes: input.reviewNotes,
        reviewedByUserId: input.actorUserId,
        reviewStateChangedAt: new Date(),
      },
    });

    await this.audit.appendEvent({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: 'matter_audit_signal.updated',
      entityType: 'MatterAuditSignal',
      entityId: updated.id,
      metadata: {
        previousReviewState: existing.reviewState,
        reviewState: updated.reviewState,
      },
    });

    return updated;
  }

  private extractCitations(sourceRefsJson: Prisma.JsonValue | null): string[] {
    if (!Array.isArray(sourceRefsJson)) {
      return [];
    }

    const citationSet = new Set<string>();

    for (const entry of sourceRefsJson) {
      if (!entry || typeof entry !== 'object') {
        continue;
      }

      const chunkId = (entry as Record<string, unknown>).chunkId;
      if (typeof chunkId === 'string' && chunkId.trim().length > 0) {
        citationSet.add(chunkId.trim());
      }
    }

    return Array.from(citationSet).sort((a, b) => a.localeCompare(b));
  }

  private async createMonitorSignal(input: {
    organizationId: string;
    actorUserId?: string;
    matterId: string;
    signalKey: string;
    signalType: string;
    title: string;
    summary: string;
    citations: string[];
  }) {
    const existing = await this.prisma.matterAuditSignal.findUnique({
      where: {
        organizationId_signalKey: {
          organizationId: input.organizationId,
          signalKey: input.signalKey,
        },
      },
      select: { id: true },
    });

    if (existing) {
      return null;
    }

    const created = await this.prisma.matterAuditSignal.create({
      data: {
        organizationId: input.organizationId,
        matterId: input.matterId,
        signalKey: input.signalKey,
        signalType: input.signalType,
        title: input.title,
        summary: input.summary,
        citationsJson: input.citations as unknown as Prisma.InputJsonValue,
        generatedAt: new Date(),
      },
      select: { id: true },
    });

    await this.audit.appendEvent({
      organizationId: input.organizationId,
      actorUserId: input.actorUserId,
      action: 'matter_audit_signal.created',
      entityType: 'MatterAuditSignal',
      entityId: created.id,
      metadata: {
        signalType: input.signalType,
        citations: input.citations,
      },
    });

    return created.id;
  }

  private readThresholds(): MonitorThresholds {
    const deadlineWarningDays = this.readIntEnv('AUDITOR_MONITOR_DEADLINE_WARNING_DAYS', 14, 1, 365);
    const deadlineCriticalDays = this.readIntEnv('AUDITOR_MONITOR_DEADLINE_CRITICAL_DAYS', 3, 0, deadlineWarningDays);
    const statuteWarningDays = this.readIntEnv('AUDITOR_MONITOR_STATUTE_WARNING_DAYS', 30, 1, 730);
    const statuteCriticalDays = this.readIntEnv('AUDITOR_MONITOR_STATUTE_CRITICAL_DAYS', 7, 0, statuteWarningDays);

    return {
      stalenessDays: this.readIntEnv('AUDITOR_MONITOR_STALENESS_DAYS', 21, 1, 365),
      deadlineWarningDays,
      deadlineCriticalDays,
      statuteWarningDays,
      statuteCriticalDays,
    };
  }

  private readIntEnv(key: string, fallback: number, min: number, max: number) {
    const raw = process.env[key];
    if (!raw) {
      return fallback;
    }

    const value = Number.parseInt(raw, 10);
    if (!Number.isFinite(value)) {
      return fallback;
    }

    return Math.min(max, Math.max(min, value));
  }

  private diffDays(later: Date, earlier: Date) {
    return Math.floor((later.getTime() - earlier.getTime()) / (24 * 60 * 60_000));
  }

  private pickNearestFutureDate(dates: Date[]) {
    return dates
      .slice()
      .sort((a, b) => a.getTime() - b.getTime())
      .find(() => true);
  }

  private computeDeadlineRisk(targetDate: Date | undefined, asOf: Date, warningDays: number, criticalDays: number): MonitorRiskLevel {
    if (!targetDate) {
      return 'none';
    }

    const daysRemaining = this.diffDays(targetDate, asOf);
    if (daysRemaining < 0) {
      return 'overdue';
    }
    if (daysRemaining <= criticalDays) {
      return 'critical';
    }
    if (daysRemaining <= warningDays) {
      return 'warning';
    }
    return 'none';
  }

  private maxDate(values: Array<Date | undefined>) {
    return values.reduce<Date>((max, value) => {
      if (!value) {
        return max;
      }
      return value.getTime() > max.getTime() ? value : max;
    }, new Date(0));
  }

  private looksLikeStatuteText(value: string) {
    return /\b(statute|limitations|limitation|sol)\b/i.test(value);
  }
}

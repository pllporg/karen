import { Injectable } from '@nestjs/common';
import { MatterAuditSignalReviewState, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from './audit.service';

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
}

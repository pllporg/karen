import { Injectable, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { sha256 } from '../common/utils/hash.util';
import { WebhooksService } from '../webhooks/webhooks.service';

@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly webhooks?: WebhooksService,
  ) {}

  async appendEvent(input: {
    organizationId: string;
    actorUserId?: string;
    action: string;
    entityType: string;
    entityId: string;
    metadata?: unknown;
  }) {
    const previous = await this.prisma.auditLogEvent.findFirst({
      where: { organizationId: input.organizationId },
      orderBy: { createdAt: 'desc' },
    });

    const payload = JSON.stringify({
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata ?? null,
    });

    const previousHash = previous?.eventHash ?? null;
    const eventHash = sha256(`${previousHash ?? ''}|${payload}|${Date.now()}`);

    const event = await this.prisma.auditLogEvent.create({
      data: {
        organizationId: input.organizationId,
        actorUserId: input.actorUserId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadataJson: input.metadata as object | undefined,
        previousHash,
        eventHash,
      },
    });

    if (this.webhooks) {
      if (input.action.includes('created')) {
        await this.webhooks.emit(input.organizationId, 'record.created', {
          entityType: input.entityType,
          entityId: input.entityId,
          action: input.action,
        });
      }
      if (input.action.includes('updated')) {
        await this.webhooks.emit(input.organizationId, 'record.updated', {
          entityType: input.entityType,
          entityId: input.entityId,
          action: input.action,
        });
      }
    }

    return event;
  }

  async listByOrganization(organizationId: string, limit = 100) {
    return this.prisma.auditLogEvent.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }
}

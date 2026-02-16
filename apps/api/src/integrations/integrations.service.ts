import { Injectable } from '@nestjs/common';
import { IntegrationConnectionStatus, IntegrationProvider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/types';
import { toJsonValueOrUndefined } from '../common/utils/json.util';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async list(user: AuthenticatedUser) {
    return this.prisma.integrationConnection.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(input: {
    user: AuthenticatedUser;
    provider: IntegrationProvider;
    name: string;
    encryptedAccessToken?: string;
    encryptedRefreshToken?: string;
    scopes?: string[];
    config?: Record<string, unknown>;
  }) {
    const connection = await this.prisma.integrationConnection.create({
      data: {
        organizationId: input.user.organizationId,
        provider: input.provider,
        name: input.name,
        status: IntegrationConnectionStatus.CONNECTED,
        encryptedAccessToken: input.encryptedAccessToken,
        encryptedRefreshToken: input.encryptedRefreshToken,
        scopes: input.scopes ?? [],
        configJson: toJsonValueOrUndefined(input.config),
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'integration.connection.created',
      entityType: 'integrationConnection',
      entityId: connection.id,
      metadata: { provider: input.provider },
    });

    return connection;
  }

  async triggerSync(input: {
    user: AuthenticatedUser;
    connectionId: string;
    idempotencyKey: string;
  }) {
    const connection = await this.prisma.integrationConnection.findFirst({
      where: {
        id: input.connectionId,
        organizationId: input.user.organizationId,
      },
    });

    if (!connection) throw new Error('Integration connection not found');

    const existing = await this.prisma.integrationSyncRun.findUnique({
      where: {
        connectionId_idempotencyKey: {
          connectionId: connection.id,
          idempotencyKey: input.idempotencyKey,
        },
      },
    });

    if (existing) {
      return existing;
    }

    const run = await this.prisma.integrationSyncRun.create({
      data: {
        organizationId: input.user.organizationId,
        connectionId: connection.id,
        idempotencyKey: input.idempotencyKey,
        status: 'QUEUED',
      },
    });

    return run;
  }

  async subscribeWebhook(input: {
    user: AuthenticatedUser;
    connectionId: string;
    event: string;
    targetUrl: string;
  }) {
    const connection = await this.prisma.integrationConnection.findFirst({
      where: {
        id: input.connectionId,
        organizationId: input.user.organizationId,
      },
    });
    if (!connection) throw new Error('Integration connection not found');

    return this.prisma.integrationWebhookSubscription.create({
      data: {
        organizationId: input.user.organizationId,
        connectionId: connection.id,
        event: input.event,
        targetUrl: input.targetUrl,
        status: 'ACTIVE',
      },
    });
  }
}

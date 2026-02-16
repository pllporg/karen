import { Injectable } from '@nestjs/common';
import { IntegrationConnectionStatus, IntegrationProvider } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/types';
import { toJsonValueOrUndefined } from '../common/utils/json.util';
import { IntegrationTokenCryptoService } from './integration-token-crypto.service';

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly tokenCrypto: IntegrationTokenCryptoService,
  ) {}

  async list(user: AuthenticatedUser) {
    const connections = await this.prisma.integrationConnection.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
    });

    return connections.map((connection) => this.redactSecrets(connection));
  }

  async create(input: {
    user: AuthenticatedUser;
    provider: IntegrationProvider;
    name: string;
    accessToken?: string;
    refreshToken?: string;
    // backward compatibility for older clients
    encryptedAccessToken?: string;
    encryptedRefreshToken?: string;
    scopes?: string[];
    config?: Record<string, unknown>;
  }) {
    const rawAccessToken = input.accessToken ?? input.encryptedAccessToken;
    const rawRefreshToken = input.refreshToken ?? input.encryptedRefreshToken;

    const encryptedAccessToken = this.resolveTokenForStorage(rawAccessToken);
    const encryptedRefreshToken = this.resolveTokenForStorage(rawRefreshToken);

    const connection = await this.prisma.integrationConnection.create({
      data: {
        organizationId: input.user.organizationId,
        provider: input.provider,
        name: input.name,
        status: IntegrationConnectionStatus.CONNECTED,
        encryptedAccessToken,
        encryptedRefreshToken,
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

    return this.redactSecrets(connection);
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

  private resolveTokenForStorage(value?: string): string | null {
    if (!value) return null;
    if (this.tokenCrypto.isEnvelopeFormat(value)) {
      return value;
    }
    return this.tokenCrypto.encryptToken(value);
  }

  private redactSecrets<T extends { encryptedAccessToken: string | null; encryptedRefreshToken: string | null }>(
    connection: T,
  ): Omit<T, 'encryptedAccessToken' | 'encryptedRefreshToken'> & { hasAccessToken: boolean; hasRefreshToken: boolean } {
    const { encryptedAccessToken, encryptedRefreshToken, ...rest } = connection;
    return {
      ...rest,
      hasAccessToken: Boolean(encryptedAccessToken),
      hasRefreshToken: Boolean(encryptedRefreshToken),
    };
  }
}

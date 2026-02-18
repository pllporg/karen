import { Inject, Injectable } from '@nestjs/common';
import { randomBytes, createHash } from 'node:crypto';
import {
  IntegrationConnectionStatus,
  IntegrationProvider,
  IntegrationSyncStatus,
  IntegrationWebhookStatus,
} from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuthenticatedUser } from '../common/types';
import { toJsonValueOrUndefined } from '../common/utils/json.util';
import { IntegrationTokenCryptoService } from './integration-token-crypto.service';
import {
  INTEGRATION_CONNECTORS,
  IncrementalSyncConnector,
} from './connectors/connector.interface';

type OAuthPendingState = {
  stateHash: string;
  expiresAt: string;
  redirectUri: string;
  scopes: string[];
};

type ConnectionConfig = Record<string, unknown> & {
  oauthPending?: OAuthPendingState;
};

@Injectable()
export class IntegrationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly tokenCrypto: IntegrationTokenCryptoService,
    @Inject(INTEGRATION_CONNECTORS) private readonly connectors: IncrementalSyncConnector[] = [],
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
        status: encryptedAccessToken ? IntegrationConnectionStatus.CONNECTED : IntegrationConnectionStatus.DISCONNECTED,
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

  async startOAuth(input: {
    user: AuthenticatedUser;
    provider: IntegrationProvider;
    name: string;
    redirectUri: string;
    scopes?: string[];
    config?: Record<string, unknown>;
  }) {
    const connector = this.getConnector(input.provider);
    if (!connector.supportsOAuth || !connector.getAuthorizationUrl) {
      throw new Error(`Provider ${input.provider} does not support OAuth authorization flows`);
    }

    const state = randomBytes(24).toString('hex');
    const oauthPending: OAuthPendingState = {
      stateHash: this.sha256(state),
      expiresAt: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
      redirectUri: input.redirectUri,
      scopes: this.normalizeScopes(input.scopes),
    };

    const mergedConfig: ConnectionConfig = {
      ...this.parseConfig(input.config),
      oauthPending,
    };

    const connection = await this.prisma.integrationConnection.create({
      data: {
        organizationId: input.user.organizationId,
        provider: input.provider,
        name: input.name,
        status: IntegrationConnectionStatus.DISCONNECTED,
        scopes: oauthPending.scopes,
        configJson: toJsonValueOrUndefined(mergedConfig),
      },
    });

    const authorizationUrl = connector.getAuthorizationUrl({
      redirectUri: input.redirectUri,
      state,
      scopes: oauthPending.scopes,
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'integration.oauth.started',
      entityType: 'integrationConnection',
      entityId: connection.id,
      metadata: { provider: input.provider },
    });

    return {
      connection: this.redactSecrets(connection),
      authorizationUrl,
      state,
      expiresAt: oauthPending.expiresAt,
    };
  }

  async completeOAuth(input: {
    user: AuthenticatedUser;
    connectionId: string;
    code: string;
    state: string;
    redirectUri?: string;
  }) {
    const connection = await this.prisma.integrationConnection.findFirst({
      where: {
        id: input.connectionId,
        organizationId: input.user.organizationId,
      },
    });
    if (!connection) {
      throw new Error('Integration connection not found');
    }

    const connector = this.getConnector(connection.provider);
    if (!connector.supportsOAuth || !connector.exchangeAuthorizationCode) {
      throw new Error(`Provider ${connection.provider} does not support OAuth token exchange`);
    }

    const config = this.parseConfig(connection.configJson);
    const pending = this.extractPendingState(config);
    if (!pending) {
      throw new Error('OAuth state not initialized for this connection');
    }
    if (Date.parse(pending.expiresAt) < Date.now()) {
      throw new Error('OAuth state has expired');
    }
    if (pending.stateHash !== this.sha256(input.state)) {
      throw new Error('OAuth state mismatch');
    }

    const redirectUri = input.redirectUri || pending.redirectUri;
    const tokenPayload = await connector.exchangeAuthorizationCode({
      code: input.code,
      redirectUri,
    });

    const nextConfig: ConnectionConfig = { ...config };
    delete nextConfig.oauthPending;
    if (tokenPayload.metadata) {
      nextConfig.providerMetadata = tokenPayload.metadata;
    }
    const exchangedScopes = this.normalizeScopes(tokenPayload.scopes);

    const updated = await this.prisma.integrationConnection.update({
      where: { id: connection.id },
      data: {
        status: IntegrationConnectionStatus.CONNECTED,
        encryptedAccessToken: this.resolveTokenForStorage(tokenPayload.accessToken),
        encryptedRefreshToken: this.resolveTokenForStorage(tokenPayload.refreshToken ?? undefined),
        tokenExpiresAt: tokenPayload.expiresAt ?? null,
        scopes: exchangedScopes.length > 0 ? exchangedScopes : pending.scopes,
        configJson: toJsonValueOrUndefined(nextConfig),
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'integration.oauth.completed',
      entityType: 'integrationConnection',
      entityId: updated.id,
      metadata: { provider: updated.provider },
    });

    return this.redactSecrets(updated);
  }

  async triggerSync(input: {
    user: AuthenticatedUser;
    connectionId: string;
    idempotencyKey: string;
    cursor?: string | null;
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

    const connector = this.getConnector(connection.provider);
    const config = this.parseConfig(connection.configJson);
    const cursor = input.cursor ?? (await this.getLatestCompletedCursor(connection.id));

    const run = await this.prisma.integrationSyncRun.create({
      data: {
        organizationId: input.user.organizationId,
        connectionId: connection.id,
        idempotencyKey: input.idempotencyKey,
        status: IntegrationSyncStatus.RUNNING,
        startedAt: new Date(),
      },
    });

    try {
      let accessToken = this.resolveTokenForUse(connection.encryptedAccessToken);
      let refreshToken = this.resolveTokenForUse(connection.encryptedRefreshToken);
      let syncConfig: ConnectionConfig = { ...config };
      let scopes = Array.isArray(connection.scopes) ? [...connection.scopes] : [];

      if (this.shouldRefreshToken(connection.tokenExpiresAt) && refreshToken && connector.refreshAccessToken) {
        const refreshed = await connector.refreshAccessToken({ refreshToken });
        accessToken = refreshed.accessToken;
        refreshToken = refreshed.refreshToken ?? refreshToken;
        scopes = this.normalizeScopes(refreshed.scopes);
        if (refreshed.metadata) {
          syncConfig = {
            ...syncConfig,
            providerMetadata: {
              ...(syncConfig.providerMetadata && typeof syncConfig.providerMetadata === 'object'
                ? (syncConfig.providerMetadata as Record<string, unknown>)
                : {}),
              ...refreshed.metadata,
            },
          };
        }

        await this.prisma.integrationConnection.update({
          where: { id: connection.id },
          data: {
            encryptedAccessToken: this.resolveTokenForStorage(accessToken),
            encryptedRefreshToken: this.resolveTokenForStorage(refreshToken ?? undefined),
            tokenExpiresAt: refreshed.expiresAt ?? null,
            scopes: scopes.length > 0 ? scopes : connection.scopes,
            configJson: toJsonValueOrUndefined(syncConfig),
          },
        });

        await this.audit.appendEvent({
          organizationId: input.user.organizationId,
          actorUserId: input.user.id,
          action: 'integration.oauth.refreshed',
          entityType: 'integrationConnection',
          entityId: connection.id,
          metadata: {
            provider: connection.provider,
            tokenExpiresAt: refreshed.expiresAt?.toISOString() ?? null,
          },
        });
      }

      const syncResult = await connector.sync({
        connectionId: connection.id,
        cursor,
        accessToken,
        refreshToken,
        config: syncConfig,
      });

      const finalCursor = syncResult.nextCursor ?? cursor ?? null;
      const finishedRun = await this.prisma.integrationSyncRun.update({
        where: { id: run.id },
        data: {
          status: IntegrationSyncStatus.COMPLETED,
          cursor: finalCursor,
          finishedAt: new Date(),
        },
      });

      const syncState = {
        lastCursor: finalCursor,
        lastImportedCount: syncResult.importedCount,
        warnings: syncResult.warnings ?? [],
        updatedAt: new Date().toISOString(),
      };
      const nextConfig: ConnectionConfig = { ...syncConfig, syncState };

      await this.prisma.integrationConnection.update({
        where: { id: connection.id },
        data: {
          status: IntegrationConnectionStatus.CONNECTED,
          lastSyncAt: new Date(),
          scopes: scopes.length > 0 ? scopes : connection.scopes,
          configJson: toJsonValueOrUndefined(nextConfig),
        },
      });

      await this.audit.appendEvent({
        organizationId: input.user.organizationId,
        actorUserId: input.user.id,
        action: 'integration.sync.completed',
        entityType: 'integrationConnection',
        entityId: connection.id,
        metadata: {
          provider: connection.provider,
          importedCount: syncResult.importedCount,
          cursor: finalCursor,
          warnings: syncResult.warnings ?? [],
        },
      });

      return finishedRun;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);

      const failedRun = await this.prisma.integrationSyncRun.update({
        where: { id: run.id },
        data: {
          status: IntegrationSyncStatus.FAILED,
          error: message,
          finishedAt: new Date(),
        },
      });

      await this.prisma.integrationConnection.update({
        where: { id: connection.id },
        data: {
          status: IntegrationConnectionStatus.ERROR,
        },
      });

      await this.audit.appendEvent({
        organizationId: input.user.organizationId,
        actorUserId: input.user.id,
        action: 'integration.sync.failed',
        entityType: 'integrationConnection',
        entityId: connection.id,
        metadata: {
          provider: connection.provider,
          error: message,
        },
      });

      return failedRun;
    }
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

    const existing = await this.prisma.integrationWebhookSubscription.findFirst({
      where: {
        connectionId: connection.id,
        event: input.event,
        targetUrl: input.targetUrl,
      },
    });
    if (existing) {
      return existing;
    }

    const connector = this.getConnector(connection.provider);
    const config = this.parseConfig(connection.configJson);
    const accessToken = this.resolveTokenForUse(connection.encryptedAccessToken);

    const subscription = await connector.subscribeWebhooks({
      connectionId: connection.id,
      targetUrl: input.targetUrl,
      event: input.event,
      accessToken,
      config,
    });

    const created = await this.prisma.integrationWebhookSubscription.create({
      data: {
        organizationId: input.user.organizationId,
        connectionId: connection.id,
        event: input.event,
        targetUrl: input.targetUrl,
        status: IntegrationWebhookStatus.ACTIVE,
        externalId: subscription.subscriptionId,
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'integration.webhook.subscribed',
      entityType: 'integrationConnection',
      entityId: connection.id,
      metadata: {
        provider: connection.provider,
        event: input.event,
        targetUrl: input.targetUrl,
        externalSubscriptionId: subscription.subscriptionId,
      },
    });

    return created;
  }

  private resolveTokenForStorage(value?: string): string | null {
    if (!value) return null;
    if (this.tokenCrypto.isEnvelopeFormat(value)) {
      return value;
    }
    return this.tokenCrypto.encryptToken(value);
  }

  private resolveTokenForUse(value?: string | null): string | null {
    if (!value) return null;
    if (this.tokenCrypto.isEnvelopeFormat(value)) {
      return this.tokenCrypto.decryptToken(value);
    }
    return value;
  }

  private getConnector(provider: IntegrationProvider): IncrementalSyncConnector {
    const connector = this.connectors.find((entry) => entry.provider === provider);
    if (!connector) {
      throw new Error(`No connector registered for provider ${provider}`);
    }
    return connector;
  }

  private normalizeScopes(scopes?: string[]): string[] {
    const raw = Array.isArray(scopes) ? scopes : [];
    return raw.map((scope) => String(scope || '').trim()).filter(Boolean);
  }

  private sha256(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private parseConfig(value: unknown): ConnectionConfig {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return { ...(value as Record<string, unknown>) };
    }
    return {};
  }

  private extractPendingState(config: ConnectionConfig): OAuthPendingState | null {
    const value = config.oauthPending;
    if (!value || typeof value !== 'object') return null;
    const pending = value as Partial<OAuthPendingState>;
    if (
      typeof pending.stateHash === 'string' &&
      typeof pending.expiresAt === 'string' &&
      typeof pending.redirectUri === 'string' &&
      Array.isArray(pending.scopes)
    ) {
      return {
        stateHash: pending.stateHash,
        expiresAt: pending.expiresAt,
        redirectUri: pending.redirectUri,
        scopes: pending.scopes.map((scope) => String(scope || '')).filter(Boolean),
      };
    }
    return null;
  }

  private shouldRefreshToken(expiresAt: Date | null): boolean {
    if (!expiresAt) return false;
    const refreshSkewMs = 1000 * 60;
    return expiresAt.getTime() <= Date.now() + refreshSkewMs;
  }

  private async getLatestCompletedCursor(connectionId: string): Promise<string | null> {
    const latest = await this.prisma.integrationSyncRun.findFirst({
      where: {
        connectionId,
        status: IntegrationSyncStatus.COMPLETED,
      },
      orderBy: { finishedAt: 'desc' },
    });
    return latest?.cursor ?? null;
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

import { createHash } from 'node:crypto';
import { IntegrationProvider } from '@prisma/client';
import { IntegrationsService } from '../src/integrations/integrations.service';
import { IntegrationTokenCryptoService } from '../src/integrations/integration-token-crypto.service';
import { IncrementalSyncConnector } from '../src/integrations/connectors/connector.interface';

function connectorStub(
  provider: IntegrationProvider,
  overrides?: Partial<IncrementalSyncConnector>,
): IncrementalSyncConnector {
  return {
    provider,
    supportsOAuth: true,
    getAuthorizationUrl: jest.fn().mockReturnValue('https://example.test/oauth/authorize'),
    exchangeAuthorizationCode: jest.fn().mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      expiresAt: new Date('2030-01-01T00:00:00.000Z'),
      scopes: ['matters:read'],
    }),
    sync: jest.fn().mockResolvedValue({
      nextCursor: 'cursor-next',
      importedCount: 0,
      warnings: [],
    }),
    subscribeWebhooks: jest.fn().mockResolvedValue({ subscriptionId: 'external-sub-1' }),
    ...overrides,
  };
}

describe('IntegrationsService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    const key = Buffer.from('0123456789abcdef0123456789abcdef').toString('base64');
    process.env.INTEGRATION_TOKEN_ENCRYPTION_KEYS = `v1:${key}`;
    process.env.INTEGRATION_TOKEN_ACTIVE_KEY_ID = 'v1';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('encrypts tokens at rest and redacts token fields from create response', async () => {
    const prisma = {
      integrationConnection: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'conn-1', ...data })),
      },
    } as any;

    const service = new IntegrationsService(
      prisma,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      new IntegrationTokenCryptoService(),
      [],
    );

    const result = await service.create({
      user: { id: 'u1', organizationId: 'org1' } as any,
      provider: IntegrationProvider.CLIO,
      name: 'Clio Manage',
      accessToken: 'access-secret',
      refreshToken: 'refresh-secret',
    });

    const createArgs = prisma.integrationConnection.create.mock.calls[0][0];
    expect(createArgs.data.encryptedAccessToken).toBeTruthy();
    expect(createArgs.data.encryptedAccessToken).not.toContain('access-secret');
    expect(createArgs.data.encryptedRefreshToken).toBeTruthy();
    expect(createArgs.data.encryptedRefreshToken).not.toContain('refresh-secret');

    expect(result).toEqual(
      expect.objectContaining({
        id: 'conn-1',
        hasAccessToken: true,
        hasRefreshToken: true,
      }),
    );
    expect(result).not.toHaveProperty('encryptedAccessToken');
    expect(result).not.toHaveProperty('encryptedRefreshToken');
  });

  it('redacts token fields from list response', async () => {
    const prisma = {
      integrationConnection: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'conn-1',
            organizationId: 'org1',
            name: 'Clio',
            provider: IntegrationProvider.CLIO,
            encryptedAccessToken: '{"v":1}',
            encryptedRefreshToken: null,
          },
        ]),
      },
    } as any;

    const service = new IntegrationsService(
      prisma,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      new IntegrationTokenCryptoService(),
      [],
    );

    const rows = await service.list({ organizationId: 'org1' } as any);

    expect(prisma.integrationConnection.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { organizationId: 'org1' } }),
    );
    expect(rows[0]).toEqual(
      expect.objectContaining({
        id: 'conn-1',
        hasAccessToken: true,
        hasRefreshToken: false,
      }),
    );
    expect(rows[0]).not.toHaveProperty('encryptedAccessToken');
    expect(rows[0]).not.toHaveProperty('encryptedRefreshToken');
  });

  it('starts oauth and stores pending state hash for connector callback verification', async () => {
    const connector = connectorStub(IntegrationProvider.CLIO, {
      getAuthorizationUrl: jest.fn().mockReturnValue('https://clio.example/auth'),
    });
    const prisma = {
      integrationConnection: {
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'conn-start', ...data })),
      },
    } as any;
    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;

    const service = new IntegrationsService(prisma, audit, new IntegrationTokenCryptoService(), [connector]);
    const result = await service.startOAuth({
      user: { id: 'u1', organizationId: 'org1' } as any,
      provider: IntegrationProvider.CLIO,
      name: 'Clio Manage',
      redirectUri: 'http://localhost:3000/integrations/callback',
      scopes: ['matters:read', 'contacts:read'],
    });

    expect(result.authorizationUrl).toBe('https://clio.example/auth');
    expect(result.state).toMatch(/^[a-f0-9]{48}$/);

    const createArgs = prisma.integrationConnection.create.mock.calls[0][0];
    expect(createArgs.data.status).toBe('DISCONNECTED');
    expect(createArgs.data.configJson.oauthPending.redirectUri).toBe('http://localhost:3000/integrations/callback');
    expect(createArgs.data.configJson.oauthPending.scopes).toEqual(['matters:read', 'contacts:read']);
    expect(createArgs.data.configJson.oauthPending.stateHash).toBe(
      createHash('sha256').update(result.state).digest('hex'),
    );
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'integration.oauth.started', entityId: 'conn-start' }),
    );
  });

  it('completes oauth by exchanging code and storing encrypted tokens', async () => {
    const state = 'abcdef123456abcdef123456abcdef123456abcdef123456';
    const stateHash = createHash('sha256').update(state).digest('hex');
    const connector = connectorStub(IntegrationProvider.CLIO, {
      exchangeAuthorizationCode: jest.fn().mockResolvedValue({
        accessToken: 'clio-access',
        refreshToken: 'clio-refresh',
        expiresAt: new Date('2031-01-01T00:00:00.000Z'),
        scopes: ['matters:read'],
        metadata: { accountId: 'acct-1' },
      }),
    });
    const prisma = {
      integrationConnection: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'conn-1',
          organizationId: 'org1',
          provider: IntegrationProvider.CLIO,
          configJson: {
            oauthPending: {
              stateHash,
              expiresAt: '2099-01-01T00:00:00.000Z',
              redirectUri: 'http://localhost:3000/callback',
              scopes: ['matters:read'],
            },
          },
          encryptedAccessToken: null,
          encryptedRefreshToken: null,
          scopes: [],
        }),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'conn-1', ...data })),
      },
    } as any;

    const service = new IntegrationsService(
      prisma,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      new IntegrationTokenCryptoService(),
      [connector],
    );

    const result = await service.completeOAuth({
      user: { id: 'u1', organizationId: 'org1' } as any,
      connectionId: 'conn-1',
      code: 'oauth-code-123',
      state,
      redirectUri: 'http://localhost:3000/callback',
    });

    expect((connector.exchangeAuthorizationCode as jest.Mock).mock.calls[0][0]).toEqual({
      code: 'oauth-code-123',
      redirectUri: 'http://localhost:3000/callback',
    });

    const updateArgs = prisma.integrationConnection.update.mock.calls[0][0];
    expect(updateArgs.data.status).toBe('CONNECTED');
    expect(updateArgs.data.encryptedAccessToken).toBeTruthy();
    expect(updateArgs.data.encryptedAccessToken).not.toContain('clio-access');
    expect(updateArgs.data.encryptedRefreshToken).toBeTruthy();
    expect(updateArgs.data.encryptedRefreshToken).not.toContain('clio-refresh');
    expect(updateArgs.data.scopes).toEqual(['matters:read']);
    expect(result).toEqual(
      expect.objectContaining({
        id: 'conn-1',
        hasAccessToken: true,
        hasRefreshToken: true,
      }),
    );
  });

  it('rejects oauth callback when state hash does not match pending state', async () => {
    const connector = connectorStub(IntegrationProvider.CLIO);
    const prisma = {
      integrationConnection: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'conn-1',
          organizationId: 'org1',
          provider: IntegrationProvider.CLIO,
          configJson: {
            oauthPending: {
              stateHash: createHash('sha256').update('expected-state').digest('hex'),
              expiresAt: '2099-01-01T00:00:00.000Z',
              redirectUri: 'http://localhost:3000/callback',
              scopes: ['matters:read'],
            },
          },
        }),
      },
    } as any;

    const service = new IntegrationsService(
      prisma,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      new IntegrationTokenCryptoService(),
      [connector],
    );

    await expect(
      service.completeOAuth({
        user: { id: 'u1', organizationId: 'org1' } as any,
        connectionId: 'conn-1',
        code: 'oauth-code-123',
        state: 'wrong-state',
        redirectUri: 'http://localhost:3000/callback',
      }),
    ).rejects.toThrow('OAuth state mismatch');
  });

  it('rejects oauth callback when pending state is expired', async () => {
    const state = 'abcdef123456abcdef123456abcdef123456abcdef123456';
    const stateHash = createHash('sha256').update(state).digest('hex');
    const connector = connectorStub(IntegrationProvider.CLIO);
    const prisma = {
      integrationConnection: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'conn-1',
          organizationId: 'org1',
          provider: IntegrationProvider.CLIO,
          configJson: {
            oauthPending: {
              stateHash,
              expiresAt: '2000-01-01T00:00:00.000Z',
              redirectUri: 'http://localhost:3000/callback',
              scopes: ['matters:read'],
            },
          },
        }),
      },
    } as any;

    const service = new IntegrationsService(
      prisma,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      new IntegrationTokenCryptoService(),
      [connector],
    );

    await expect(
      service.completeOAuth({
        user: { id: 'u1', organizationId: 'org1' } as any,
        connectionId: 'conn-1',
        code: 'oauth-code-123',
        state,
        redirectUri: 'http://localhost:3000/callback',
      }),
    ).rejects.toThrow('OAuth state has expired');
  });

  it('runs connector sync with idempotency and persists sync cursor', async () => {
    const tokenCrypto = new IntegrationTokenCryptoService();
    const accessEnvelope = tokenCrypto.encryptToken('decrypted-access');
    const connector = connectorStub(IntegrationProvider.CLIO, {
      sync: jest.fn().mockResolvedValue({
        nextCursor: 'cursor-2026-02-16T00:00:00.000Z',
        importedCount: 3,
        warnings: ['stub-mode'],
      }),
    });
    const prisma = {
      integrationConnection: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'conn-1',
          organizationId: 'org1',
          provider: IntegrationProvider.CLIO,
          encryptedAccessToken: accessEnvelope,
          encryptedRefreshToken: null,
          configJson: {},
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      integrationSyncRun: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue({ cursor: 'cursor-prior' }),
        create: jest.fn().mockResolvedValue({ id: 'run-1' }),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'run-1', ...data })),
      },
    } as any;

    const service = new IntegrationsService(
      prisma,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      tokenCrypto,
      [connector],
    );

    const run = await service.triggerSync({
      user: { id: 'u1', organizationId: 'org1' } as any,
      connectionId: 'conn-1',
      idempotencyKey: 'idem-1',
    });

    expect((connector.sync as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        connectionId: 'conn-1',
        cursor: 'cursor-prior',
        accessToken: 'decrypted-access',
      }),
    );
    expect(prisma.integrationSyncRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'COMPLETED',
          cursor: 'cursor-2026-02-16T00:00:00.000Z',
        }),
      }),
    );
    expect(run).toEqual(
      expect.objectContaining({
        id: 'run-1',
        status: 'COMPLETED',
      }),
    );
  });

  it('returns existing sync run for duplicate idempotency key', async () => {
    const connector = connectorStub(IntegrationProvider.CLIO);
    const prisma = {
      integrationConnection: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'conn-1',
          organizationId: 'org1',
          provider: IntegrationProvider.CLIO,
          encryptedAccessToken: null,
          encryptedRefreshToken: null,
          configJson: {},
        }),
      },
      integrationSyncRun: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'run-existing',
          connectionId: 'conn-1',
          idempotencyKey: 'idem-dup',
          status: 'COMPLETED',
        }),
      },
    } as any;

    const service = new IntegrationsService(
      prisma,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      new IntegrationTokenCryptoService(),
      [connector],
    );

    const result = await service.triggerSync({
      user: { id: 'u1', organizationId: 'org1' } as any,
      connectionId: 'conn-1',
      idempotencyKey: 'idem-dup',
    });

    expect(result).toEqual(expect.objectContaining({ id: 'run-existing' }));
    expect((connector.sync as jest.Mock).mock.calls.length).toBe(0);
  });

  it('refreshes expired oauth token before sync when connector supports refresh flow', async () => {
    const tokenCrypto = new IntegrationTokenCryptoService();
    const connector = connectorStub(IntegrationProvider.CLIO, {
      refreshAccessToken: jest.fn().mockResolvedValue({
        accessToken: 'refreshed-access-token',
        refreshToken: 'refreshed-refresh-token',
        expiresAt: new Date('2030-02-01T00:00:00.000Z'),
        scopes: ['matters:read', 'contacts:read'],
        metadata: { refreshed: true },
      }),
      sync: jest.fn().mockResolvedValue({
        nextCursor: 'cursor-after-refresh',
        importedCount: 2,
        warnings: [],
      }),
    });
    const prisma = {
      integrationConnection: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'conn-1',
          organizationId: 'org1',
          provider: IntegrationProvider.CLIO,
          encryptedAccessToken: tokenCrypto.encryptToken('expired-access-token'),
          encryptedRefreshToken: tokenCrypto.encryptToken('existing-refresh-token'),
          tokenExpiresAt: new Date('2000-01-01T00:00:00.000Z'),
          configJson: {},
          scopes: ['matters:read'],
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      integrationSyncRun: {
        findUnique: jest.fn().mockResolvedValue(null),
        findFirst: jest.fn().mockResolvedValue({ cursor: 'cursor-prior' }),
        create: jest.fn().mockResolvedValue({ id: 'run-refresh' }),
        update: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'run-refresh', ...data })),
      },
    } as any;
    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;

    const service = new IntegrationsService(prisma, audit, tokenCrypto, [connector]);
    const run = await service.triggerSync({
      user: { id: 'u1', organizationId: 'org1' } as any,
      connectionId: 'conn-1',
      idempotencyKey: 'idem-refresh',
    });

    expect((connector.refreshAccessToken as jest.Mock).mock.calls[0][0]).toEqual({
      refreshToken: 'existing-refresh-token',
    });
    expect((connector.sync as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        accessToken: 'refreshed-access-token',
        refreshToken: 'refreshed-refresh-token',
      }),
    );
    expect(prisma.integrationConnection.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          encryptedAccessToken: expect.any(String),
          encryptedRefreshToken: expect.any(String),
          scopes: ['matters:read', 'contacts:read'],
        }),
      }),
    );
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'integration.oauth.refreshed',
        entityId: 'conn-1',
      }),
    );
    expect(run).toEqual(expect.objectContaining({ id: 'run-refresh', status: 'COMPLETED' }));
  });

  it('subscribes webhook via connector and stores provider subscription id', async () => {
    const connector = connectorStub(IntegrationProvider.CLIO, {
      subscribeWebhooks: jest.fn().mockResolvedValue({ subscriptionId: 'clio-subscription-42' }),
    });
    const tokenCrypto = new IntegrationTokenCryptoService();
    const accessEnvelope = tokenCrypto.encryptToken('access-for-webhooks');
    const prisma = {
      integrationConnection: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'conn-1',
          organizationId: 'org1',
          provider: IntegrationProvider.CLIO,
          encryptedAccessToken: accessEnvelope,
          encryptedRefreshToken: null,
          configJson: {},
        }),
      },
      integrationWebhookSubscription: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest
          .fn()
          .mockImplementation(({ data }) => Promise.resolve({ id: 'hook-1', createdAt: new Date().toISOString(), ...data })),
      },
    } as any;

    const service = new IntegrationsService(
      prisma,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      tokenCrypto,
      [connector],
    );

    const result = await service.subscribeWebhook({
      user: { id: 'u1', organizationId: 'org1' } as any,
      connectionId: 'conn-1',
      event: 'matter.updated',
      targetUrl: 'https://firm.example/webhooks/clio',
    });

    expect((connector.subscribeWebhooks as jest.Mock).mock.calls[0][0]).toEqual(
      expect.objectContaining({
        event: 'matter.updated',
        targetUrl: 'https://firm.example/webhooks/clio',
        accessToken: 'access-for-webhooks',
      }),
    );
    expect(prisma.integrationWebhookSubscription.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          externalId: 'clio-subscription-42',
          status: 'ACTIVE',
        }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'hook-1',
        externalId: 'clio-subscription-42',
      }),
    );
  });

  it('returns existing webhook subscription for duplicate event and target', async () => {
    const connector = connectorStub(IntegrationProvider.CLIO);
    const prisma = {
      integrationConnection: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'conn-1',
          organizationId: 'org1',
          provider: IntegrationProvider.CLIO,
          encryptedAccessToken: null,
          encryptedRefreshToken: null,
          configJson: {},
        }),
      },
      integrationWebhookSubscription: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'hook-existing',
          connectionId: 'conn-1',
          event: 'matter.updated',
          targetUrl: 'https://firm.example/webhooks/clio',
          externalId: 'clio-sub-existing',
        }),
      },
    } as any;

    const service = new IntegrationsService(
      prisma,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      new IntegrationTokenCryptoService(),
      [connector],
    );

    const result = await service.subscribeWebhook({
      user: { id: 'u1', organizationId: 'org1' } as any,
      connectionId: 'conn-1',
      event: 'matter.updated',
      targetUrl: 'https://firm.example/webhooks/clio',
    });

    expect(result).toEqual(expect.objectContaining({ id: 'hook-existing', externalId: 'clio-sub-existing' }));
    expect((connector.subscribeWebhooks as jest.Mock).mock.calls.length).toBe(0);
  });
});

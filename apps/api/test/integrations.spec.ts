import { IntegrationProvider } from '@prisma/client';
import { IntegrationsService } from '../src/integrations/integrations.service';
import { IntegrationTokenCryptoService } from '../src/integrations/integration-token-crypto.service';

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
});

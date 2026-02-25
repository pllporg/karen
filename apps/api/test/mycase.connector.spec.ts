import { MyCaseConnector } from '../src/integrations/connectors/mycase.connector';

function mockResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as Response;
}

describe('MyCaseConnector', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.INTEGRATION_SYNC_ENABLE_LIVE;
    delete process.env.INTEGRATION_OAUTH_ENABLE_LIVE;
    delete process.env.MYCASE_API_BASE_URL;
    delete process.env.MYCASE_TOKEN_URL;
    delete process.env.MYCASE_CLIENT_ID;
    delete process.env.MYCASE_CLIENT_SECRET;
    delete process.env.MYCASE_WEBHOOK_REGISTER_URL;
    (global as { fetch?: unknown }).fetch = jest.fn();
  });

  afterEach(() => {
    (global as { fetch?: unknown }).fetch = originalFetch;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('runs in scaffold mode by default and avoids provider pulls', async () => {
    const connector = new MyCaseConnector();

    const result = await connector.sync({
      connectionId: 'conn-mycase',
      cursor: 'cursor-prior',
      accessToken: null,
    });

    expect(result.importedCount).toBe(0);
    expect(result.nextCursor).toBe('cursor-prior');
    expect(result.warnings?.[0]).toContain('INTEGRATION_SYNC_ENABLE_LIVE=true');
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(0);
  });

  it('requires access token when live sync mode is enabled', async () => {
    process.env.INTEGRATION_SYNC_ENABLE_LIVE = 'true';
    const connector = new MyCaseConnector();

    await expect(
      connector.sync({
        connectionId: 'conn-mycase',
      }),
    ).rejects.toThrow('MyCase sync requires an access token');
  });

  it('pulls contacts and matters from MyCase in live sync mode', async () => {
    process.env.INTEGRATION_SYNC_ENABLE_LIVE = 'true';
    process.env.MYCASE_API_BASE_URL = 'https://mycase.example/api';
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        mockResponse(200, {
          data: [{ id: 'contact-1', updated_at: '2026-02-04T10:00:00.000Z' }],
        }),
      )
      .mockResolvedValueOnce(
        mockResponse(200, {
          results: [{ id: 'matter-1', updatedAt: '2026-02-05T12:30:00.000Z' }],
        }),
      );

    const connector = new MyCaseConnector();
    const result = await connector.sync({
      connectionId: 'conn-mycase',
      cursor: '2026-01-01T00:00:00.000Z',
      accessToken: 'mycase-token',
    });

    expect(result.importedCount).toBe(2);
    expect(result.nextCursor).toBe('2026-02-05T12:30:00.000Z');
    expect(result.warnings).toContain(
      'MyCase sync currently maps contacts and matters only; additional entity pulls remain pending.',
    );

    const contactCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(contactCall[0])).toContain('/contacts');
    const contactUrl = new URL(String(contactCall[0]));
    expect(contactUrl.searchParams.get('updated_since')).toBe('2026-01-01T00:00:00.000Z');
    expect(contactCall[1]).toEqual(
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer mycase-token',
        }),
      }),
    );
  });

  it('uses generated webhook ids in scaffold mode', async () => {
    const connector = new MyCaseConnector();
    const result = await connector.subscribeWebhooks({
      connectionId: 'conn-mycase',
      event: 'matter.updated',
      targetUrl: 'https://firm.example/webhooks/mycase',
      accessToken: 'mycase-token',
    });

    expect(result.subscriptionId).toMatch(/^mycase-conn-mycase-matter-updated-/);
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(0);
  });

  it('registers webhook against provider endpoint in live mode when configured', async () => {
    process.env.INTEGRATION_SYNC_ENABLE_LIVE = 'true';
    process.env.MYCASE_WEBHOOK_REGISTER_URL = 'https://mycase.example/api/webhooks/subscriptions';
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockResponse(200, {
        id: 'mycase-sub-42',
      }),
    );

    const connector = new MyCaseConnector();
    const result = await connector.subscribeWebhooks({
      connectionId: 'conn-mycase',
      event: 'matter.updated',
      targetUrl: 'https://firm.example/webhooks/mycase',
      accessToken: 'mycase-token',
    });

    expect(result.subscriptionId).toBe('mycase-sub-42');
    const call = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(call[0])).toBe('https://mycase.example/api/webhooks/subscriptions');
    expect(call[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer mycase-token',
        }),
      }),
    );
  });

  it('requires webhook registration url in live sync mode', async () => {
    process.env.INTEGRATION_SYNC_ENABLE_LIVE = 'true';
    delete process.env.MYCASE_WEBHOOK_REGISTER_URL;

    const connector = new MyCaseConnector();
    await expect(
      connector.subscribeWebhooks({
        connectionId: 'conn-mycase',
        event: 'matter.updated',
        targetUrl: 'https://firm.example/webhooks/mycase',
        accessToken: 'mycase-token',
      }),
    ).rejects.toThrow('MYCASE_WEBHOOK_REGISTER_URL');
  });

  it('refreshes token in scaffold mode without network calls', async () => {
    const connector = new MyCaseConnector();
    const result = await connector.refreshAccessToken({
      refreshToken: 'refresh-seed-token',
    });

    expect(result.accessToken).toMatch(/^mycase_access_refresh_/);
    expect(result.refreshToken).toMatch(/^mycase_refresh_/);
    expect(result.metadata).toEqual(
      expect.objectContaining({
        mode: 'stub',
        refreshed: true,
      }),
    );
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(0);
  });

  it('refreshes token in live oauth mode via provider token endpoint', async () => {
    process.env.INTEGRATION_OAUTH_ENABLE_LIVE = 'true';
    process.env.MYCASE_TOKEN_URL = 'https://mycase.example/oauth/token';
    process.env.MYCASE_CLIENT_ID = 'mycase-client';
    process.env.MYCASE_CLIENT_SECRET = 'mycase-secret';
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockResponse(200, {
        access_token: 'live-access-token',
        refresh_token: 'live-refresh-token',
        expires_in: 3600,
        scope: 'matters:read contacts:read',
        created_at: 1700000000,
      }),
    );

    const connector = new MyCaseConnector();
    const result = await connector.refreshAccessToken({
      refreshToken: 'existing-refresh-token',
    });

    expect(result).toEqual(
      expect.objectContaining({
        accessToken: 'live-access-token',
        refreshToken: 'live-refresh-token',
        scopes: ['matters:read', 'contacts:read'],
        metadata: expect.objectContaining({
          mode: 'live',
          refreshed: true,
        }),
      }),
    );

    const call = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(call[0])).toBe('https://mycase.example/oauth/token');
    expect(String((call[1] as RequestInit).body)).toContain('grant_type=refresh_token');
    expect(String((call[1] as RequestInit).body)).toContain('refresh_token=existing-refresh-token');
  });

  it('throws when live oauth refresh response omits access token', async () => {
    process.env.INTEGRATION_OAUTH_ENABLE_LIVE = 'true';
    process.env.MYCASE_TOKEN_URL = 'https://mycase.example/oauth/token';
    process.env.MYCASE_CLIENT_ID = 'mycase-client';
    process.env.MYCASE_CLIENT_SECRET = 'mycase-secret';
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockResponse(200, {
        refresh_token: 'live-refresh-token',
        expires_in: 3600,
      }),
    );

    const connector = new MyCaseConnector();
    await expect(
      connector.refreshAccessToken({
        refreshToken: 'existing-refresh-token',
      }),
    ).rejects.toThrow('MyCase token refresh did not return access_token');
  });

  it('requires non-stub oauth credentials when live oauth is enabled', async () => {
    process.env.INTEGRATION_OAUTH_ENABLE_LIVE = 'true';
    process.env.MYCASE_CLIENT_ID = 'stub-mycase-client-id';
    process.env.MYCASE_CLIENT_SECRET = 'stub-mycase-client-secret';

    const connector = new MyCaseConnector();
    expect(() =>
      connector.getAuthorizationUrl({
        redirectUri: 'https://firm.example/callback',
        state: 'state-123',
      }),
    ).toThrow('MYCASE_CLIENT_ID');

    await expect(
      connector.refreshAccessToken({
        refreshToken: 'existing-refresh-token',
      }),
    ).rejects.toThrow('MYCASE_CLIENT_ID');
  });
});

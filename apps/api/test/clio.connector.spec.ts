import { ClioConnector } from '../src/integrations/connectors/clio.connector';

function mockResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as Response;
}

describe('ClioConnector', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.INTEGRATION_SYNC_ENABLE_LIVE;
    delete process.env.CLIO_API_BASE_URL;
    delete process.env.CLIO_WEBHOOK_REGISTER_URL;
    (global as { fetch?: unknown }).fetch = jest.fn();
  });

  afterEach(() => {
    (global as { fetch?: unknown }).fetch = originalFetch;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('runs in scaffold mode by default and avoids provider pulls', async () => {
    const connector = new ClioConnector();

    const result = await connector.sync({
      connectionId: 'conn-clio',
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
    const connector = new ClioConnector();

    await expect(
      connector.sync({
        connectionId: 'conn-clio',
      }),
    ).rejects.toThrow('Clio sync requires an access token');
  });

  it('pulls contacts and matters from Clio in live sync mode', async () => {
    process.env.INTEGRATION_SYNC_ENABLE_LIVE = 'true';
    process.env.CLIO_API_BASE_URL = 'https://clio.example/api';
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

    const connector = new ClioConnector();
    const result = await connector.sync({
      connectionId: 'conn-clio',
      cursor: '2026-01-01T00:00:00.000Z',
      accessToken: 'clio-token',
    });

    expect(result.importedCount).toBe(2);
    expect(result.nextCursor).toBe('2026-02-05T12:30:00.000Z');
    expect(result.warnings).toContain(
      'Clio sync currently maps contacts and matters only; additional entity pulls remain pending.',
    );

    const contactCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(contactCall[0])).toContain('/contacts');
    const contactUrl = new URL(String(contactCall[0]));
    expect(contactUrl.searchParams.get('updated_since')).toBe('2026-01-01T00:00:00.000Z');
    expect(contactCall[1]).toEqual(
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer clio-token',
        }),
      }),
    );
  });

  it('uses generated webhook ids in scaffold mode', async () => {
    const connector = new ClioConnector();
    const result = await connector.subscribeWebhooks({
      connectionId: 'conn-clio',
      event: 'matter.updated',
      targetUrl: 'https://firm.example/webhooks/clio',
      accessToken: 'clio-token',
    });

    expect(result.subscriptionId).toMatch(/^clio-conn-clio-matter-updated-/);
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(0);
  });

  it('registers webhook against provider endpoint in live mode when configured', async () => {
    process.env.INTEGRATION_SYNC_ENABLE_LIVE = 'true';
    process.env.CLIO_WEBHOOK_REGISTER_URL = 'https://clio.example/api/webhooks';
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockResponse(200, {
        id: 'clio-sub-42',
      }),
    );

    const connector = new ClioConnector();
    const result = await connector.subscribeWebhooks({
      connectionId: 'conn-clio',
      event: 'matter.updated',
      targetUrl: 'https://firm.example/webhooks/clio',
      accessToken: 'clio-token',
    });

    expect(result.subscriptionId).toBe('clio-sub-42');
    const call = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(call[0])).toBe('https://clio.example/api/webhooks');
    expect(call[1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer clio-token',
        }),
      }),
    );
  });
});

import { FilevineConnector } from '../src/integrations/connectors/filevine.connector';
import { PracticePantherConnector } from '../src/integrations/connectors/practicepanther.connector';

function mockResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => (typeof body === 'string' ? body : JSON.stringify(body)),
  } as Response;
}

describe('Provider connector sync adapters', () => {
  const originalEnv = process.env;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.INTEGRATION_SYNC_ENABLE_LIVE;
    delete process.env.FILEVINE_API_BASE_URL;
    delete process.env.FILEVINE_WEBHOOK_REGISTER_URL;
    delete process.env.PRACTICEPANTHER_API_BASE_URL;
    delete process.env.PRACTICEPANTHER_WEBHOOK_REGISTER_URL;
    (global as { fetch?: unknown }).fetch = jest.fn();
  });

  afterEach(() => {
    (global as { fetch?: unknown }).fetch = originalFetch;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('keeps Filevine in scaffold mode when live sync is disabled', async () => {
    const connector = new FilevineConnector();

    const result = await connector.sync({
      connectionId: 'conn-filevine',
      cursor: 'cursor-prior',
      accessToken: null,
    });

    expect(result.importedCount).toBe(0);
    expect(result.nextCursor).toBe('cursor-prior');
    expect(result.warnings?.[0]).toContain('INTEGRATION_SYNC_ENABLE_LIVE=true');
    expect((global.fetch as jest.Mock).mock.calls.length).toBe(0);
  });

  it('pulls Filevine contacts and projects in live mode with incremental cursor', async () => {
    process.env.INTEGRATION_SYNC_ENABLE_LIVE = 'true';
    process.env.FILEVINE_API_BASE_URL = 'https://filevine.example/api';
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(
        mockResponse(200, {
          results: [{ id: 'contact-1', updated_at: '2026-02-01T12:00:00.000Z' }],
        }),
      )
      .mockResolvedValueOnce(
        mockResponse(200, {
          data: [{ id: 'project-1', updatedAt: '2026-02-03T08:30:00.000Z' }],
        }),
      );

    const connector = new FilevineConnector();
    const result = await connector.sync({
      connectionId: 'conn-filevine',
      cursor: '2026-01-15T00:00:00.000Z',
      accessToken: 'filevine-token',
    });

    expect(result.importedCount).toBe(2);
    expect(result.nextCursor).toBe('2026-02-03T08:30:00.000Z');
    expect(result.warnings).toContain(
      'Filevine sync currently maps contacts and projects only; additional entity pulls remain pending.',
    );

    const firstCall = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(firstCall[0])).toContain('/contacts');
    const firstUrl = new URL(String(firstCall[0]));
    expect(firstUrl.searchParams.get('updated_since')).toBe('2026-01-15T00:00:00.000Z');
    expect(firstCall[1]).toEqual(
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: 'Bearer filevine-token',
        }),
      }),
    );
  });

  it('requires access token for PracticePanther live sync mode', async () => {
    process.env.INTEGRATION_SYNC_ENABLE_LIVE = 'true';
    const connector = new PracticePantherConnector();

    await expect(
      connector.sync({
        connectionId: 'conn-practicepanther',
      }),
    ).rejects.toThrow('PracticePanther sync requires an access token');
  });

  it('returns partial PracticePanther results with warnings when one entity pull fails', async () => {
    process.env.INTEGRATION_SYNC_ENABLE_LIVE = 'true';
    process.env.PRACTICEPANTHER_API_BASE_URL = 'https://practicepanther.example/api';
    (global.fetch as jest.Mock)
      .mockResolvedValueOnce(mockResponse(500, 'upstream error'))
      .mockResolvedValueOnce(
        mockResponse(200, {
          items: [{ id: 'matter-1', modified_at: '2026-02-05T10:00:00.000Z' }],
        }),
      );

    const connector = new PracticePantherConnector();
    const result = await connector.sync({
      connectionId: 'conn-practicepanther',
      accessToken: 'pp-token',
      cursor: '2026-01-10T00:00:00.000Z',
    });

    expect(result.importedCount).toBe(1);
    expect(result.nextCursor).toBe('2026-02-05T10:00:00.000Z');
    expect(result.warnings?.some((warning) => warning.includes('status 500'))).toBe(true);
    expect(result.warnings).toContain(
      'PracticePanther sync currently maps contacts and matters only; additional entity pulls remain pending.',
    );
  });

  it('registers Filevine webhooks in live mode when registration url is configured', async () => {
    process.env.INTEGRATION_SYNC_ENABLE_LIVE = 'true';
    process.env.FILEVINE_WEBHOOK_REGISTER_URL = 'https://filevine.example/webhooks';
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockResponse(201, {
        data: { subscription_id: 'fv-sub-123' },
      }),
    );

    const connector = new FilevineConnector();
    const result = await connector.subscribeWebhooks({
      connectionId: 'conn-filevine',
      event: 'matter.updated',
      targetUrl: 'https://karen.example/webhooks/filevine',
      accessToken: 'filevine-token',
    });

    expect(result.subscriptionId).toBe('fv-sub-123');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://filevine.example/webhooks',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer filevine-token',
        }),
      }),
    );
  });

  it('requires access token for Filevine webhook registration in live mode', async () => {
    process.env.INTEGRATION_SYNC_ENABLE_LIVE = 'true';
    const connector = new FilevineConnector();

    await expect(
      connector.subscribeWebhooks({
        connectionId: 'conn-filevine',
        event: 'matter.updated',
        targetUrl: 'https://karen.example/webhooks/filevine',
      }),
    ).rejects.toThrow('Filevine webhook subscription requires an access token');
  });

  it('registers PracticePanther webhooks in live mode with config override', async () => {
    process.env.INTEGRATION_SYNC_ENABLE_LIVE = 'true';
    (global.fetch as jest.Mock).mockResolvedValueOnce(
      mockResponse(200, {
        subscriptionId: 'pp-sub-777',
      }),
    );

    const connector = new PracticePantherConnector();
    const result = await connector.subscribeWebhooks({
      connectionId: 'conn-practicepanther',
      event: 'contact.created',
      targetUrl: 'https://karen.example/webhooks/practicepanther',
      accessToken: 'pp-token',
      config: {
        webhookRegistrationUrl: 'https://practicepanther.example/webhooks',
      },
    });

    expect(result.subscriptionId).toBe('pp-sub-777');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://practicepanther.example/webhooks',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          Authorization: 'Bearer pp-token',
        }),
      }),
    );
  });

  it('surfaces PracticePanther webhook registration failures in live mode', async () => {
    process.env.INTEGRATION_SYNC_ENABLE_LIVE = 'true';
    process.env.PRACTICEPANTHER_WEBHOOK_REGISTER_URL = 'https://practicepanther.example/webhooks';
    (global.fetch as jest.Mock).mockResolvedValueOnce(mockResponse(502, 'upstream unavailable'));

    const connector = new PracticePantherConnector();

    await expect(
      connector.subscribeWebhooks({
        connectionId: 'conn-practicepanther',
        event: 'matter.updated',
        targetUrl: 'https://karen.example/webhooks/practicepanther',
        accessToken: 'pp-token',
      }),
    ).rejects.toThrow('PracticePanther webhook registration failed (502)');
  });
});

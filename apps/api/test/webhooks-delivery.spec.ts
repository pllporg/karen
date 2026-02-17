import { createHmac } from 'node:crypto';
import { WebhooksService } from '../src/webhooks/webhooks.service';

describe('WebhooksService delivery hardening', () => {
  beforeEach(() => {
    process.env.WEBHOOK_DELIVERY_MAX_ATTEMPTS = '3';
    process.env.WEBHOOK_DELIVERY_RETRY_BASE_DELAY_MS = '0';
  });

  afterEach(() => {
    delete process.env.WEBHOOK_DELIVERY_MAX_ATTEMPTS;
    delete process.env.WEBHOOK_DELIVERY_RETRY_BASE_DELAY_MS;
    jest.restoreAllMocks();
  });

  it('retries failed deliveries and marks delivered on subsequent success', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 500 })
      .mockResolvedValueOnce({ ok: true, status: 200 });
    (global as any).fetch = fetchMock;

    const prisma = {
      webhookEndpoint: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'endpoint-1', organizationId: 'org-1', url: 'https://webhook.test/receive', secret: 'top-secret' },
        ]),
      },
      webhookDelivery: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'delivery-1' }),
        update: jest.fn().mockResolvedValue({ id: 'delivery-1' }),
      },
    } as any;

    const service = new WebhooksService(prisma);
    await service.emit(
      'org-1',
      'record.updated',
      { entityType: 'matter', entityId: 'matter-1', action: 'matter.updated' },
      { idempotencyKey: 'evt-1' },
    );

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(prisma.webhookDelivery.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          idempotencyKey: 'record.updated:endpoint-1:evt-1',
        }),
      }),
    );

    const statuses = prisma.webhookDelivery.update.mock.calls.map((call: any[]) => call[0].data.status);
    expect(statuses).toEqual(['RETRYING', 'DELIVERED']);
    const attemptCounts = prisma.webhookDelivery.update.mock.calls.map((call: any[]) => call[0].data.attemptCount);
    expect(attemptCounts).toEqual([1, 2]);
  });

  it('skips duplicate emit when delivery with same idempotency key already exists', async () => {
    const fetchMock = jest.fn();
    (global as any).fetch = fetchMock;

    const prisma = {
      webhookEndpoint: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'endpoint-1', organizationId: 'org-1', url: 'https://webhook.test/receive', secret: 'top-secret' },
        ]),
      },
      webhookDelivery: {
        findFirst: jest.fn().mockResolvedValue({ id: 'delivery-existing', status: 'DELIVERED' }),
        create: jest.fn(),
        update: jest.fn(),
      },
    } as any;

    const service = new WebhooksService(prisma);
    await service.emit(
      'org-1',
      'record.created',
      { entityType: 'invoice', entityId: 'invoice-1', action: 'invoice.created' },
      { idempotencyKey: 'evt-existing' },
    );

    expect(prisma.webhookDelivery.create).not.toHaveBeenCalled();
    expect(prisma.webhookDelivery.update).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('sends versioned signature headers that match payload body', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 202 });
    (global as any).fetch = fetchMock;

    const endpoint = {
      id: 'endpoint-1',
      organizationId: 'org-1',
      url: 'https://webhook.test/receive',
      secret: 'signing-secret',
    };
    const prisma = {
      webhookEndpoint: {
        findMany: jest.fn().mockResolvedValue([endpoint]),
      },
      webhookDelivery: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockResolvedValue({ id: 'delivery-1' }),
        update: jest.fn().mockResolvedValue({ id: 'delivery-1' }),
      },
    } as any;

    const service = new WebhooksService(prisma);
    const payload = {
      entityType: 'contact',
      entityId: 'contact-1',
      action: 'contact.updated',
    };
    await service.emit('org-1', 'record.updated', payload, { idempotencyKey: 'evt-signature' });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const request = fetchMock.mock.calls[0][1];
    const headers = request.headers as Record<string, string>;
    const body = request.body as string;
    const timestamp = headers['x-karen-signature-timestamp'];
    const signature = headers['x-karen-signature-v1'];
    const expectedSignature = createHmac('sha256', endpoint.secret).update(`${timestamp}.${body}`).digest('hex');

    expect(headers['x-karen-delivery-id']).toBe('delivery-1');
    expect(headers['x-karen-idempotency-key']).toBe('record.updated:endpoint-1:evt-signature');
    expect(headers['x-karen-event-type']).toBe('record.updated');
    expect(signature).toBe(expectedSignature);
  });

  it('lists deliveries scoped to organization with optional filters', async () => {
    const prisma = {
      webhookDelivery: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as any;

    const service = new WebhooksService(prisma);
    await service.listDeliveries('org-1', {
      endpointId: 'endpoint-1',
      status: 'FAILED',
      limit: 25,
    });

    expect(prisma.webhookDelivery.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          webhookEndpoint: expect.objectContaining({
            organizationId: 'org-1',
          }),
          webhookEndpointId: 'endpoint-1',
          status: 'FAILED',
        }),
        take: 25,
      }),
    );
  });

  it('retries a failed delivery and returns refreshed delivery details', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true, status: 200 });
    (global as any).fetch = fetchMock;

    const delivery = {
      id: 'delivery-1',
      status: 'FAILED',
      eventType: 'record.updated',
      idempotencyKey: 'record.updated:endpoint-1:evt-1',
      payloadJson: { entityType: 'matter', entityId: 'matter-1' },
      webhookEndpoint: {
        id: 'endpoint-1',
        url: 'https://webhook.test/receive',
        secret: 'retry-secret',
        isActive: true,
      },
    };
    const prisma = {
      webhookDelivery: {
        findFirst: jest.fn().mockResolvedValue(delivery),
        update: jest.fn().mockResolvedValue({ id: 'delivery-1' }),
        findUnique: jest.fn().mockResolvedValue({
          id: 'delivery-1',
          status: 'DELIVERED',
          attemptCount: 1,
          responseCode: 200,
          webhookEndpoint: {
            id: 'endpoint-1',
            url: 'https://webhook.test/receive',
            isActive: true,
          },
        }),
      },
    } as any;

    const service = new WebhooksService(prisma);
    const result = await service.retryDelivery('org-1', 'delivery-1');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(prisma.webhookDelivery.update.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        where: { id: 'delivery-1' },
        data: expect.objectContaining({
          status: 'PENDING',
          attemptCount: 0,
        }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        id: 'delivery-1',
        status: 'DELIVERED',
      }),
    );
  });

  it('rejects manual retry for non-retryable delivery status', async () => {
    const prisma = {
      webhookDelivery: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'delivery-1',
          status: 'DELIVERED',
          eventType: 'record.updated',
          idempotencyKey: 'record.updated:endpoint-1:evt-1',
          payloadJson: { entityType: 'matter', entityId: 'matter-1' },
          webhookEndpoint: {
            id: 'endpoint-1',
            url: 'https://webhook.test/receive',
            secret: 'retry-secret',
            isActive: true,
          },
        }),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
    } as any;

    const service = new WebhooksService(prisma);
    await expect(service.retryDelivery('org-1', 'delivery-1')).rejects.toThrow(
      'Only FAILED or RETRYING deliveries can be retried',
    );
    expect(prisma.webhookDelivery.update).not.toHaveBeenCalled();
  });

  it('enforces organization isolation for manual retry', async () => {
    const prisma = {
      webhookDelivery: {
        findFirst: jest.fn().mockResolvedValue(null),
        update: jest.fn(),
        findUnique: jest.fn(),
      },
    } as any;

    const service = new WebhooksService(prisma);
    await expect(service.retryDelivery('org-1', 'delivery-foreign')).rejects.toThrow('Webhook delivery not found');
    expect(prisma.webhookDelivery.update).not.toHaveBeenCalled();
  });
});

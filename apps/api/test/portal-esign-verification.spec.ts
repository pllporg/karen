import { createHmac } from 'node:crypto';
import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { PortalService } from '../src/portal/portal.service';

function buildClientUser() {
  return {
    id: 'user-client-1',
    organizationId: 'org-1',
    membership: {
      contactId: 'contact-1',
      role: {
        name: 'Client',
      },
    },
  } as any;
}

describe('PortalService e-sign verification hardening', () => {
  afterEach(() => {
    delete process.env.ESIGN_PROVIDER;
    delete process.env.ESIGN_STUB_WEBHOOK_SECRET;
    delete process.env.ESIGN_SANDBOX_WEBHOOK_SECRET;
  });

  it('scopes envelope listing to client-visible matters and rejects out-of-scope filters', async () => {
    const prisma = {
      matterParticipant: {
        findMany: jest.fn().mockResolvedValue([{ matterId: 'matter-1' }]),
      },
      eSignEnvelope: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'env-1',
            matterId: 'matter-1',
            status: 'SENT',
            provider: 'sandbox',
          },
        ]),
      },
    } as any;

    const service = new PortalService(
      prisma,
      { upload: jest.fn(), signedDownloadUrl: jest.fn() } as any,
      { scan: jest.fn() } as any,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
    );

    const listed = await service.listPortalEsignEnvelopes({
      user: buildClientUser(),
    });
    expect(listed).toHaveLength(1);
    expect(prisma.eSignEnvelope.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: 'org-1',
          matterId: { in: ['matter-1'] },
        }),
      }),
    );

    await expect(
      service.listPortalEsignEnvelopes({
        user: buildClientUser(),
        matterId: 'matter-2',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.eSignEnvelope.findMany).toHaveBeenCalledTimes(1);
  });

  it('treats duplicate webhook event ids as idempotent updates', async () => {
    process.env.ESIGN_SANDBOX_WEBHOOK_SECRET = 'sandbox-secret';

    const payload = {
      externalId: 'sandbox-ext-dup',
      status: 'SIGNED',
      eventId: 'evt-dup',
    };
    const signature = createHmac('sha256', process.env.ESIGN_SANDBOX_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    const prisma = {
      eSignEnvelope: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'env-dup',
          organizationId: 'org-1',
          matterId: 'matter-1',
          status: 'SIGNED',
          provider: 'sandbox',
          externalId: 'sandbox-ext-dup',
          payloadJson: {
            statusHistory: [{ from: 'SENT', to: 'SIGNED', source: 'provider_webhook' }],
            webhookEvents: ['evt-dup'],
          },
        }),
        update: jest.fn(),
      },
    } as any;

    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new PortalService(
      prisma,
      { upload: jest.fn(), signedDownloadUrl: jest.fn() } as any,
      { scan: jest.fn() } as any,
      audit,
    );

    const result = await service.handleEsignWebhook({
      providerKey: 'sandbox',
      headers: {
        'x-esign-signature': signature,
      },
      payload,
    });

    expect(result).toEqual({
      ok: true,
      envelopeId: 'env-dup',
      status: 'SIGNED',
    });
    expect(prisma.eSignEnvelope.update).not.toHaveBeenCalled();
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'portal.esign.webhook.processed',
        entityType: 'e_sign_envelope',
        entityId: 'env-dup',
      }),
    );
  });

  it('captures status history and provider poll metadata during refresh', async () => {
    const prisma = {
      matterParticipant: {
        findMany: jest.fn().mockResolvedValue([{ matterId: 'matter-1' }]),
      },
      eSignEnvelope: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'env-refresh-1',
            organizationId: 'org-1',
            matterId: 'matter-1',
            status: 'SENT',
            provider: 'sandbox',
            externalId: 'sandbox-refresh-1',
            payloadJson: {
              sandboxStatus: 'SIGNED',
              statusHistory: [{ from: 'DRAFT', to: 'SENT', source: 'provider_create' }],
              webhookEvents: [],
            },
          })
          .mockResolvedValueOnce({
            id: 'env-refresh-1',
            organizationId: 'org-1',
            matterId: 'matter-1',
            status: 'SENT',
            provider: 'sandbox',
            externalId: 'sandbox-refresh-1',
            payloadJson: {
              sandboxStatus: 'SIGNED',
              statusHistory: [{ from: 'DRAFT', to: 'SENT', source: 'provider_create' }],
              webhookEvents: [],
            },
          }),
        update: jest.fn().mockResolvedValue({
          id: 'env-refresh-1',
          organizationId: 'org-1',
          matterId: 'matter-1',
          status: 'SIGNED',
          provider: 'sandbox',
          externalId: 'sandbox-refresh-1',
          payloadJson: {},
        }),
      },
    } as any;

    const service = new PortalService(
      prisma,
      { upload: jest.fn(), signedDownloadUrl: jest.fn() } as any,
      { scan: jest.fn() } as any,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
    );

    const refreshed = await service.refreshPortalEsignEnvelope({
      user: buildClientUser(),
      envelopeId: 'env-refresh-1',
    });
    expect(refreshed.status).toBe('SIGNED');

    const updateArgs = prisma.eSignEnvelope.update.mock.calls[0]?.[0];
    const payloadJson = updateArgs?.data?.payloadJson as Record<string, unknown>;
    const statusHistory = Array.isArray(payloadJson?.statusHistory) ? payloadJson.statusHistory : [];

    expect(statusHistory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          from: 'SENT',
          to: 'SIGNED',
          source: 'provider_poll',
        }),
      ]),
    );
    expect(payloadJson.providerPoll).toEqual(
      expect.objectContaining({
        mode: 'sandbox',
        at: expect.any(String),
      }),
    );
  });

  it('rejects sandbox webhooks with invalid signatures', async () => {
    process.env.ESIGN_SANDBOX_WEBHOOK_SECRET = 'sandbox-secret';

    const prisma = {
      eSignEnvelope: {
        findFirst: jest.fn(),
      },
    } as any;
    const service = new PortalService(
      prisma,
      { upload: jest.fn(), signedDownloadUrl: jest.fn() } as any,
      { scan: jest.fn() } as any,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
    );

    await expect(
      service.handleEsignWebhook({
        providerKey: 'sandbox',
        headers: {
          'x-esign-signature': 'bad-signature',
        },
        payload: {
          externalId: 'sandbox-ext-bad',
          status: 'SIGNED',
          eventId: 'evt-bad',
        },
      }),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(prisma.eSignEnvelope.findFirst).not.toHaveBeenCalled();
  });
});

import { createHmac } from 'node:crypto';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
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

describe('PortalService', () => {
  afterEach(() => {
    delete process.env.ESIGN_PROVIDER;
    delete process.env.ESIGN_STUB_WEBHOOK_SECRET;
    delete process.env.ESIGN_SANDBOX_WEBHOOK_SECRET;
  });

  it('rejects portal message when matter is not in client participant scope', async () => {
    const prisma = {
      matterParticipant: {
        findMany: jest.fn().mockResolvedValue([{ matterId: 'matter-1' }]),
      },
    } as any;

    const service = new PortalService(
      prisma,
      { upload: jest.fn(), signedDownloadUrl: jest.fn() } as any,
      { scan: jest.fn() } as any,
      { appendEvent: jest.fn() } as any,
    );

    await expect(
      service.sendPortalMessage({
        user: buildClientUser(),
        matterId: 'matter-2',
        body: 'Client message',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('links validated shared attachments when sending portal message', async () => {
    const prisma = {
      matterParticipant: {
        findMany: jest.fn().mockResolvedValue([{ matterId: 'matter-1' }]),
      },
      documentVersion: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'ver-1',
            document: {
              id: 'doc-1',
              matterId: 'matter-1',
              sharedWithClient: true,
            },
          },
        ]),
      },
      communicationThread: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'thread-1',
          organizationId: 'org-1',
          matterId: 'matter-1',
        }),
      },
      communicationMessage: {
        create: jest.fn().mockResolvedValue({
          id: 'message-1',
          attachments: [{ documentVersionId: 'ver-1' }],
        }),
      },
    } as any;

    const service = new PortalService(
      prisma,
      { upload: jest.fn(), signedDownloadUrl: jest.fn() } as any,
      { scan: jest.fn() } as any,
      { appendEvent: jest.fn() } as any,
    );

    await service.sendPortalMessage({
      user: buildClientUser(),
      matterId: 'matter-1',
      body: 'Please review this file',
      attachmentVersionIds: ['ver-1', 'ver-1'],
    });

    expect(prisma.documentVersion.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ['ver-1'] },
        }),
      }),
    );
    expect(prisma.communicationMessage.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          attachments: {
            createMany: {
              data: [{ documentVersionId: 'ver-1' }],
            },
          },
        }),
      }),
    );
  });

  it('uploads portal attachment as shared-with-client document', async () => {
    const prisma = {
      matterParticipant: {
        findMany: jest.fn().mockResolvedValue([{ matterId: 'matter-1' }]),
      },
      document: {
        create: jest.fn().mockResolvedValue({ id: 'doc-1' }),
      },
      documentVersion: {
        create: jest.fn().mockResolvedValue({ id: 'ver-1' }),
      },
    } as any;

    const service = new PortalService(
      prisma,
      {
        upload: jest.fn().mockResolvedValue({ key: 'org/org-1/matter/matter-1/portal/file-1' }),
        signedDownloadUrl: jest.fn(),
      } as any,
      {
        scan: jest.fn().mockResolvedValue({ clean: true, provider: 'stub' }),
      } as any,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
    );

    const result = await service.uploadPortalAttachment({
      user: buildClientUser(),
      matterId: 'matter-1',
      title: 'Client Exhibit A',
      tags: ['defect-photo'],
      file: {
        buffer: Buffer.from('test-file'),
        mimetype: 'image/jpeg',
        originalname: 'photo.jpg',
        size: 9,
      } as any,
    });

    expect(result).toEqual(
      expect.objectContaining({
        document: expect.objectContaining({ id: 'doc-1' }),
        version: expect.objectContaining({ id: 'ver-1' }),
      }),
    );
    expect(prisma.document.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          sharedWithClient: true,
          tags: expect.arrayContaining(['portal', 'client-upload', 'defect-photo']),
        }),
      }),
    );
  });

  it('returns signed download url only for client-visible portal attachments', async () => {
    const prisma = {
      matterParticipant: {
        findMany: jest.fn().mockResolvedValue([{ matterId: 'matter-1' }]),
      },
      documentVersion: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'ver-1',
          storageKey: 'org/org-1/matter/matter-1/portal/file-1',
        }),
      },
    } as any;

    const service = new PortalService(
      prisma,
      {
        upload: jest.fn(),
        signedDownloadUrl: jest.fn().mockResolvedValue('https://files.local/ver-1'),
      } as any,
      { scan: jest.fn() } as any,
      { appendEvent: jest.fn() } as any,
    );

    const result = await service.getPortalAttachmentDownloadUrl({
      user: buildClientUser(),
      documentVersionId: 'ver-1',
    });

    expect(result).toEqual({ url: 'https://files.local/ver-1' });
  });

  it('rejects download for attachments outside client visibility scope', async () => {
    const prisma = {
      matterParticipant: {
        findMany: jest.fn().mockResolvedValue([{ matterId: 'matter-1' }]),
      },
      documentVersion: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    } as any;

    const service = new PortalService(
      prisma,
      { upload: jest.fn(), signedDownloadUrl: jest.fn() } as any,
      { scan: jest.fn() } as any,
      { appendEvent: jest.fn() } as any,
    );

    await expect(
      service.getPortalAttachmentDownloadUrl({
        user: buildClientUser(),
        documentVersionId: 'ver-secret',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('creates an e-sign envelope through provider abstraction with stub fallback', async () => {
    process.env.ESIGN_PROVIDER = 'stub';

    const prisma = {
      matterParticipant: {
        findMany: jest.fn().mockResolvedValue([{ matterId: 'matter-1' }]),
      },
      engagementLetterTemplate: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'tpl-1',
          name: 'Engagement Letter',
          bodyTemplate: 'Terms...',
        }),
      },
      eSignEnvelope: {
        create: jest.fn().mockResolvedValue({
          id: 'env-1',
          organizationId: 'org-1',
          engagementLetterTemplateId: 'tpl-1',
          matterId: 'matter-1',
          status: 'DRAFT',
          provider: 'stub',
          externalId: null,
          payloadJson: {
            statusHistory: [{ from: null, to: 'DRAFT', source: 'system' }],
            webhookEvents: [],
          },
        }),
        findFirst: jest.fn().mockResolvedValue({
          id: 'env-1',
          organizationId: 'org-1',
          engagementLetterTemplateId: 'tpl-1',
          matterId: 'matter-1',
          status: 'DRAFT',
          provider: 'stub',
          externalId: null,
          payloadJson: {
            statusHistory: [{ from: null, to: 'DRAFT', source: 'system' }],
            webhookEvents: [],
          },
        }),
        update: jest.fn().mockResolvedValue({
          id: 'env-1',
          organizationId: 'org-1',
          engagementLetterTemplateId: 'tpl-1',
          matterId: 'matter-1',
          status: 'PENDING_SIGNATURE',
          provider: 'stub',
          externalId: 'stub-env-1-abc12345',
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

    const created = await service.createEsignEnvelope({
      user: buildClientUser(),
      engagementLetterTemplateId: 'tpl-1',
      matterId: 'matter-1',
    });

    expect(prisma.eSignEnvelope.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          provider: 'stub',
          status: 'DRAFT',
        }),
      }),
    );
    expect(prisma.eSignEnvelope.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PENDING_SIGNATURE',
          externalId: expect.stringMatching(/^stub-env-1-/),
        }),
      }),
    );
    expect(created.status).toBe('PENDING_SIGNATURE');
  });

  it('refreshes envelope status via sandbox provider poll', async () => {
    const prisma = {
      matterParticipant: {
        findMany: jest.fn().mockResolvedValue([{ matterId: 'matter-1' }]),
      },
      eSignEnvelope: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'env-2',
            organizationId: 'org-1',
            matterId: 'matter-1',
            status: 'SENT',
            provider: 'sandbox',
            externalId: 'sandbox-1',
            payloadJson: {
              sandboxStatus: 'SIGNED',
              statusHistory: [{ from: 'DRAFT', to: 'SENT', source: 'provider_create' }],
              webhookEvents: [],
            },
          })
          .mockResolvedValueOnce({
            id: 'env-2',
            organizationId: 'org-1',
            matterId: 'matter-1',
            status: 'SENT',
            provider: 'sandbox',
            externalId: 'sandbox-1',
            payloadJson: {
              sandboxStatus: 'SIGNED',
              statusHistory: [{ from: 'DRAFT', to: 'SENT', source: 'provider_create' }],
              webhookEvents: [],
            },
          }),
        update: jest.fn().mockResolvedValue({
          id: 'env-2',
          organizationId: 'org-1',
          matterId: 'matter-1',
          status: 'SIGNED',
          provider: 'sandbox',
          externalId: 'sandbox-1',
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
      envelopeId: 'env-2',
    });

    expect(prisma.eSignEnvelope.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'SIGNED',
        }),
      }),
    );
    expect(refreshed.status).toBe('SIGNED');
  });

  it('processes sandbox provider webhook with signed payload', async () => {
    process.env.ESIGN_SANDBOX_WEBHOOK_SECRET = 'sandbox-secret';
    const payload = {
      externalId: 'sandbox-ext-1',
      status: 'SIGNED',
      eventId: 'evt-1',
    };
    const signature = createHmac('sha256', process.env.ESIGN_SANDBOX_WEBHOOK_SECRET)
      .update(JSON.stringify(payload))
      .digest('hex');

    const prisma = {
      eSignEnvelope: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'env-3',
            organizationId: 'org-1',
            matterId: 'matter-1',
            status: 'SENT',
            provider: 'sandbox',
            externalId: 'sandbox-ext-1',
            payloadJson: {
              statusHistory: [{ from: 'DRAFT', to: 'SENT', source: 'provider_create' }],
              webhookEvents: [],
            },
          })
          .mockResolvedValueOnce({
            id: 'env-3',
            organizationId: 'org-1',
            matterId: 'matter-1',
            status: 'SENT',
            provider: 'sandbox',
            externalId: 'sandbox-ext-1',
            payloadJson: {
              statusHistory: [{ from: 'DRAFT', to: 'SENT', source: 'provider_create' }],
              webhookEvents: [],
            },
          }),
        update: jest.fn().mockResolvedValue({
          id: 'env-3',
          organizationId: 'org-1',
          matterId: 'matter-1',
          status: 'SIGNED',
          provider: 'sandbox',
          externalId: 'sandbox-ext-1',
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

    const result = await service.handleEsignWebhook({
      providerKey: 'sandbox',
      headers: {
        'x-esign-signature': signature,
      },
      payload,
    });

    expect(result).toEqual({
      ok: true,
      envelopeId: 'env-3',
      status: 'SIGNED',
    });
    expect(prisma.eSignEnvelope.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'SIGNED',
        }),
      }),
    );
  });
});

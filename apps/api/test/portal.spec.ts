import { createHmac } from 'node:crypto';
import { ForbiddenException, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
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

    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new PortalService(
      prisma,
      { upload: jest.fn(), signedDownloadUrl: jest.fn() } as any,
      { scan: jest.fn() } as any,
      audit,
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
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'portal.attachment.linked',
        entityType: 'communicationMessage',
        entityId: 'message-1',
        metadata: expect.objectContaining({
          matterId: 'matter-1',
          threadId: 'thread-1',
          attachmentVersionIds: ['ver-1'],
        }),
      }),
    );
  });

  it('rejects disposed attachments when sending portal message', async () => {
    const prisma = {
      matterParticipant: {
        findMany: jest.fn().mockResolvedValue([{ matterId: 'matter-1' }]),
      },
      documentVersion: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'ver-disposed',
            document: {
              id: 'doc-disposed',
              matterId: 'matter-1',
              sharedWithClient: true,
              dispositionStatus: 'DISPOSED',
            },
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

    await expect(
      service.sendPortalMessage({
        user: buildClientUser(),
        matterId: 'matter-1',
        body: 'Please review this file',
        attachmentVersionIds: ['ver-disposed'],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
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
          document: {
            id: 'doc-1',
            matterId: 'matter-1',
            dispositionStatus: 'ACTIVE',
          },
        }),
      },
    } as any;

    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new PortalService(
      prisma,
      {
        upload: jest.fn(),
        signedDownloadUrl: jest.fn().mockResolvedValue('https://files.local/ver-1'),
      } as any,
      { scan: jest.fn() } as any,
      audit,
    );

    const result = await service.getPortalAttachmentDownloadUrl({
      user: buildClientUser(),
      documentVersionId: 'ver-1',
    });

    expect(result).toEqual({ url: 'https://files.local/ver-1' });
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'portal.attachment.download_url_issued',
        entityType: 'documentVersion',
        entityId: 'ver-1',
        metadata: expect.objectContaining({
          documentId: 'doc-1',
          matterId: 'matter-1',
        }),
      }),
    );
  });

  it('rejects download for disposed portal attachments', async () => {
    const prisma = {
      matterParticipant: {
        findMany: jest.fn().mockResolvedValue([{ matterId: 'matter-1' }]),
      },
      documentVersion: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'ver-disposed',
          storageKey: 'org/org-1/matter/matter-1/portal/file-disposed',
          document: {
            id: 'doc-disposed',
            matterId: 'matter-1',
            dispositionStatus: 'DISPOSED',
          },
        }),
      },
    } as any;

    const service = new PortalService(
      prisma,
      { upload: jest.fn(), signedDownloadUrl: jest.fn() } as any,
      { scan: jest.fn() } as any,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
    );

    await expect(
      service.getPortalAttachmentDownloadUrl({
        user: buildClientUser(),
        documentVersionId: 'ver-disposed',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
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

  it('filters non-shared and disposed message attachments from portal snapshot output', async () => {
    const prisma = {
      matterParticipant: {
        findMany: jest.fn().mockResolvedValue([{ matterId: 'matter-1' }]),
      },
      matter: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      calendarEvent: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      invoice: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      communicationMessage: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'msg-1',
            threadId: 'thread-1',
            type: 'PORTAL_MESSAGE',
            direction: 'INBOUND',
            subject: 'Portal subject',
            body: 'Portal body',
            occurredAt: new Date('2026-02-18T19:00:00.000Z'),
            attachments: [
              {
                id: 'att-safe',
                documentVersionId: 'ver-safe',
                documentVersion: {
                  id: 'ver-safe',
                  mimeType: 'image/jpeg',
                  size: 123,
                  document: {
                    id: 'doc-safe',
                    title: 'Client Photo',
                    sharedWithClient: true,
                    dispositionStatus: 'ACTIVE',
                  },
                },
              },
              {
                id: 'att-hidden',
                documentVersionId: 'ver-hidden',
                documentVersion: {
                  id: 'ver-hidden',
                  mimeType: 'application/pdf',
                  size: 456,
                  document: {
                    id: 'doc-hidden',
                    title: 'Internal Memo',
                    sharedWithClient: false,
                    dispositionStatus: 'ACTIVE',
                  },
                },
              },
              {
                id: 'att-disposed',
                documentVersionId: 'ver-disposed',
                documentVersion: {
                  id: 'ver-disposed',
                  mimeType: 'application/pdf',
                  size: 789,
                  document: {
                    id: 'doc-disposed',
                    title: 'Old Exhibit',
                    sharedWithClient: true,
                    dispositionStatus: 'DISPOSED',
                  },
                },
              },
            ],
          },
        ]),
      },
      document: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      eSignEnvelope: {
        findMany: jest.fn().mockResolvedValue([]),
      },
    } as any;

    const service = new PortalService(
      prisma,
      { upload: jest.fn(), signedDownloadUrl: jest.fn() } as any,
      { scan: jest.fn() } as any,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
    );

    const snapshot = await service.getPortalSnapshot(buildClientUser());
    expect(snapshot.messages).toHaveLength(1);
    expect(snapshot.messages[0].attachments).toEqual([
      expect.objectContaining({
        id: 'att-safe',
        documentVersionId: 'ver-safe',
      }),
    ]);
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

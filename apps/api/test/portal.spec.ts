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
});

import { ForbiddenException } from '@nestjs/common';
import { CommunicationsService } from '../src/communications/communications.service';

function buildUser() {
  return {
    id: 'user-1',
    organizationId: 'org-1',
    membership: { role: { name: 'Attorney' } },
  } as any;
}

describe('CommunicationsService portal attachment rules', () => {
  it('rejects portal message attachments when document is not shared-with-client', async () => {
    const prisma = {
      communicationThread: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'thread-1',
          organizationId: 'org-1',
          matterId: 'matter-1',
        }),
        update: jest.fn(),
      },
      documentVersion: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'ver-1',
            document: {
              id: 'doc-1',
              matterId: 'matter-1',
              sharedWithClient: false,
            },
          },
        ]),
      },
      communicationMessage: {
        create: jest.fn(),
      },
    } as any;

    const service = new CommunicationsService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      { sendEmail: jest.fn(), sendSms: jest.fn() } as any,
    );

    await expect(
      service.createMessage({
        user: buildUser(),
        threadId: 'thread-1',
        type: 'PORTAL_MESSAGE',
        direction: 'OUTBOUND',
        body: 'Portal message',
        attachmentVersionIds: ['ver-1'],
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('allows valid shared portal attachments on matter-linked thread', async () => {
    const prisma = {
      communicationThread: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'thread-1',
          organizationId: 'org-1',
          matterId: 'matter-1',
        }),
        update: jest.fn().mockResolvedValue(undefined),
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
      communicationMessage: {
        create: jest.fn().mockResolvedValue({
          id: 'message-1',
          attachments: [{ documentVersionId: 'ver-1' }],
          participants: [],
        }),
      },
    } as any;

    const service = new CommunicationsService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      { sendEmail: jest.fn(), sendSms: jest.fn() } as any,
    );

    await service.createMessage({
      user: buildUser(),
      threadId: 'thread-1',
      type: 'PORTAL_MESSAGE',
      direction: 'OUTBOUND',
      body: 'Portal message',
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
});

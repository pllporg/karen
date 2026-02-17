import { CommunicationsService } from '../src/communications/communications.service';
import { MessageProviderRequestError } from '../src/communications/providers/resend-email.provider';

function user() {
  return {
    id: 'user-1',
    organizationId: 'org-1',
    membership: { role: { name: 'Attorney' } },
  } as any;
}

describe('CommunicationsService outbound delivery metadata', () => {
  it('persists provider delivery metadata for outbound email', async () => {
    const prisma = {
      communicationThread: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'thread-1',
          organizationId: 'org-1',
          matterId: 'matter-1',
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      communicationMessage: {
        create: jest.fn().mockResolvedValue({
          id: 'msg-1',
          rawSourcePayload: null,
          participants: [],
          attachments: [],
        }),
        update: jest.fn().mockResolvedValue({
          id: 'msg-1',
          rawSourcePayload: {
            delivery: {
              provider: 'resend',
              status: 'queued',
            },
          },
          participants: [],
          attachments: [],
        }),
      },
      contact: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'contact-1',
          primaryEmail: 'recipient@example.com',
          primaryPhone: '+15555550123',
        }),
      },
    } as any;

    const audit = {
      appendEvent: jest.fn().mockResolvedValue(undefined),
    } as any;
    const dispatch = {
      sendEmail: jest.fn().mockResolvedValue({
        id: 'resend-local-id',
        provider: 'resend',
        status: 'queued',
        externalMessageId: 'resend-provider-id',
        raw: { id: 'resend-provider-id' },
      }),
      sendSms: jest.fn(),
    } as any;

    const service = new CommunicationsService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      audit,
      dispatch,
    );

    const result = await service.createMessage({
      user: user(),
      threadId: 'thread-1',
      type: 'EMAIL',
      direction: 'OUTBOUND',
      subject: 'Case status',
      body: 'Body',
      participants: [{ contactId: 'contact-1', role: 'TO' }],
    });

    expect(dispatch.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'recipient@example.com',
      }),
    );
    expect(prisma.communicationMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          rawSourcePayload: expect.objectContaining({
            delivery: expect.objectContaining({
              provider: 'resend',
              status: 'queued',
              providerMessageId: 'resend-provider-id',
            }),
          }),
        }),
      }),
    );
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'communication.delivery.updated',
        entityId: 'msg-1',
      }),
    );
    expect((result.rawSourcePayload as any).delivery.provider).toBe('resend');
  });

  it('records failed status when outbound sms dispatch fails', async () => {
    const prisma = {
      communicationThread: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'thread-1',
          organizationId: 'org-1',
          matterId: 'matter-1',
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      communicationMessage: {
        create: jest.fn().mockResolvedValue({
          id: 'msg-2',
          rawSourcePayload: null,
          participants: [],
          attachments: [],
        }),
        update: jest.fn().mockResolvedValue({
          id: 'msg-2',
          rawSourcePayload: {
            delivery: {
              provider: 'twilio',
              status: 'failed',
            },
          },
          participants: [],
          attachments: [],
        }),
      },
      contact: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'contact-2',
          primaryEmail: 'recipient@example.com',
          primaryPhone: '+15555550123',
        }),
      },
    } as any;

    const audit = {
      appendEvent: jest.fn().mockResolvedValue(undefined),
    } as any;
    const dispatch = {
      sendEmail: jest.fn(),
      sendSms: jest.fn().mockRejectedValue(
        new MessageProviderRequestError('provider timeout', {
          provider: 'twilio',
          retryable: true,
          statusCode: 504,
        }),
      ),
    } as any;

    const service = new CommunicationsService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      audit,
      dispatch,
    );

    const result = await service.createMessage({
      user: user(),
      threadId: 'thread-1',
      type: 'SMS',
      direction: 'OUTBOUND',
      body: 'Body',
      participants: [{ contactId: 'contact-2', role: 'TO' }],
    });

    expect(dispatch.sendSms).toHaveBeenCalledTimes(1);
    expect(prisma.communicationMessage.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          rawSourcePayload: expect.objectContaining({
            delivery: expect.objectContaining({
              provider: 'twilio',
              status: 'failed',
              statusCode: 504,
            }),
          }),
        }),
      }),
    );
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'communication.delivery.failed',
        entityId: 'msg-2',
      }),
    );
    expect((result.rawSourcePayload as any).delivery.status).toBe('failed');
  });
});

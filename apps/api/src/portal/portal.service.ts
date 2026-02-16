import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/types';
import { toJsonValue } from '../common/utils/json.util';

@Injectable()
export class PortalService {
  constructor(private readonly prisma: PrismaService) {}

  async getPortalSnapshot(user: AuthenticatedUser) {
    this.assertClientRole(user);

    const contactId = user.membership.contactId;
    if (!contactId) {
      return {
        matters: [],
        keyDates: [],
        invoices: [],
        payments: [],
        messages: [],
        documents: [],
      };
    }

    const matterParticipants = await this.prisma.matterParticipant.findMany({
      where: {
        organizationId: user.organizationId,
        contactId,
      },
      select: {
        matterId: true,
      },
    });

    const matterIds = matterParticipants.map((item) => item.matterId);

    const [matters, keyDates, invoices, messages, documents] = await Promise.all([
      this.prisma.matter.findMany({
        where: { organizationId: user.organizationId, id: { in: matterIds } },
        include: { stage: true },
      }),
      this.prisma.calendarEvent.findMany({
        where: { organizationId: user.organizationId, matterId: { in: matterIds } },
        orderBy: { startAt: 'asc' },
        take: 20,
      }),
      this.prisma.invoice.findMany({
        where: { organizationId: user.organizationId, matterId: { in: matterIds } },
        include: { payments: true },
      }),
      this.prisma.communicationMessage.findMany({
        where: {
          organizationId: user.organizationId,
          thread: {
            is: {
              matterId: { in: matterIds },
            },
          },
          type: { in: ['PORTAL_MESSAGE'] },
        },
        orderBy: { occurredAt: 'desc' },
        take: 50,
      }),
      this.prisma.document.findMany({
        where: {
          organizationId: user.organizationId,
          matterId: { in: matterIds },
          sharedWithClient: true,
        },
        include: {
          versions: { orderBy: { uploadedAt: 'desc' }, take: 1 },
        },
      }),
    ]);

    const payments = invoices.flatMap((invoice) => invoice.payments);

    return {
      matters,
      keyDates,
      invoices,
      payments,
      messages,
      documents,
    };
  }

  async sendPortalMessage(input: {
    user: AuthenticatedUser;
    matterId: string;
    subject?: string;
    body: string;
  }) {
    this.assertClientRole(input.user);

    const thread =
      (await this.prisma.communicationThread.findFirst({
        where: {
          organizationId: input.user.organizationId,
          matterId: input.matterId,
        },
      })) ||
      (await this.prisma.communicationThread.create({
        data: {
          organizationId: input.user.organizationId,
          matterId: input.matterId,
          subject: input.subject || 'Client Portal Thread',
        },
      }));

    return this.prisma.communicationMessage.create({
      data: {
        organizationId: input.user.organizationId,
        threadId: thread.id,
        type: 'PORTAL_MESSAGE',
        direction: 'INBOUND',
        subject: input.subject,
        body: input.body,
        createdByUserId: input.user.id,
      },
    });
  }

  async submitIntake(input: {
    user: AuthenticatedUser;
    intakeFormDefinitionId: string;
    matterId?: string;
    data: Record<string, unknown>;
  }) {
    this.assertClientRole(input.user);

    return this.prisma.intakeSubmission.create({
      data: {
        organizationId: input.user.organizationId,
        intakeFormDefinitionId: input.intakeFormDefinitionId,
        matterId: input.matterId,
        submittedByContactId: input.user.membership.contactId,
        dataJson: toJsonValue(input.data),
      },
    });
  }

  async createEsignStub(input: {
    user: AuthenticatedUser;
    engagementLetterTemplateId: string;
    matterId?: string;
  }) {
    this.assertClientRole(input.user);

    return this.prisma.eSignEnvelope.create({
      data: {
        organizationId: input.user.organizationId,
        engagementLetterTemplateId: input.engagementLetterTemplateId,
        matterId: input.matterId,
        status: 'PENDING_SIGNATURE',
        provider: 'stub',
        payloadJson: toJsonValue({
          note: 'E-sign integration stub. Replace with provider integration in production.',
        }),
      },
    });
  }

  private assertClientRole(user: AuthenticatedUser) {
    if (user.membership.role?.name !== 'Client') {
      throw new ForbiddenException('Portal access is restricted to Client role');
    }
  }
}

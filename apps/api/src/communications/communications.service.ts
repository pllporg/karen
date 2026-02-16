import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { AuthenticatedUser } from '../common/types';
import { AuditService } from '../audit/audit.service';
import { StubMessageProvider } from './providers/stub-message.provider';

@Injectable()
export class CommunicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly audit: AuditService,
    private readonly messageProvider: StubMessageProvider,
  ) {}

  async listThreads(user: AuthenticatedUser, matterId?: string) {
    if (matterId) {
      await this.access.assertMatterAccess(user, matterId, 'read');
    }

    return this.prisma.communicationThread.findMany({
      where: {
        organizationId: user.organizationId,
        ...(matterId ? { matterId } : {}),
      },
      include: {
        messages: {
          orderBy: { occurredAt: 'desc' },
          take: 10,
          include: {
            participants: true,
            attachments: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async createThread(input: {
    user: AuthenticatedUser;
    matterId?: string;
    contactId?: string;
    subject?: string;
  }) {
    if (input.matterId) {
      await this.access.assertMatterAccess(input.user, input.matterId, 'write');
    }

    const thread = await this.prisma.communicationThread.create({
      data: {
        organizationId: input.user.organizationId,
        matterId: input.matterId,
        contactId: input.contactId,
        subject: input.subject,
      },
    });

    return thread;
  }

  async createMessage(input: {
    user: AuthenticatedUser;
    threadId: string;
    type: 'EMAIL' | 'SMS' | 'CALL_LOG' | 'PORTAL_MESSAGE' | 'INTERNAL_NOTE';
    direction: 'INBOUND' | 'OUTBOUND' | 'INTERNAL';
    subject?: string;
    body: string;
    participants?: Array<{ contactId: string; role: 'FROM' | 'TO' | 'CC' | 'BCC' | 'OTHER' }>;
    attachmentVersionIds?: string[];
  }) {
    const thread = await this.prisma.communicationThread.findFirst({
      where: {
        id: input.threadId,
        organizationId: input.user.organizationId,
      },
    });

    if (!thread) {
      throw new NotFoundException('Thread not found');
    }

    if (thread.matterId) {
      await this.access.assertMatterAccess(input.user, thread.matterId, 'write');
    }

    const message = await this.prisma.communicationMessage.create({
      data: {
        organizationId: input.user.organizationId,
        threadId: input.threadId,
        type: input.type,
        direction: input.direction,
        subject: input.subject,
        body: input.body,
        createdByUserId: input.user.id,
        participants: input.participants
          ? {
              createMany: {
                data: input.participants,
              },
            }
          : undefined,
        attachments: input.attachmentVersionIds?.length
          ? {
              createMany: {
                data: input.attachmentVersionIds.map((versionId) => ({
                  documentVersionId: versionId,
                })),
              },
            }
          : undefined,
      },
      include: {
        participants: true,
        attachments: true,
      },
    });

    await this.prisma.communicationThread.update({
      where: { id: thread.id },
      data: {
        updatedAt: new Date(),
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'communication.message.created',
      entityType: 'communicationMessage',
      entityId: message.id,
      metadata: { type: input.type, direction: input.direction },
    });

    if (input.direction === 'OUTBOUND') {
      if (input.type === 'EMAIL') {
        await this.messageProvider.sendEmail({
          to: input.participants?.[0]?.contactId || 'contact-not-mapped',
          subject: input.subject || 'Message from Karen Legal Suite',
          body: input.body,
        });
      }
      if (input.type === 'SMS') {
        await this.messageProvider.sendSms({
          to: input.participants?.[0]?.contactId || 'contact-not-mapped',
          body: input.body,
        });
      }
    }

    return message;
  }

  async search(user: AuthenticatedUser, query: string, matterId?: string) {
    if (matterId) {
      await this.access.assertMatterAccess(user, matterId, 'read');
    }

    const matterFilter = matterId ? Prisma.sql`AND t."matterId" = ${matterId}` : Prisma.sql``;

    const rows = await this.prisma.$queryRaw<
      Array<{ id: string; threadId: string; subject: string | null; body: string; occurredAt: Date }>
    >(
      Prisma.sql`
        SELECT m.id, m."threadId", m.subject, m.body, m."occurredAt"
        FROM "CommunicationMessage" m
        JOIN "CommunicationThread" t ON t.id = m."threadId"
        WHERE m."organizationId" = ${user.organizationId}
        ${matterFilter}
        AND to_tsvector('english', coalesce(m.subject,'') || ' ' || coalesce(m.body,'')) @@ plainto_tsquery('english', ${query})
        ORDER BY m."occurredAt" DESC
        LIMIT 100
      `,
    );

    return rows;
  }
}

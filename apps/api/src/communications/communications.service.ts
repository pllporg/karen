import { ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { AuthenticatedUser } from '../common/types';
import { AuditService } from '../audit/audit.service';
import { MessageDispatchService } from './providers/message-dispatch.service';
import { MessageProviderRequestError } from './providers/resend-email.provider';
import { SendMessageResult } from './providers/message-provider.interface';

@Injectable()
export class CommunicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly audit: AuditService,
    private readonly messageDispatch: MessageDispatchService,
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

    const attachmentVersionIds = [...new Set(input.attachmentVersionIds || [])];
    if (input.type === 'PORTAL_MESSAGE' && attachmentVersionIds.length > 0) {
      if (!thread.matterId) {
        throw new UnprocessableEntityException('Portal message attachments require a matter-linked thread');
      }
      await this.assertPortalAttachmentEligibility({
        organizationId: input.user.organizationId,
        matterId: thread.matterId,
        attachmentVersionIds,
      });
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
        attachments: attachmentVersionIds.length
          ? {
              createMany: {
                data: attachmentVersionIds.map((versionId) => ({
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

    let nextMessage = message;
    if (input.direction === 'OUTBOUND' && (input.type === 'EMAIL' || input.type === 'SMS')) {
      nextMessage = await this.dispatchOutboundMessage({
        user: input.user,
        thread,
        message,
        type: input.type,
        subject: input.subject,
        body: input.body,
        participants: input.participants || [],
      });
    }

    return nextMessage;
  }

  async search(user: AuthenticatedUser, query: string, matterId?: string) {
    if (matterId) {
      await this.access.assertMatterAccess(user, matterId, 'read');
    }

    const normalizedQuery = this.normalizeSearchQuery(query);
    if (!normalizedQuery) return [];

    const matterFilter = matterId ? Prisma.sql`AND t."matterId" = ${matterId}` : Prisma.sql``;
    const likePattern = `%${this.escapeLikePattern(normalizedQuery)}%`;

    const rows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        threadId: string;
        subject: string | null;
        body: string;
        occurredAt: Date;
        rank: number;
        snippet: string | null;
      }>
    >(
      Prisma.sql`
        WITH query AS (
          SELECT websearch_to_tsquery('english', ${normalizedQuery}) AS q
        )
        SELECT
          m.id,
          m."threadId",
          m.subject,
          m.body,
          m."occurredAt",
          ts_rank_cd(
            to_tsvector('english', coalesce(m.subject,'') || ' ' || coalesce(m.body,'')),
            query.q
          ) AS rank,
          ts_headline(
            'english',
            coalesce(m.subject,'') || ' ' || coalesce(m.body,''),
            query.q,
            'MaxFragments=2, MinWords=3, MaxWords=12, FragmentDelimiter= … '
          ) AS snippet
        FROM "CommunicationMessage" m
        JOIN "CommunicationThread" t ON t.id = m."threadId"
        CROSS JOIN query
        WHERE m."organizationId" = ${user.organizationId}
        ${matterFilter}
        AND query.q <> ''::tsquery
        AND to_tsvector('english', coalesce(m.subject,'') || ' ' || coalesce(m.body,'')) @@ query.q
        ORDER BY rank DESC, m."occurredAt" DESC
        LIMIT 100
      `,
    );

    if (rows.length > 0) {
      return rows.map((row) => ({
        ...row,
        rank: row.rank,
        matchStrategy: 'full_text' as const,
      }));
    }

    const fallbackRows = await this.prisma.$queryRaw<
      Array<{
        id: string;
        threadId: string;
        subject: string | null;
        body: string;
        occurredAt: Date;
      }>
    >(
      Prisma.sql`
        SELECT m.id, m."threadId", m.subject, m.body, m."occurredAt"
        FROM "CommunicationMessage" m
        JOIN "CommunicationThread" t ON t.id = m."threadId"
        WHERE m."organizationId" = ${user.organizationId}
        ${matterFilter}
        AND (
          coalesce(m.subject,'') ILIKE ${likePattern} ESCAPE '\\'
          OR coalesce(m.body,'') ILIKE ${likePattern} ESCAPE '\\'
        )
        ORDER BY m."occurredAt" DESC
        LIMIT 100
      `,
    );

    return fallbackRows.map((row) => ({
      ...row,
      rank: 0,
      snippet: row.subject || row.body.slice(0, 220),
      matchStrategy: 'substring' as const,
    }));
  }

  private async assertPortalAttachmentEligibility(input: {
    organizationId: string;
    matterId: string;
    attachmentVersionIds: string[];
  }) {
    const versions = await this.prisma.documentVersion.findMany({
      where: {
        organizationId: input.organizationId,
        id: { in: input.attachmentVersionIds },
      },
      include: {
        document: true,
      },
    });

    if (versions.length !== input.attachmentVersionIds.length) {
      throw new NotFoundException('One or more portal attachment versions were not found');
    }

    for (const version of versions) {
      if (version.document.matterId !== input.matterId) {
        throw new ForbiddenException('Portal message attachments must belong to the thread matter');
      }
      if (!version.document.sharedWithClient) {
        throw new ForbiddenException('Portal message attachments must be marked shared-with-client');
      }
    }
  }

  private async dispatchOutboundMessage(input: {
    user: AuthenticatedUser;
    thread: { id: string; matterId: string | null };
    message: { id: string; rawSourcePayload: Prisma.JsonValue | null };
    type: 'EMAIL' | 'SMS';
    subject?: string;
    body: string;
    participants: Array<{ contactId: string; role: 'FROM' | 'TO' | 'CC' | 'BCC' | 'OTHER' }>;
  }) {
    const recipient = await this.resolveRecipient(input.user.organizationId, input.type, input.participants);

    if (!recipient.destination) {
      return this.recordDeliveryFailure({
        user: input.user,
        messageId: input.message.id,
        existingRaw: input.message.rawSourcePayload,
        type: input.type,
        provider: 'none',
        errorMessage: recipient.failureReason || `Missing recipient ${input.type === 'EMAIL' ? 'email' : 'phone'}`,
        statusCode: undefined,
      });
    }

    try {
      const sendResult =
        input.type === 'EMAIL'
          ? await this.messageDispatch.sendEmail({
              to: recipient.destination,
              subject: input.subject || 'Message from Karen Legal Suite',
              body: input.body,
            })
          : await this.messageDispatch.sendSms({
              to: recipient.destination,
              body: input.body,
            });

      const updated = await this.prisma.communicationMessage.update({
        where: { id: input.message.id },
        data: {
          rawSourcePayload: this.mergeRawPayload(input.message.rawSourcePayload, {
            delivery: this.buildDeliverySnapshot({
              sendResult,
              type: input.type,
              destination: recipient.destination,
              destinationContactId: recipient.contactId,
            }),
          }),
        },
        include: {
          participants: true,
          attachments: true,
        },
      });

      await this.audit.appendEvent({
        organizationId: input.user.organizationId,
        actorUserId: input.user.id,
        action: 'communication.delivery.updated',
        entityType: 'communicationMessage',
        entityId: input.message.id,
        metadata: {
          type: input.type,
          provider: sendResult.provider,
          status: sendResult.status,
          providerMessageId: sendResult.externalMessageId || sendResult.id,
        },
      });

      return updated;
    } catch (error) {
      const provider = error instanceof MessageProviderRequestError ? error.details.provider : 'unknown';
      const statusCode = error instanceof MessageProviderRequestError ? error.details.statusCode : undefined;
      const message = error instanceof Error ? error.message : 'Unknown provider dispatch failure';
      return this.recordDeliveryFailure({
        user: input.user,
        messageId: input.message.id,
        existingRaw: input.message.rawSourcePayload,
        type: input.type,
        provider,
        errorMessage: message,
        statusCode,
      });
    }
  }

  private async recordDeliveryFailure(input: {
    user: AuthenticatedUser;
    messageId: string;
    existingRaw: Prisma.JsonValue | null;
    type: 'EMAIL' | 'SMS';
    provider: string;
    errorMessage: string;
    statusCode?: number;
  }) {
    const updated = await this.prisma.communicationMessage.update({
      where: { id: input.messageId },
      data: {
        rawSourcePayload: this.mergeRawPayload(input.existingRaw, {
          delivery: {
            provider: input.provider,
            status: 'failed',
            errorMessage: input.errorMessage,
            statusCode: input.statusCode || null,
            attemptedAt: new Date().toISOString(),
          },
        }),
      },
      include: {
        participants: true,
        attachments: true,
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'communication.delivery.failed',
      entityType: 'communicationMessage',
      entityId: input.messageId,
      metadata: {
        type: input.type,
        provider: input.provider,
        errorMessage: input.errorMessage,
        statusCode: input.statusCode || null,
      },
    });

    return updated;
  }

  private async resolveRecipient(
    organizationId: string,
    type: 'EMAIL' | 'SMS',
    participants: Array<{ contactId: string; role: 'FROM' | 'TO' | 'CC' | 'BCC' | 'OTHER' }>,
  ): Promise<{ contactId: string | null; destination: string | null; failureReason?: string }> {
    const participant =
      participants.find((item) => item.role === 'TO' && item.contactId) || participants.find((item) => Boolean(item.contactId));

    if (!participant?.contactId) {
      return {
        contactId: null,
        destination: null,
        failureReason: 'No recipient participant with contactId was supplied',
      };
    }

    const contact = await this.prisma.contact.findFirst({
      where: {
        id: participant.contactId,
        organizationId,
      },
      select: {
        id: true,
        primaryEmail: true,
        primaryPhone: true,
      },
    });

    if (!contact) {
      return {
        contactId: participant.contactId,
        destination: null,
        failureReason: 'Recipient contact was not found in this organization',
      };
    }

    const destination = type === 'EMAIL' ? contact.primaryEmail : contact.primaryPhone;
    if (!destination) {
      return {
        contactId: contact.id,
        destination: null,
        failureReason: `Recipient contact is missing primary ${type === 'EMAIL' ? 'email' : 'phone'}`,
      };
    }

    return {
      contactId: contact.id,
      destination,
    };
  }

  private mergeRawPayload(existing: Prisma.JsonValue | null, patch: Record<string, unknown>): Prisma.InputJsonValue {
    const base =
      existing && typeof existing === 'object' && !Array.isArray(existing)
        ? { ...(existing as Record<string, unknown>) }
        : {};
    return {
      ...base,
      ...patch,
    } as Prisma.InputJsonValue;
  }

  private buildDeliverySnapshot(input: {
    sendResult: SendMessageResult;
    type: 'EMAIL' | 'SMS';
    destination: string;
    destinationContactId: string | null;
  }) {
    return {
      channel: input.type,
      provider: input.sendResult.provider,
      status: input.sendResult.status,
      providerMessageId: input.sendResult.externalMessageId || input.sendResult.id,
      destination: input.destination,
      destinationContactId: input.destinationContactId,
      attemptedAt: new Date().toISOString(),
      deliveredAt: input.sendResult.status === 'sent' ? new Date().toISOString() : null,
      providerResponse: input.sendResult.raw || null,
    };
  }

  private escapeLikePattern(value: string) {
    return value.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
  }

  private normalizeSearchQuery(value: string) {
    const compacted = value.replace(/\s+/g, ' ').trim();
    if (!compacted) return '';
    const maxLength = 512;
    return compacted.length > maxLength ? compacted.slice(0, maxLength) : compacted;
  }
}

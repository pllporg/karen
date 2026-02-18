import { createHash } from 'node:crypto';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { S3Service } from '../files/s3.service';
import { MalwareScanService } from '../files/malware-scan.service';
import { AuthenticatedUser, UploadedFile } from '../common/types';
import { toJsonValue } from '../common/utils/json.util';
import { EsignProviderRegistry } from './esign/esign-provider.registry';
import {
  EsignProviderEnvelopeContext,
  EsignWebhookResult,
  normalizeWebhookHeaders,
} from './esign/esign-provider.interface';

@Injectable()
export class PortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    private readonly malwareScan: MalwareScanService,
    private readonly audit: AuditService,
  ) {}

  private readonly esignProviders = new EsignProviderRegistry();

  async getPortalSnapshot(user: AuthenticatedUser) {
    this.assertClientRole(user);

    const contactId = user.membership.contactId;
    if (!contactId) {
      return this.emptySnapshot();
    }

    const matterIds = await this.getClientMatterIds(user.organizationId, contactId);
    if (matterIds.length === 0) {
      return this.emptySnapshot();
    }

    const [matters, keyDates, invoices, messages, documents, eSignEnvelopes] = await Promise.all([
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
        include: {
          attachments: {
            include: {
              documentVersion: {
                include: {
                  document: true,
                },
              },
            },
          },
        },
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
      this.prisma.eSignEnvelope.findMany({
        where: {
          organizationId: user.organizationId,
          matterId: { in: matterIds },
        },
        include: {
          engagementLetterTemplate: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: 25,
      }),
    ]);

    const payments = invoices.flatMap((invoice) => invoice.payments);
    const portalMessages = messages.map((message) => ({
      id: message.id,
      threadId: message.threadId,
      type: message.type,
      direction: message.direction,
      subject: message.subject,
      body: message.body,
      occurredAt: message.occurredAt,
      attachments: message.attachments.map((attachment) => ({
        id: attachment.id,
        documentVersionId: attachment.documentVersionId,
        title: attachment.documentVersion.document.title,
        mimeType: attachment.documentVersion.mimeType,
        size: attachment.documentVersion.size,
        downloadPath: `/portal/attachments/${attachment.documentVersionId}/download-url`,
      })),
    }));

    const sharedDocuments = documents.map((document) => {
      const latestVersion = document.versions[0] || null;
      return {
        id: document.id,
        matterId: document.matterId,
        title: document.title,
        category: document.category,
        tags: document.tags,
        updatedAt: document.updatedAt,
        latestVersion: latestVersion
          ? {
              id: latestVersion.id,
              mimeType: latestVersion.mimeType,
              size: latestVersion.size,
              uploadedAt: latestVersion.uploadedAt,
              downloadPath: `/portal/attachments/${latestVersion.id}/download-url`,
            }
          : null,
      };
    });

    const envelopes = eSignEnvelopes.map((envelope) => ({
      id: envelope.id,
      matterId: envelope.matterId,
      status: envelope.status,
      provider: envelope.provider,
      externalId: envelope.externalId,
      engagementLetterTemplate: envelope.engagementLetterTemplate,
      createdAt: envelope.createdAt,
      updatedAt: envelope.updatedAt,
    }));

    return {
      matters,
      keyDates,
      invoices,
      payments,
      messages: portalMessages,
      documents: sharedDocuments,
      eSignEnvelopes: envelopes,
    };
  }

  async sendPortalMessage(input: {
    user: AuthenticatedUser;
    matterId: string;
    subject?: string;
    body: string;
    attachmentVersionIds?: string[];
  }) {
    this.assertClientRole(input.user);
    const contactId = this.requireClientContactId(input.user);
    await this.assertClientMatterAccess(input.user.organizationId, contactId, input.matterId);

    const attachmentVersionIds = this.normalizeAttachmentVersionIds(input.attachmentVersionIds);
    if (attachmentVersionIds.length > 0) {
      await this.assertPortalAttachmentEligibility({
        organizationId: input.user.organizationId,
        matterId: input.matterId,
        attachmentVersionIds,
      });
    }

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

    const message = await this.prisma.communicationMessage.create({
      data: {
        organizationId: input.user.organizationId,
        threadId: thread.id,
        type: 'PORTAL_MESSAGE',
        direction: 'INBOUND',
        subject: input.subject,
        body: input.body,
        createdByUserId: input.user.id,
        attachments: attachmentVersionIds.length
          ? {
              createMany: {
                data: attachmentVersionIds.map((documentVersionId) => ({
                  documentVersionId,
                })),
              },
            }
          : undefined,
      },
      include: {
        attachments: true,
      },
    });

    if (attachmentVersionIds.length > 0) {
      await this.audit.appendEvent({
        organizationId: input.user.organizationId,
        actorUserId: input.user.id,
        action: 'portal.attachment.linked',
        entityType: 'communicationMessage',
        entityId: message.id,
        metadata: {
          matterId: input.matterId,
          threadId: thread.id,
          attachmentVersionIds,
          source: 'client_portal',
        },
      });
    }

    return message;
  }

  async uploadPortalAttachment(input: {
    user: AuthenticatedUser;
    matterId: string;
    file: UploadedFile;
    title?: string;
    category?: string;
    tags?: string[];
  }) {
    this.assertClientRole(input.user);
    if (!input.file) {
      throw new UnprocessableEntityException('Attachment file is required');
    }
    const contactId = this.requireClientContactId(input.user);
    await this.assertClientMatterAccess(input.user.organizationId, contactId, input.matterId);

    const scan = await this.malwareScan.scan(input.file.buffer, input.file.originalname);
    if (!scan.clean) {
      await this.audit.appendEvent({
        organizationId: input.user.organizationId,
        actorUserId: input.user.id,
        action: 'portal.attachment.upload.blocked',
        entityType: 'matter',
        entityId: input.matterId,
        metadata: {
          filename: input.file.originalname,
          reason: scan.reason ?? 'File failed malware scan',
          provider: scan.provider ?? 'unknown',
          signature: scan.signature,
        },
      });
      throw new UnprocessableEntityException(scan.reason ?? 'File failed malware scan');
    }

    const uploaded = await this.s3.upload(
      input.file.buffer,
      input.file.mimetype,
      `org/${input.user.organizationId}/matter/${input.matterId}/portal`,
    );
    const checksum = createHash('sha256').update(input.file.buffer).digest('hex');
    const tags = this.normalizeTags(['portal', 'client-upload', ...(input.tags || [])]);
    const title = input.title?.trim() || input.file.originalname;

    const document = await this.prisma.document.create({
      data: {
        organizationId: input.user.organizationId,
        matterId: input.matterId,
        title,
        category: input.category || 'Portal Attachment',
        tags,
        sharedWithClient: true,
        createdByUserId: input.user.id,
      },
    });

    const version = await this.prisma.documentVersion.create({
      data: {
        organizationId: input.user.organizationId,
        documentId: document.id,
        storageKey: uploaded.key,
        sha256: checksum,
        mimeType: input.file.mimetype,
        size: input.file.size,
        uploadedByUserId: input.user.id,
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'portal.attachment.uploaded',
      entityType: 'document',
      entityId: document.id,
      metadata: {
        matterId: input.matterId,
        documentVersionId: version.id,
        source: 'client_portal',
      },
    });

    return { document, version };
  }

  async getPortalAttachmentDownloadUrl(input: {
    user: AuthenticatedUser;
    documentVersionId: string;
  }) {
    this.assertClientRole(input.user);
    const contactId = this.requireClientContactId(input.user);
    const matterIds = await this.getClientMatterIds(input.user.organizationId, contactId);

    const version = await this.prisma.documentVersion.findFirst({
      where: {
        id: input.documentVersionId,
        organizationId: input.user.organizationId,
        document: {
          sharedWithClient: true,
          matterId: { in: matterIds },
        },
      },
      include: {
        document: {
          select: {
            id: true,
            matterId: true,
          },
        },
      },
    });

    if (!version) {
      throw new NotFoundException('Portal attachment not found');
    }

    const url = await this.s3.signedDownloadUrl(version.storageKey);
    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'portal.attachment.download_url_issued',
      entityType: 'documentVersion',
      entityId: version.id,
      metadata: {
        documentId: version.document.id,
        matterId: version.document.matterId,
        source: 'client_portal',
      },
    });

    return {
      url,
    };
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

  async createEsignEnvelope(input: {
    user: AuthenticatedUser;
    engagementLetterTemplateId: string;
    matterId?: string;
    provider?: string;
  }) {
    this.assertClientRole(input.user);
    const contactId = this.requireClientContactId(input.user);
    if (input.matterId) {
      await this.assertClientMatterAccess(input.user.organizationId, contactId, input.matterId);
    }

    const template = await this.prisma.engagementLetterTemplate.findFirst({
      where: {
        id: input.engagementLetterTemplateId,
        organizationId: input.user.organizationId,
      },
    });
    if (!template) {
      throw new NotFoundException('Engagement letter template not found');
    }

    const provider = this.esignProviders.resolve(input.provider);
    const envelope = await this.prisma.eSignEnvelope.create({
      data: {
        organizationId: input.user.organizationId,
        engagementLetterTemplateId: input.engagementLetterTemplateId,
        matterId: input.matterId,
        status: 'DRAFT',
        provider: provider.key,
        payloadJson: toJsonValue({
          statusHistory: [
            {
              from: null,
              to: 'DRAFT',
              source: 'system',
              at: new Date().toISOString(),
            },
          ],
          webhookEvents: [],
        }),
      },
    });

    const created = await provider.createEnvelope({
      envelopeId: envelope.id,
      organizationId: input.user.organizationId,
      engagementLetterTemplateId: template.id,
      engagementLetterTemplateName: template.name,
      engagementLetterBody: template.bodyTemplate,
      matterId: input.matterId,
      clientContactId: contactId,
    });

    const updated = await this.updateEnvelopeStatusWithHistory({
      envelopeId: envelope.id,
      organizationId: input.user.organizationId,
      toStatus: created.status,
      source: 'provider_create',
      eventId: null,
      externalId: created.externalId,
      mergePayload: {
        signingUrl: created.signingUrl,
        provider: {
          ...(created.metadata || {}),
          createdAt: new Date().toISOString(),
        },
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'portal.esign.created',
      entityType: 'e_sign_envelope',
      entityId: updated.id,
      metadata: {
        provider: provider.key,
        status: updated.status,
        matterId: updated.matterId,
      },
    });

    return updated;
  }

  async listPortalEsignEnvelopes(input: { user: AuthenticatedUser; matterId?: string }) {
    this.assertClientRole(input.user);
    const contactId = this.requireClientContactId(input.user);
    const matterIds = await this.getClientMatterIds(input.user.organizationId, contactId);
    const scopedMatterIds = input.matterId ? matterIds.filter((id) => id === input.matterId) : matterIds;
    if (input.matterId && scopedMatterIds.length === 0) {
      throw new ForbiddenException('Matter is not available in your client portal');
    }
    if (scopedMatterIds.length === 0) {
      return [];
    }

    return this.prisma.eSignEnvelope.findMany({
      where: {
        organizationId: input.user.organizationId,
        matterId: { in: scopedMatterIds },
      },
      include: {
        engagementLetterTemplate: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async refreshPortalEsignEnvelope(input: { user: AuthenticatedUser; envelopeId: string }) {
    this.assertClientRole(input.user);
    const contactId = this.requireClientContactId(input.user);
    const envelope = await this.prisma.eSignEnvelope.findFirst({
      where: {
        id: input.envelopeId,
        organizationId: input.user.organizationId,
      },
    });
    if (!envelope) {
      throw new NotFoundException('E-sign envelope not found');
    }
    if (!envelope.matterId) {
      throw new ForbiddenException('Envelope is not scoped to a portal-visible matter');
    }
    await this.assertClientMatterAccess(input.user.organizationId, contactId, envelope.matterId);

    const provider = this.esignProviders.resolve(envelope.provider);
    const status = await provider.getEnvelopeStatus(this.toProviderEnvelopeContext(envelope));
    const updated = await this.updateEnvelopeStatusWithHistory({
      envelopeId: envelope.id,
      organizationId: envelope.organizationId,
      toStatus: status.status,
      source: 'provider_poll',
      eventId: null,
      mergePayload: {
        providerPoll: {
          at: new Date().toISOString(),
          ...(status.metadata || {}),
        },
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'portal.esign.status.refreshed',
      entityType: 'e_sign_envelope',
      entityId: envelope.id,
      metadata: {
        previousStatus: envelope.status,
        status: updated.status,
        provider: envelope.provider,
      },
    });

    return updated;
  }

  async handleEsignWebhook(input: {
    providerKey: string;
    headers: Record<string, string | string[] | undefined>;
    payload: unknown;
  }) {
    const provider = this.esignProviders.resolve(input.providerKey);
    let webhook: EsignWebhookResult;
    try {
      webhook = provider.parseWebhook({
        headers: normalizeWebhookHeaders(input.headers),
        payload: input.payload,
      });
    } catch (error) {
      throw new BadRequestException((error as Error).message);
    }

    const envelope = await this.prisma.eSignEnvelope.findFirst({
      where: {
        provider: provider.key,
        externalId: webhook.externalId,
      },
    });
    if (!envelope) {
      throw new NotFoundException('E-sign envelope not found for webhook event');
    }

    const updated = await this.updateEnvelopeStatusWithHistory({
      envelopeId: envelope.id,
      organizationId: envelope.organizationId,
      toStatus: webhook.status,
      source: 'provider_webhook',
      eventId: webhook.eventId ?? null,
      mergePayload: {
        providerWebhook: {
          at: new Date().toISOString(),
          ...(webhook.metadata || {}),
        },
      },
    });

    await this.audit.appendEvent({
      organizationId: envelope.organizationId,
      actorUserId: undefined,
      action: 'portal.esign.webhook.processed',
      entityType: 'e_sign_envelope',
      entityId: envelope.id,
      metadata: {
        provider: provider.key,
        eventId: webhook.eventId,
        status: webhook.status,
      },
    });

    return {
      ok: true,
      envelopeId: updated.id,
      status: updated.status,
    };
  }

  private toProviderEnvelopeContext(envelope: {
    id: string;
    organizationId: string;
    externalId: string | null;
    status: string;
    payloadJson: Prisma.JsonValue | null;
  }): EsignProviderEnvelopeContext {
    if (!envelope.externalId) {
      throw new UnprocessableEntityException('E-sign envelope is missing provider external id');
    }
    return {
      id: envelope.id,
      organizationId: envelope.organizationId,
      externalId: envelope.externalId,
      status: envelope.status,
      payloadJson: envelope.payloadJson ?? undefined,
    };
  }

  private async updateEnvelopeStatusWithHistory(input: {
    envelopeId: string;
    organizationId: string;
    toStatus: string;
    source: 'provider_create' | 'provider_poll' | 'provider_webhook' | 'system';
    eventId: string | null;
    externalId?: string;
    mergePayload?: Record<string, unknown>;
  }) {
    const envelope = await this.prisma.eSignEnvelope.findFirst({
      where: {
        id: input.envelopeId,
        organizationId: input.organizationId,
      },
    });
    if (!envelope) {
      throw new NotFoundException('E-sign envelope not found');
    }

    const payload = this.readEnvelopePayload(envelope.payloadJson);
    const webhookEvents = this.readWebhookEvents(payload.webhookEvents);
    if (input.eventId && webhookEvents.includes(input.eventId)) {
      return envelope;
    }

    const statusHistory = this.readStatusHistory(payload.statusHistory);
    const normalizedStatus = input.toStatus.trim().toUpperCase();
    if (envelope.status !== normalizedStatus) {
      statusHistory.push({
        from: envelope.status || null,
        to: normalizedStatus,
        source: input.source,
        at: new Date().toISOString(),
        eventId: input.eventId,
      });
    }

    if (input.eventId) {
      webhookEvents.push(input.eventId);
    }

    const nextPayload: Record<string, unknown> = {
      ...payload,
      ...(input.mergePayload || {}),
      statusHistory,
      webhookEvents,
    };

    return this.prisma.eSignEnvelope.update({
      where: { id: envelope.id },
      data: {
        status: normalizedStatus,
        externalId: input.externalId ?? envelope.externalId,
        payloadJson: toJsonValue(nextPayload),
      },
    });
  }

  private readEnvelopePayload(payloadJson: Prisma.JsonValue | null): Record<string, unknown> {
    if (!payloadJson || typeof payloadJson !== 'object' || Array.isArray(payloadJson)) {
      return {};
    }
    return payloadJson as Record<string, unknown>;
  }

  private readStatusHistory(raw: unknown): Array<Record<string, unknown>> {
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw
      .filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry))
      .map((entry) => entry as Record<string, unknown>);
  }

  private readWebhookEvents(raw: unknown): string[] {
    if (!Array.isArray(raw)) {
      return [];
    }
    return raw.filter((value): value is string => typeof value === 'string' && value.trim().length > 0);
  }

  private assertClientRole(user: AuthenticatedUser) {
    if (user.membership.role?.name !== 'Client') {
      throw new ForbiddenException('Portal access is restricted to Client role');
    }
  }

  private emptySnapshot() {
    return {
      matters: [],
      keyDates: [],
      invoices: [],
      payments: [],
      messages: [],
      documents: [],
      eSignEnvelopes: [],
    };
  }

  private requireClientContactId(user: AuthenticatedUser): string {
    const contactId = user.membership.contactId;
    if (!contactId) {
      throw new ForbiddenException('Client portal user is missing linked contact');
    }
    return contactId;
  }

  private async getClientMatterIds(organizationId: string, contactId: string): Promise<string[]> {
    const matterParticipants = await this.prisma.matterParticipant.findMany({
      where: {
        organizationId,
        contactId,
      },
      select: {
        matterId: true,
      },
    });

    return matterParticipants.map((item) => item.matterId);
  }

  private async assertClientMatterAccess(organizationId: string, contactId: string, matterId: string) {
    const matterIds = await this.getClientMatterIds(organizationId, contactId);
    if (!matterIds.includes(matterId)) {
      throw new ForbiddenException('Matter is not available in your client portal');
    }
  }

  private normalizeAttachmentVersionIds(attachmentVersionIds?: string[]) {
    return [...new Set((attachmentVersionIds || []).map((id) => id.trim()).filter((id) => id.length > 0))];
  }

  private normalizeTags(tags: string[]) {
    return [...new Set(tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0))];
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
      throw new NotFoundException('One or more portal attachments were not found');
    }

    for (const version of versions) {
      if (version.document.matterId !== input.matterId) {
        throw new ForbiddenException('Portal attachments must belong to the selected matter');
      }
      if (!version.document.sharedWithClient) {
        throw new ForbiddenException('Portal attachments must be marked shared-with-client');
      }
    }
  }
}

import { createHash } from 'node:crypto';
import { ForbiddenException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { S3Service } from '../files/s3.service';
import { MalwareScanService } from '../files/malware-scan.service';
import { AuthenticatedUser, UploadedFile } from '../common/types';
import { toJsonValue } from '../common/utils/json.util';

@Injectable()
export class PortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Service,
    private readonly malwareScan: MalwareScanService,
    private readonly audit: AuditService,
  ) {}

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

    return {
      matters,
      keyDates,
      invoices,
      payments,
      messages: portalMessages,
      documents: sharedDocuments,
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

    return this.prisma.communicationMessage.create({
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
    });

    if (!version) {
      throw new NotFoundException('Portal attachment not found');
    }

    return {
      url: await this.s3.signedDownloadUrl(version.storageKey),
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

  private emptySnapshot() {
    return {
      matters: [],
      keyDates: [],
      invoices: [],
      payments: [],
      messages: [],
      documents: [],
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

import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { ContactKind, DocumentConfidentiality } from '@prisma/client';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { AuthenticatedUser, UploadedFile } from '../common/types';
import { S3Service } from '../files/s3.service';
import { MalwareScanService } from '../files/malware-scan.service';
import { AuditService } from '../audit/audit.service';

// Docxtemplater nested expressions (matter.name, customFields.matter.key, etc.)
// are enabled via the angular expression parser.
const expressionParser = require('docxtemplater/expressions.js');

type MergeContact = {
  id: string;
  kind: ContactKind;
  displayName: string;
  primaryEmail: string | null;
  primaryPhone: string | null;
  tags: string[];
  person: {
    firstName: string | null;
    lastName: string | null;
    title: string | null;
    barNumber: string | null;
    licenseJurisdiction: string | null;
  } | null;
  organization: {
    legalName: string;
    dba: string | null;
    website: string | null;
  } | null;
  customFields: Record<string, unknown>;
};

type TemplateMergeContext = {
  generated: {
    at: string;
    byUserId: string;
  };
  matter: {
    id: string;
    matterNumber: string;
    name: string;
    practiceArea: string;
    jurisdiction: string | null;
    venue: string | null;
    status: string;
    openedAt: string;
    closedAt: string | null;
    stage: {
      id: string;
      name: string;
      practiceArea: string;
    } | null;
    matterType: {
      id: string;
      name: string;
    } | null;
  };
  participants: Array<{
    id: string;
    roleKey: string;
    roleLabel: string;
    side: string | null;
    isPrimary: boolean;
    notes: string | null;
    contact: MergeContact;
    representedBy: MergeContact | null;
    lawFirm: MergeContact | null;
  }>;
  contacts: {
    primaryClient: MergeContact | null;
    clientSide: MergeContact[];
    opposingSide: MergeContact[];
    neutral: MergeContact[];
    court: MergeContact[];
    all: MergeContact[];
  };
  customFields: {
    matter: Record<string, unknown>;
    contacts: Record<string, Record<string, unknown>>;
  };
};

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly s3: S3Service,
    private readonly malwareScan: MalwareScanService,
    private readonly audit: AuditService,
  ) {}

  async list(user: AuthenticatedUser, matterId?: string) {
    if (matterId) {
      await this.access.assertMatterAccess(user, matterId, 'read');
    }
    return this.prisma.document.findMany({
      where: {
        organizationId: user.organizationId,
        ...(matterId ? { matterId } : {}),
      },
      include: {
        versions: { orderBy: { uploadedAt: 'desc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async uploadNew(input: {
    user: AuthenticatedUser;
    matterId: string;
    title: string;
    category?: string;
    tags?: string[];
    sharedWithClient?: boolean;
    confidentialityLevel?: DocumentConfidentiality;
    rawSourcePayload?: Record<string, unknown>;
    file: UploadedFile;
  }) {
    await this.access.assertMatterAccess(input.user, input.matterId, 'write');

    const scan = await this.malwareScan.scan(input.file.buffer, input.file.originalname);
    if (!scan.clean) {
      await this.auditBlockedUpload(
        input.user.organizationId,
        input.user.id,
        input.matterId,
        input.file.originalname,
        scan,
      );
      throw new UnprocessableEntityException(scan.reason ?? 'File failed malware scan');
    }

    const uploaded = await this.s3.upload(input.file.buffer, input.file.mimetype, `org/${input.user.organizationId}/matter/${input.matterId}`);
    const checksum = createHash('sha256').update(input.file.buffer).digest('hex');

    const document = await this.prisma.document.create({
      data: {
        organizationId: input.user.organizationId,
        matterId: input.matterId,
        title: input.title,
        category: input.category,
        tags: input.tags ?? [],
        sharedWithClient: input.sharedWithClient ?? false,
        confidentialityLevel: input.confidentialityLevel,
        rawSourcePayload: input.rawSourcePayload as object | undefined,
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
      action: 'document.uploaded',
      entityType: 'document',
      entityId: document.id,
      metadata: {
        versionId: version.id,
      },
    });

    return { document, version };
  }

  async uploadVersion(input: {
    user: AuthenticatedUser;
    documentId: string;
    file: UploadedFile;
  }) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: input.documentId,
        organizationId: input.user.organizationId,
      },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    await this.access.assertMatterAccess(input.user, document.matterId, 'write');

    const scan = await this.malwareScan.scan(input.file.buffer, input.file.originalname);
    if (!scan.clean) {
      await this.auditBlockedUpload(
        input.user.organizationId,
        input.user.id,
        document.matterId,
        input.file.originalname,
        scan,
        input.documentId,
      );
      throw new UnprocessableEntityException(scan.reason ?? 'File failed malware scan');
    }

    const uploaded = await this.s3.upload(input.file.buffer, input.file.mimetype, `org/${input.user.organizationId}/matter/${document.matterId}`);
    const checksum = createHash('sha256').update(input.file.buffer).digest('hex');

    const version = await this.prisma.documentVersion.create({
      data: {
        organizationId: input.user.organizationId,
        documentId: input.documentId,
        storageKey: uploaded.key,
        sha256: checksum,
        mimeType: input.file.mimetype,
        size: input.file.size,
        uploadedByUserId: input.user.id,
      },
    });

    return version;
  }

  async signedDownloadUrl(user: AuthenticatedUser, documentVersionId: string) {
    const version = await this.prisma.documentVersion.findFirst({
      where: {
        id: documentVersionId,
        organizationId: user.organizationId,
      },
      include: {
        document: true,
      },
    });

    if (!version) {
      throw new NotFoundException('Document version not found');
    }

    await this.access.assertMatterAccess(user, version.document.matterId);

    return {
      url: await this.s3.signedDownloadUrl(version.storageKey),
    };
  }

  async createShareLink(input: {
    user: AuthenticatedUser;
    documentId: string;
    expiresInHours?: number;
  }) {
    const document = await this.prisma.document.findFirst({
      where: { id: input.documentId, organizationId: input.user.organizationId },
    });

    if (!document) {
      throw new NotFoundException('Document not found');
    }

    await this.access.assertMatterAccess(input.user, document.matterId, 'write');

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * (input.expiresInHours ?? 24));

    await this.prisma.documentShareLink.create({
      data: {
        organizationId: input.user.organizationId,
        documentId: document.id,
        token,
        expiresAt,
        createdByUserId: input.user.id,
      },
    });

    return {
      token,
      url: `${process.env.WEB_BASE_URL || 'http://localhost:3000'}/shared-doc/${token}`,
      expiresAt,
    };
  }

  async resolveShareLink(token: string) {
    const link = await this.prisma.documentShareLink.findFirst({
      where: {
        token,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        document: {
          include: {
            versions: { orderBy: { uploadedAt: 'desc' }, take: 1 },
          },
        },
      },
    });

    if (!link || link.document.versions.length === 0) {
      throw new NotFoundException('Share link not valid');
    }

    const latest = link.document.versions[0];
    return {
      url: await this.s3.signedDownloadUrl(latest.storageKey),
      documentId: link.document.id,
    };
  }

  async mergeDocxTemplate(input: {
    user: AuthenticatedUser;
    templateVersionId: string;
    mergeData?: Record<string, unknown>;
    strictValidation?: boolean;
    matterId: string;
    title: string;
  }) {
    await this.access.assertMatterAccess(input.user, input.matterId, 'write');

    const template = await this.prisma.documentVersion.findFirst({
      where: {
        id: input.templateVersionId,
        organizationId: input.user.organizationId,
      },
      include: {
        document: true,
      },
    });

    if (!template) {
      throw new NotFoundException('Template document version not found');
    }

    const strictValidation = input.strictValidation ?? true;
    const baseMergeContext = await this.buildTemplateMergeContext(input.user, input.matterId);
    const mergeContext = this.deepMergeRecords(baseMergeContext, input.mergeData ?? {});

    const templateBuffer = await this.s3.getObjectBuffer(template.storageKey);
    const zip = new PizZip(templateBuffer);
    const unresolvedMergeFieldSet = new Set<string>();
    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true,
      parser: expressionParser,
      nullGetter: (part: { value?: string }) => {
        if (part?.value) {
          unresolvedMergeFieldSet.add(String(part.value));
        }
        return '';
      },
    });

    try {
      doc.render(mergeContext);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Template render failed';
      throw new UnprocessableEntityException(`Template render failed: ${message}`);
    }

    const unresolvedMergeFields = this.normalizeMissingTemplateFields(unresolvedMergeFieldSet);
    if (strictValidation && unresolvedMergeFields.length > 0) {
      throw new UnprocessableEntityException(
        `Template merge validation failed. Missing merge fields: ${unresolvedMergeFields.join(', ')}`,
      );
    }

    const generated = doc.getZip().generate({ type: 'nodebuffer' });
    const generatedAt = new Date().toISOString();
    const provenance = {
      generatedBy: 'template-merge',
      generatedAt,
      templateDocumentId: template.document.id,
      templateVersionId: template.id,
      strictValidation,
      unresolvedMergeFields,
      providedMergeDataKeys: Object.keys(input.mergeData ?? {}),
      mergeContextSummary: {
        participantCount: baseMergeContext.participants.length,
        matterCustomFieldCount: Object.keys(baseMergeContext.customFields.matter).length,
        contactCustomFieldContactCount: Object.keys(baseMergeContext.customFields.contacts).length,
      },
    };

    const generatedDocument = await this.uploadNew({
      user: input.user,
      matterId: input.matterId,
      title: input.title,
      category: 'Generated',
      tags: ['generated', 'docx', 'template-merge'],
      sharedWithClient: template.document.sharedWithClient,
      confidentialityLevel: template.document.confidentialityLevel,
      rawSourcePayload: {
        source: 'template-merge',
        template: {
          documentId: template.document.id,
          versionId: template.id,
          storageKey: template.storageKey,
        },
        provenance,
      },
      file: {
        buffer: generated,
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        originalname: `${input.title}.docx`,
        size: generated.byteLength,
      } as UploadedFile,
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'document.template.generated',
      entityType: 'document',
      entityId: generatedDocument.document.id,
      metadata: provenance,
    });

    return {
      ...generatedDocument,
      mergeSummary: {
        strictValidation,
        unresolvedMergeFields,
        mergeContextSummary: provenance.mergeContextSummary,
      },
    };
  }

  async generateSimplePdf(input: {
    user: AuthenticatedUser;
    matterId: string;
    title: string;
    lines: string[];
  }) {
    await this.access.assertMatterAccess(input.user, input.matterId, 'write');

    const pdf = await PDFDocument.create();
    let page = pdf.addPage([595, 842]);
    const font = await pdf.embedFont(StandardFonts.Helvetica);

    let y = 800;
    for (const line of input.lines) {
      page.drawText(line, { x: 40, y, size: 11, font });
      y -= 16;
      if (y < 60) {
        y = 800;
        page = pdf.addPage([595, 842]);
      }
    }

    const bytes = await pdf.save();
    const generatedAt = new Date().toISOString();
    const generatedDocument = await this.uploadNew({
      user: input.user,
      matterId: input.matterId,
      title: input.title,
      category: 'Generated',
      tags: ['generated', 'pdf'],
      rawSourcePayload: {
        source: 'simple-pdf',
        provenance: {
          generatedAt,
          lineCount: input.lines.length,
        },
      },
      file: {
        buffer: Buffer.from(bytes),
        mimetype: 'application/pdf',
        originalname: `${input.title}.pdf`,
        size: bytes.byteLength,
      } as UploadedFile,
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'document.pdf.generated',
      entityType: 'document',
      entityId: generatedDocument.document.id,
      metadata: {
        generatedAt,
        lineCount: input.lines.length,
      },
    });

    return generatedDocument;
  }

  private async buildTemplateMergeContext(user: AuthenticatedUser, matterId: string): Promise<TemplateMergeContext> {
    const matter = await this.prisma.matter.findFirst({
      where: {
        id: matterId,
        organizationId: user.organizationId,
      },
      include: {
        stage: true,
        matterType: true,
        participants: {
          include: {
            participantRoleDefinition: true,
            contact: {
              include: {
                personProfile: true,
                organizationProfile: true,
              },
            },
            representedByContact: {
              include: {
                personProfile: true,
                organizationProfile: true,
              },
            },
            lawFirmContact: {
              include: {
                personProfile: true,
                organizationProfile: true,
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!matter) {
      throw new NotFoundException('Matter not found');
    }

    const contactIds = new Set<string>();
    for (const participant of matter.participants) {
      contactIds.add(participant.contactId);
      if (participant.representedByContactId) {
        contactIds.add(participant.representedByContactId);
      }
      if (participant.lawFirmContactId) {
        contactIds.add(participant.lawFirmContactId);
      }
    }

    const customFieldOrClauses: Array<{ entityType: string; entityId: string | { in: string[] } }> = [
      {
        entityType: 'matter',
        entityId: matter.id,
      },
    ];
    if (contactIds.size > 0) {
      customFieldOrClauses.push({
        entityType: 'contact',
        entityId: { in: Array.from(contactIds) },
      });
    }

    const customFieldValues = await this.prisma.customFieldValue.findMany({
      where: {
        organizationId: user.organizationId,
        OR: customFieldOrClauses,
      },
      include: {
        fieldDefinition: {
          select: {
            key: true,
          },
        },
      },
    });

    const matterCustomFields: Record<string, unknown> = {};
    const contactCustomFields: Record<string, Record<string, unknown>> = {};
    for (const customField of customFieldValues) {
      const fieldKey = customField.fieldDefinition.key;
      if (customField.entityType === 'matter') {
        matterCustomFields[fieldKey] = customField.valueJson as unknown;
        continue;
      }

      if (customField.entityType !== 'contact') {
        continue;
      }

      if (!contactCustomFields[customField.entityId]) {
        contactCustomFields[customField.entityId] = {};
      }
      contactCustomFields[customField.entityId][fieldKey] = customField.valueJson as unknown;
    }

    const participants = matter.participants.map((participant) => ({
      id: participant.id,
      roleKey: participant.participantRoleKey,
      roleLabel: participant.participantRoleDefinition?.label ?? participant.participantRoleKey,
      side: participant.side,
      isPrimary: participant.isPrimary,
      notes: participant.notes,
      contact: this.toMergeContact(participant.contact, contactCustomFields[participant.contact.id]),
      representedBy: participant.representedByContact
        ? this.toMergeContact(
            participant.representedByContact,
            contactCustomFields[participant.representedByContact.id],
          )
        : null,
      lawFirm: participant.lawFirmContact
        ? this.toMergeContact(participant.lawFirmContact, contactCustomFields[participant.lawFirmContact.id])
        : null,
    }));

    const clientSide = this.uniqueContacts(
      participants.filter((participant) => participant.side === 'CLIENT_SIDE').map((participant) => participant.contact),
    );
    const opposingSide = this.uniqueContacts(
      participants
        .filter((participant) => participant.side === 'OPPOSING_SIDE')
        .map((participant) => participant.contact),
    );
    const neutral = this.uniqueContacts(
      participants.filter((participant) => participant.side === 'NEUTRAL').map((participant) => participant.contact),
    );
    const court = this.uniqueContacts(
      participants.filter((participant) => participant.side === 'COURT').map((participant) => participant.contact),
    );

    const all = this.uniqueContacts(
      participants.flatMap((participant) =>
        [participant.contact, participant.representedBy, participant.lawFirm].filter(
          (entry): entry is MergeContact => entry !== null,
        ),
      ),
    );

    const primaryClient = participants.find((participant) => participant.side === 'CLIENT_SIDE' && participant.isPrimary)
      ?.contact ?? clientSide[0] ?? null;

    return {
      generated: {
        at: new Date().toISOString(),
        byUserId: user.id,
      },
      matter: {
        id: matter.id,
        matterNumber: matter.matterNumber,
        name: matter.name,
        practiceArea: matter.practiceArea,
        jurisdiction: matter.jurisdiction,
        venue: matter.venue,
        status: matter.status,
        openedAt: matter.openedAt.toISOString(),
        closedAt: matter.closedAt ? matter.closedAt.toISOString() : null,
        stage: matter.stage
          ? {
              id: matter.stage.id,
              name: matter.stage.name,
              practiceArea: matter.stage.practiceArea,
            }
          : null,
        matterType: matter.matterType
          ? {
              id: matter.matterType.id,
              name: matter.matterType.name,
            }
          : null,
      },
      participants,
      contacts: {
        primaryClient,
        clientSide,
        opposingSide,
        neutral,
        court,
        all,
      },
      customFields: {
        matter: matterCustomFields,
        contacts: contactCustomFields,
      },
    };
  }

  private toMergeContact(
    contact: {
      id: string;
      kind: ContactKind;
      displayName: string;
      primaryEmail: string | null;
      primaryPhone: string | null;
      tags: string[];
      personProfile?: {
        firstName: string | null;
        lastName: string | null;
        title: string | null;
        barNumber: string | null;
        licenseJurisdiction: string | null;
      } | null;
      organizationProfile?: {
        legalName: string;
        dba: string | null;
        website: string | null;
      } | null;
    },
    customFields: Record<string, unknown> = {},
  ): MergeContact {
    return {
      id: contact.id,
      kind: contact.kind,
      displayName: contact.displayName,
      primaryEmail: contact.primaryEmail,
      primaryPhone: contact.primaryPhone,
      tags: contact.tags,
      person: contact.personProfile
        ? {
            firstName: contact.personProfile.firstName,
            lastName: contact.personProfile.lastName,
            title: contact.personProfile.title,
            barNumber: contact.personProfile.barNumber,
            licenseJurisdiction: contact.personProfile.licenseJurisdiction,
          }
        : null,
      organization: contact.organizationProfile
        ? {
            legalName: contact.organizationProfile.legalName,
            dba: contact.organizationProfile.dba,
            website: contact.organizationProfile.website,
          }
        : null,
      customFields,
    };
  }

  private uniqueContacts(contacts: MergeContact[]) {
    const unique = new Map<string, MergeContact>();
    for (const contact of contacts) {
      unique.set(contact.id, contact);
    }
    return Array.from(unique.values());
  }

  private normalizeMissingTemplateFields(rawFields: Iterable<string>) {
    const normalized = new Set<string>();
    for (const rawField of rawFields) {
      const value = rawField.trim();
      if (!value) {
        continue;
      }
      if (!/^[a-zA-Z0-9_.[\]-]+$/.test(value)) {
        continue;
      }
      normalized.add(value);
    }
    return Array.from(normalized).sort((a, b) => a.localeCompare(b));
  }

  private deepMergeRecords<T extends Record<string, unknown>>(base: T, patch: Record<string, unknown>): T {
    const merged: Record<string, unknown> = { ...base };
    for (const [key, value] of Object.entries(patch)) {
      if (this.isRecord(value) && this.isRecord(merged[key])) {
        merged[key] = this.deepMergeRecords(
          merged[key] as Record<string, unknown>,
          value as Record<string, unknown>,
        );
        continue;
      }
      merged[key] = value;
    }
    return merged as T;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }

  private async auditBlockedUpload(
    organizationId: string,
    actorUserId: string,
    matterId: string,
    filename: string,
    scan: {
      provider?: string;
      signature?: string;
      failOpen?: boolean;
      reason?: string;
    },
    documentId?: string,
  ) {
    await this.audit.appendEvent({
      organizationId,
      actorUserId,
      action: 'document.upload.blocked',
      entityType: 'document',
      entityId: documentId ?? matterId,
      metadata: {
        matterId,
        filename,
        provider: scan.provider ?? 'unknown',
        signature: scan.signature,
        failOpen: scan.failOpen ?? false,
        reason: scan.reason ?? 'File failed malware scan',
      },
    });
  }
}

import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { AuthenticatedUser, UploadedFile } from '../common/types';
import { S3Service } from '../files/s3.service';
import { MalwareScanService } from '../files/malware-scan.service';
import { AuditService } from '../audit/audit.service';

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
    mergeData: Record<string, unknown>;
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

    const templateBuffer = await this.s3.getObjectBuffer(template.storageKey);
    const zip = new PizZip(templateBuffer);
    const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true });
    doc.render(input.mergeData);
    const generated = doc.getZip().generate({ type: 'nodebuffer' });

    return this.uploadNew({
      user: input.user,
      matterId: input.matterId,
      title: input.title,
      category: 'Generated',
      tags: ['generated', 'docx'],
      file: {
        buffer: generated,
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        originalname: `${input.title}.docx`,
        size: generated.byteLength,
      } as UploadedFile,
    });
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
    return this.uploadNew({
      user: input.user,
      matterId: input.matterId,
      title: input.title,
      category: 'Generated',
      tags: ['generated', 'pdf'],
      file: {
        buffer: Buffer.from(bytes),
        mimetype: 'application/pdf',
        originalname: `${input.title}.pdf`,
        size: bytes.byteLength,
      } as UploadedFile,
    });
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

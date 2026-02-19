import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { createHash } from 'node:crypto';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import {
  ContactKind,
  DocumentConfidentiality,
  DocumentDispositionItemStatus,
  DocumentDispositionRunStatus,
  DocumentDispositionStatus,
  DocumentLegalHoldStatus,
  RetentionScope,
  RetentionTrigger,
} from '@prisma/client';
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
        retentionPolicy: true,
        legalHolds: {
          where: { status: DocumentLegalHoldStatus.ACTIVE },
          orderBy: { placedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listRetentionPolicies(user: AuthenticatedUser) {
    return this.prisma.documentRetentionPolicy.findMany({
      where: {
        organizationId: user.organizationId,
      },
      include: {
        matter: {
          select: {
            id: true,
            matterNumber: true,
            name: true,
          },
        },
      },
      orderBy: [{ isActive: 'desc' }, { updatedAt: 'desc' }],
    });
  }

  async createRetentionPolicy(input: {
    user: AuthenticatedUser;
    name: string;
    description?: string;
    scope: RetentionScope;
    matterId?: string;
    category?: string;
    retentionDays: number;
    trigger: RetentionTrigger;
    requireApproval?: boolean;
    isActive?: boolean;
  }) {
    if (input.scope === RetentionScope.MATTER && !input.matterId) {
      throw new UnprocessableEntityException('matterId is required when scope is MATTER');
    }
    if (input.scope === RetentionScope.CATEGORY && !input.category?.trim()) {
      throw new UnprocessableEntityException('category is required when scope is CATEGORY');
    }
    if (input.matterId) {
      await this.access.assertMatterAccess(input.user, input.matterId, 'write');
    }

    const policy = await this.prisma.documentRetentionPolicy.create({
      data: {
        organizationId: input.user.organizationId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        scope: input.scope,
        matterId: input.matterId || null,
        category: input.category?.trim() || null,
        retentionDays: input.retentionDays,
        trigger: input.trigger,
        requireApproval: input.requireApproval ?? true,
        isActive: input.isActive ?? true,
        createdByUserId: input.user.id,
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'document.retention_policy.created',
      entityType: 'documentRetentionPolicy',
      entityId: policy.id,
      metadata: {
        scope: policy.scope,
        trigger: policy.trigger,
        retentionDays: policy.retentionDays,
        requireApproval: policy.requireApproval,
      },
    });

    return policy;
  }

  async assignRetentionPolicy(input: {
    user: AuthenticatedUser;
    documentId: string;
    policyId: string;
  }) {
    const document = await this.prisma.document.findFirst({
      where: {
        id: input.documentId,
        organizationId: input.user.organizationId,
      },
      include: {
        matter: {
          select: {
            id: true,
            closedAt: true,
          },
        },
      },
    });
    if (!document) {
      throw new NotFoundException('Document not found');
    }
    if (document.dispositionStatus === DocumentDispositionStatus.DISPOSED) {
      throw new UnprocessableEntityException('Cannot assign retention policy to a disposed document');
    }
    await this.access.assertMatterAccess(input.user, document.matterId, 'write');

    const policy = await this.prisma.documentRetentionPolicy.findFirst({
      where: {
        id: input.policyId,
        organizationId: input.user.organizationId,
        isActive: true,
      },
    });
    if (!policy) {
      throw new NotFoundException('Retention policy not found');
    }
    if (policy.scope === RetentionScope.MATTER && policy.matterId && policy.matterId !== document.matterId) {
      throw new UnprocessableEntityException('Retention policy scope does not match document matter');
    }
    if (policy.scope === RetentionScope.CATEGORY && policy.category && policy.category !== (document.category || '')) {
      throw new UnprocessableEntityException('Retention policy scope does not match document category');
    }

    const retentionEligibleAt = this.computeRetentionEligibleAt({
      trigger: policy.trigger,
      retentionDays: policy.retentionDays,
      documentCreatedAt: document.createdAt,
      matterClosedAt: document.matter.closedAt,
    });

    const updated = await this.prisma.document.update({
      where: { id: document.id },
      data: {
        retentionPolicyId: policy.id,
        retentionEligibleAt,
      },
      include: {
        retentionPolicy: true,
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'document.retention_policy.assigned',
      entityType: 'document',
      entityId: document.id,
      metadata: {
        retentionPolicyId: policy.id,
        retentionEligibleAt: retentionEligibleAt.toISOString(),
      },
    });

    return updated;
  }

  async placeLegalHold(input: {
    user: AuthenticatedUser;
    documentId: string;
    reason: string;
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
    if (document.dispositionStatus === DocumentDispositionStatus.DISPOSED) {
      throw new UnprocessableEntityException('Cannot place legal hold on a disposed document');
    }
    await this.access.assertMatterAccess(input.user, document.matterId, 'write');
    if (!input.reason.trim()) {
      throw new UnprocessableEntityException('Legal hold reason is required');
    }

    const existing = await this.prisma.documentLegalHold.findFirst({
      where: {
        organizationId: input.user.organizationId,
        documentId: document.id,
        status: DocumentLegalHoldStatus.ACTIVE,
      },
    });
    if (existing) {
      return existing;
    }

    const hold = await this.prisma.documentLegalHold.create({
      data: {
        organizationId: input.user.organizationId,
        documentId: document.id,
        matterId: document.matterId,
        reason: input.reason.trim(),
        status: DocumentLegalHoldStatus.ACTIVE,
        placedByUserId: input.user.id,
      },
    });

    await this.prisma.document.update({
      where: { id: document.id },
      data: {
        legalHoldActive: true,
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'document.legal_hold.placed',
      entityType: 'document',
      entityId: document.id,
      metadata: {
        legalHoldId: hold.id,
        reason: hold.reason,
      },
    });

    return hold;
  }

  async releaseLegalHold(input: {
    user: AuthenticatedUser;
    documentId: string;
    reason?: string;
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

    const activeHold = await this.prisma.documentLegalHold.findFirst({
      where: {
        organizationId: input.user.organizationId,
        documentId: document.id,
        status: DocumentLegalHoldStatus.ACTIVE,
      },
      orderBy: {
        placedAt: 'desc',
      },
    });
    if (!activeHold) {
      throw new NotFoundException('Active legal hold not found for document');
    }

    const released = await this.prisma.documentLegalHold.update({
      where: { id: activeHold.id },
      data: {
        status: DocumentLegalHoldStatus.RELEASED,
        releasedByUserId: input.user.id,
        releasedAt: new Date(),
        reason: input.reason?.trim()
          ? `${activeHold.reason}\n\nRelease note: ${input.reason.trim()}`
          : activeHold.reason,
      },
    });

    await this.prisma.document.update({
      where: { id: document.id },
      data: {
        legalHoldActive: false,
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'document.legal_hold.released',
      entityType: 'document',
      entityId: document.id,
      metadata: {
        legalHoldId: released.id,
        releaseReason: input.reason?.trim() || null,
      },
    });

    return released;
  }

  async listDispositionRuns(user: AuthenticatedUser) {
    return this.prisma.documentDispositionRun.findMany({
      where: {
        organizationId: user.organizationId,
      },
      include: {
        policy: true,
        items: {
          include: {
            document: {
              select: {
                id: true,
                title: true,
                matterId: true,
                legalHoldActive: true,
                dispositionStatus: true,
              },
            },
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 25,
    });
  }

  async createDispositionRun(input: {
    user: AuthenticatedUser;
    policyId?: string;
    cutoffAt?: string;
    notes?: string;
  }) {
    const cutoffAt = input.cutoffAt ? new Date(input.cutoffAt) : new Date();
    if (Number.isNaN(cutoffAt.getTime())) {
      throw new UnprocessableEntityException('Invalid cutoffAt');
    }

    let policy = null;
    if (input.policyId) {
      policy = await this.prisma.documentRetentionPolicy.findFirst({
        where: {
          id: input.policyId,
          organizationId: input.user.organizationId,
          isActive: true,
        },
      });
      if (!policy) {
        throw new NotFoundException('Retention policy not found');
      }
    }

    const candidateDocuments = await this.prisma.document.findMany({
      where: {
        organizationId: input.user.organizationId,
        dispositionStatus: {
          not: DocumentDispositionStatus.DISPOSED,
        },
        retentionEligibleAt: {
          lte: cutoffAt,
        },
        ...(policy ? { retentionPolicyId: policy.id } : {}),
      },
      select: {
        id: true,
        matterId: true,
        legalHoldActive: true,
      },
    });

    const accessibleCandidates: Array<{ id: string; legalHoldActive: boolean }> = [];
    for (const candidate of candidateDocuments) {
      try {
        await this.access.assertMatterAccess(input.user, candidate.matterId, 'write');
        accessibleCandidates.push({
          id: candidate.id,
          legalHoldActive: candidate.legalHoldActive,
        });
      } catch {
        continue;
      }
    }

    const runStatus = policy?.requireApproval ?? true
      ? DocumentDispositionRunStatus.PENDING_APPROVAL
      : DocumentDispositionRunStatus.APPROVED;

    const run = await this.prisma.documentDispositionRun.create({
      data: {
        organizationId: input.user.organizationId,
        policyId: policy?.id || null,
        status: runStatus,
        cutoffAt,
        notes: input.notes?.trim() || null,
        requestedByUserId: input.user.id,
        items: {
          create: accessibleCandidates.map((document) => ({
            organizationId: input.user.organizationId,
            documentId: document.id,
            status: document.legalHoldActive
              ? DocumentDispositionItemStatus.SKIPPED_LEGAL_HOLD
              : DocumentDispositionItemStatus.PENDING,
            note: document.legalHoldActive ? 'Skipped because legal hold is active.' : null,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    const pendingDocumentIds = run.items
      .filter((item) => item.status === DocumentDispositionItemStatus.PENDING)
      .map((item) => item.documentId);
    if (pendingDocumentIds.length > 0) {
      await this.prisma.document.updateMany({
        where: {
          id: { in: pendingDocumentIds },
          organizationId: input.user.organizationId,
          dispositionStatus: DocumentDispositionStatus.ACTIVE,
        },
        data: {
          dispositionStatus: DocumentDispositionStatus.PENDING_DISPOSITION,
        },
      });
    }

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'document.disposition_run.created',
      entityType: 'documentDispositionRun',
      entityId: run.id,
      metadata: {
        policyId: policy?.id || null,
        cutoffAt: cutoffAt.toISOString(),
        totalItems: run.items.length,
        pendingItems: run.items.filter((item) => item.status === DocumentDispositionItemStatus.PENDING).length,
        skippedForLegalHold: run.items.filter((item) => item.status === DocumentDispositionItemStatus.SKIPPED_LEGAL_HOLD).length,
      },
    });

    return run;
  }

  async approveDispositionRun(input: {
    user: AuthenticatedUser;
    runId: string;
    notes?: string;
  }) {
    const run = await this.prisma.documentDispositionRun.findFirst({
      where: {
        id: input.runId,
        organizationId: input.user.organizationId,
      },
    });
    if (!run) {
      throw new NotFoundException('Disposition run not found');
    }
    if (run.status !== DocumentDispositionRunStatus.PENDING_APPROVAL && run.status !== DocumentDispositionRunStatus.DRAFT) {
      throw new UnprocessableEntityException('Only draft or pending-approval runs can be approved');
    }

    const approved = await this.prisma.documentDispositionRun.update({
      where: { id: run.id },
      data: {
        status: DocumentDispositionRunStatus.APPROVED,
        approvedByUserId: input.user.id,
        approvedAt: new Date(),
        notes: this.combineNotes(run.notes, input.notes),
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'document.disposition_run.approved',
      entityType: 'documentDispositionRun',
      entityId: approved.id,
      metadata: {
        approvedAt: approved.approvedAt,
      },
    });

    return approved;
  }

  async executeDispositionRun(input: {
    user: AuthenticatedUser;
    runId: string;
    notes?: string;
  }) {
    const run = await this.prisma.documentDispositionRun.findFirst({
      where: {
        id: input.runId,
        organizationId: input.user.organizationId,
      },
      include: {
        items: true,
      },
    });
    if (!run) {
      throw new NotFoundException('Disposition run not found');
    }
    if (run.status !== DocumentDispositionRunStatus.APPROVED) {
      throw new UnprocessableEntityException('Disposition run must be approved before execution');
    }

    const now = new Date();
    const pendingItems = run.items.filter((item) => item.status === DocumentDispositionItemStatus.PENDING);
    const pendingDocumentIds = pendingItems.map((item) => item.documentId);
    const executableDocumentIds: string[] = [];
    const blockedByLegalHoldIds: string[] = [];

    if (pendingDocumentIds.length > 0) {
      const pendingDocuments = await this.prisma.document.findMany({
        where: {
          organizationId: input.user.organizationId,
          id: { in: pendingDocumentIds },
        },
        select: {
          id: true,
          legalHoldActive: true,
          dispositionStatus: true,
        },
      });
      const pendingDocumentById = new Map(pendingDocuments.map((document) => [document.id, document]));
      for (const pendingItem of pendingItems) {
        const document = pendingDocumentById.get(pendingItem.documentId);
        if (!document) {
          continue;
        }
        if (document.legalHoldActive) {
          blockedByLegalHoldIds.push(document.id);
          continue;
        }
        executableDocumentIds.push(document.id);
      }

      if (executableDocumentIds.length > 0) {
        await this.prisma.document.updateMany({
          where: {
            id: { in: executableDocumentIds },
            organizationId: input.user.organizationId,
          },
          data: {
            dispositionStatus: DocumentDispositionStatus.DISPOSED,
            disposedAt: now,
            sharedWithClient: false,
          },
        });

        await this.prisma.documentShareLink.updateMany({
          where: {
            organizationId: input.user.organizationId,
            documentId: { in: executableDocumentIds },
            revokedAt: null,
          },
          data: {
            revokedAt: now,
          },
        });

        await this.prisma.documentDispositionItem.updateMany({
          where: {
            runId: run.id,
            organizationId: input.user.organizationId,
            documentId: { in: executableDocumentIds },
            status: DocumentDispositionItemStatus.PENDING,
          },
          data: {
            status: DocumentDispositionItemStatus.DISPOSED,
            appliedAt: now,
          },
        });
      }

      if (blockedByLegalHoldIds.length > 0) {
        await this.prisma.document.updateMany({
          where: {
            id: { in: blockedByLegalHoldIds },
            organizationId: input.user.organizationId,
            dispositionStatus: DocumentDispositionStatus.PENDING_DISPOSITION,
          },
          data: {
            dispositionStatus: DocumentDispositionStatus.ACTIVE,
          },
        });

        await this.prisma.documentDispositionItem.updateMany({
          where: {
            runId: run.id,
            organizationId: input.user.organizationId,
            documentId: { in: blockedByLegalHoldIds },
            status: DocumentDispositionItemStatus.PENDING,
          },
          data: {
            status: DocumentDispositionItemStatus.SKIPPED_LEGAL_HOLD,
            note: 'Skipped at execution because legal hold is active.',
            appliedAt: now,
          },
        });
      }

    }

    const completed = await this.prisma.documentDispositionRun.update({
      where: { id: run.id },
      data: {
        status: DocumentDispositionRunStatus.COMPLETED,
        executedByUserId: input.user.id,
        executedAt: now,
        notes: this.combineNotes(run.notes, input.notes),
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'document.disposition_run.completed',
      entityType: 'documentDispositionRun',
      entityId: completed.id,
      metadata: {
        executedAt: now.toISOString(),
        disposedCount: executableDocumentIds.length,
        skippedForLegalHoldAtExecution: blockedByLegalHoldIds.length,
      },
    });

    return {
      ...completed,
      disposedDocumentCount: executableDocumentIds.length,
      skippedForLegalHoldCount: blockedByLegalHoldIds.length,
    };
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
    if (document.dispositionStatus === DocumentDispositionStatus.DISPOSED) {
      throw new UnprocessableEntityException('Cannot upload a new version for a disposed document');
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

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'document.version.uploaded',
      entityType: 'documentVersion',
      entityId: version.id,
      metadata: {
        documentId: document.id,
        versionId: version.id,
      },
    });

    return version;
  }

  async updateDocument(input: {
    user: AuthenticatedUser;
    documentId: string;
    title?: string;
    category?: string;
    tags?: string[];
    sharedWithClient?: boolean;
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
    if (document.dispositionStatus === DocumentDispositionStatus.DISPOSED) {
      throw new UnprocessableEntityException('Disposed documents cannot be modified');
    }

    await this.access.assertMatterAccess(input.user, document.matterId, 'write');

    const updated = await this.prisma.document.update({
      where: { id: document.id },
      data: {
        title: input.title,
        category: input.category,
        tags: input.tags,
        sharedWithClient: input.sharedWithClient,
      },
      include: {
        versions: {
          orderBy: { uploadedAt: 'desc' },
          take: 1,
        },
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'document.updated',
      entityType: 'document',
      entityId: updated.id,
      metadata: {
        title: updated.title,
        category: updated.category,
        sharedWithClient: updated.sharedWithClient,
      },
    });

    return updated;
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
    if (version.document.dispositionStatus === DocumentDispositionStatus.DISPOSED) {
      throw new UnprocessableEntityException('Disposed documents are not available for download');
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
    if (document.dispositionStatus === DocumentDispositionStatus.DISPOSED) {
      throw new UnprocessableEntityException('Cannot share a disposed document');
    }

    await this.access.assertMatterAccess(input.user, document.matterId, 'write');

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * (input.expiresInHours ?? 24));

    const shareLink = await this.prisma.documentShareLink.create({
      data: {
        organizationId: input.user.organizationId,
        documentId: document.id,
        token,
        expiresAt,
        createdByUserId: input.user.id,
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'document.share_link.created',
      entityType: 'documentShareLink',
      entityId: shareLink.id,
      metadata: {
        token,
        documentId: document.id,
        expiresAt: expiresAt.toISOString(),
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
    if (link.document.dispositionStatus === DocumentDispositionStatus.DISPOSED) {
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
    if (!this.isDocxTemplateMimeType(template.mimeType)) {
      throw new UnprocessableEntityException('Template document version must be a DOCX file');
    }

    const strictValidation = input.strictValidation ?? true;
    const baseMergeContext = await this.buildTemplateMergeContext(input.user, input.matterId);
    const mergeData = this.sanitizeMergePatch(input.mergeData ?? {});
    const mergeContext = this.deepMergeRecords(baseMergeContext, mergeData);

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
      providedMergeDataKeys: Object.keys(mergeData),
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

  private computeRetentionEligibleAt(input: {
    trigger: RetentionTrigger;
    retentionDays: number;
    documentCreatedAt: Date;
    matterClosedAt: Date | null;
  }) {
    const anchorDate =
      input.trigger === RetentionTrigger.MATTER_CLOSED
        ? input.matterClosedAt
        : input.documentCreatedAt;

    if (!anchorDate) {
      throw new UnprocessableEntityException(
        'Retention trigger requires a closed matter date, but the matter is not closed',
      );
    }

    const eligibleAt = new Date(anchorDate);
    eligibleAt.setUTCDate(eligibleAt.getUTCDate() + input.retentionDays);
    return eligibleAt;
  }

  private combineNotes(existing: string | null | undefined, extra?: string) {
    if (!extra?.trim()) {
      return existing ?? null;
    }
    const normalized = extra.trim();
    if (!existing?.trim()) {
      return normalized;
    }
    return `${existing.trim()}\n\n${normalized}`;
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
      if (this.isUnsafeMergeKey(key)) {
        continue;
      }
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

  private sanitizeMergePatch(patch: Record<string, unknown>) {
    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(patch)) {
      if (this.isUnsafeMergeKey(key)) {
        continue;
      }
      if (this.isRecord(value)) {
        sanitized[key] = this.sanitizeMergePatch(value);
        continue;
      }
      sanitized[key] = value;
    }
    return sanitized;
  }

  private isUnsafeMergeKey(key: string) {
    return key === '__proto__' || key === 'prototype' || key === 'constructor';
  }

  private isDocxTemplateMimeType(mimeType: string | null | undefined) {
    return (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType === 'application/vnd.ms-word.document.macroEnabled.12'
    );
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

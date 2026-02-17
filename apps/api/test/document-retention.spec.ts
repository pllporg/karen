import {
  DocumentDispositionItemStatus,
  DocumentDispositionRunStatus,
  DocumentDispositionStatus,
  DocumentLegalHoldStatus,
  RetentionScope,
  RetentionTrigger,
} from '@prisma/client';
import { DocumentsService } from '../src/documents/documents.service';

const baseUser = {
  id: 'user-1',
  organizationId: 'org-1',
} as any;

describe('DocumentsService retention/legal-hold/disposition workflows', () => {
  it('creates retention policy with audit event', async () => {
    const prisma = {
      documentRetentionPolicy: {
        create: jest.fn().mockResolvedValue({
          id: 'policy-1',
          scope: RetentionScope.ALL_DOCUMENTS,
          trigger: RetentionTrigger.DOCUMENT_UPLOADED,
          retentionDays: 365,
          requireApproval: true,
        }),
      },
    } as any;

    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new DocumentsService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { upload: jest.fn(), signedDownloadUrl: jest.fn(), getObjectBuffer: jest.fn() } as any,
      { scan: jest.fn() } as any,
      audit,
    );

    const created = await service.createRetentionPolicy({
      user: baseUser,
      name: 'Standard 1-year',
      scope: RetentionScope.ALL_DOCUMENTS,
      retentionDays: 365,
      trigger: RetentionTrigger.DOCUMENT_UPLOADED,
    });

    expect(created.id).toBe('policy-1');
    expect(prisma.documentRetentionPolicy.create).toHaveBeenCalled();
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'document.retention_policy.created',
        entityType: 'documentRetentionPolicy',
      }),
    );
  });

  it('assigns retention policy and computes retentionEligibleAt', async () => {
    const documentUpdate = jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'doc-1', ...data }));
    const prisma = {
      document: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'doc-1',
          organizationId: 'org-1',
          matterId: 'matter-1',
          category: 'Evidence',
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
          dispositionStatus: DocumentDispositionStatus.ACTIVE,
          matter: { id: 'matter-1', closedAt: null },
        }),
        update: documentUpdate,
      },
      documentRetentionPolicy: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'policy-1',
          organizationId: 'org-1',
          isActive: true,
          scope: RetentionScope.ALL_DOCUMENTS,
          retentionDays: 30,
          trigger: RetentionTrigger.DOCUMENT_UPLOADED,
        }),
      },
    } as any;

    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const access = { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new DocumentsService(
      prisma,
      access,
      { upload: jest.fn(), signedDownloadUrl: jest.fn(), getObjectBuffer: jest.fn() } as any,
      { scan: jest.fn() } as any,
      audit,
    );

    const updated = await service.assignRetentionPolicy({
      user: baseUser,
      documentId: 'doc-1',
      policyId: 'policy-1',
    });

    expect(access.assertMatterAccess).toHaveBeenCalledWith(baseUser, 'matter-1', 'write');
    expect(updated.retentionPolicyId).toBe('policy-1');
    expect(updated.retentionEligibleAt?.toISOString()).toBe('2026-01-31T00:00:00.000Z');
  });

  it('places and releases legal hold with audit events', async () => {
    const prisma = {
      document: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'doc-1',
            organizationId: 'org-1',
            matterId: 'matter-1',
            dispositionStatus: DocumentDispositionStatus.ACTIVE,
          })
          .mockResolvedValueOnce({
            id: 'doc-1',
            organizationId: 'org-1',
            matterId: 'matter-1',
            dispositionStatus: DocumentDispositionStatus.ACTIVE,
          }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      documentLegalHold: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({
            id: 'hold-1',
            organizationId: 'org-1',
            documentId: 'doc-1',
            status: DocumentLegalHoldStatus.ACTIVE,
            reason: 'Preserve',
          }),
        create: jest.fn().mockResolvedValue({
          id: 'hold-1',
          organizationId: 'org-1',
          documentId: 'doc-1',
          status: DocumentLegalHoldStatus.ACTIVE,
          reason: 'Preserve',
        }),
        update: jest.fn().mockResolvedValue({
          id: 'hold-1',
          organizationId: 'org-1',
          documentId: 'doc-1',
          status: DocumentLegalHoldStatus.RELEASED,
        }),
      },
    } as any;

    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const access = { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new DocumentsService(
      prisma,
      access,
      { upload: jest.fn(), signedDownloadUrl: jest.fn(), getObjectBuffer: jest.fn() } as any,
      { scan: jest.fn() } as any,
      audit,
    );

    const hold = await service.placeLegalHold({
      user: baseUser,
      documentId: 'doc-1',
      reason: 'Preserve',
    });
    expect(hold.id).toBe('hold-1');

    const released = await service.releaseLegalHold({
      user: baseUser,
      documentId: 'doc-1',
      reason: 'No longer needed',
    });
    expect(released.status).toBe(DocumentLegalHoldStatus.RELEASED);
    expect(audit.appendEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'document.legal_hold.placed' }));
    expect(audit.appendEvent).toHaveBeenCalledWith(expect.objectContaining({ action: 'document.legal_hold.released' }));
  });

  it('creates, approves, and executes a disposition run while skipping legal-hold docs', async () => {
    const documentUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    const dispositionUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    const runUpdate = jest
      .fn()
      .mockResolvedValueOnce({
        id: 'run-1',
        organizationId: 'org-1',
        status: DocumentDispositionRunStatus.APPROVED,
        approvedAt: new Date('2026-02-01T00:00:00.000Z'),
      })
      .mockResolvedValueOnce({
        id: 'run-1',
        organizationId: 'org-1',
        status: DocumentDispositionRunStatus.COMPLETED,
        executedAt: new Date('2026-02-01T01:00:00.000Z'),
      });

    const prisma = {
      document: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'doc-1', matterId: 'matter-1', legalHoldActive: false },
          { id: 'doc-2', matterId: 'matter-2', legalHoldActive: true },
        ]),
        updateMany: documentUpdateMany,
      },
      documentDispositionRun: {
        create: jest.fn().mockResolvedValue({
          id: 'run-1',
          organizationId: 'org-1',
          status: DocumentDispositionRunStatus.PENDING_APPROVAL,
          items: [
            { id: 'item-1', documentId: 'doc-1', status: DocumentDispositionItemStatus.PENDING },
            { id: 'item-2', documentId: 'doc-2', status: DocumentDispositionItemStatus.SKIPPED_LEGAL_HOLD },
          ],
        }),
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'run-1',
            organizationId: 'org-1',
            status: DocumentDispositionRunStatus.PENDING_APPROVAL,
            notes: null,
          })
          .mockResolvedValueOnce({
            id: 'run-1',
            organizationId: 'org-1',
            status: DocumentDispositionRunStatus.APPROVED,
            notes: null,
            items: [
              { id: 'item-1', documentId: 'doc-1', status: DocumentDispositionItemStatus.PENDING },
              { id: 'item-2', documentId: 'doc-2', status: DocumentDispositionItemStatus.SKIPPED_LEGAL_HOLD },
            ],
          }),
        update: runUpdate,
      },
      documentShareLink: {
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      documentDispositionItem: {
        updateMany: dispositionUpdateMany,
      },
    } as any;

    const access = {
      assertMatterAccess: jest.fn().mockResolvedValue(undefined),
    } as any;
    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new DocumentsService(
      prisma,
      access,
      { upload: jest.fn(), signedDownloadUrl: jest.fn(), getObjectBuffer: jest.fn() } as any,
      { scan: jest.fn() } as any,
      audit,
    );

    const run = await service.createDispositionRun({ user: baseUser });
    expect(run.items).toHaveLength(2);
    expect(prisma.documentDispositionRun.create).toHaveBeenCalled();

    const approved = await service.approveDispositionRun({
      user: baseUser,
      runId: 'run-1',
      notes: 'Approved',
    });
    expect(approved.status).toBe(DocumentDispositionRunStatus.APPROVED);

    const executed = await service.executeDispositionRun({
      user: baseUser,
      runId: 'run-1',
      notes: 'Execute now',
    });
    expect(executed.status).toBe(DocumentDispositionRunStatus.COMPLETED);
    expect(executed.disposedDocumentCount).toBe(1);
    expect(documentUpdateMany).toHaveBeenCalled();
    expect(dispositionUpdateMany).toHaveBeenCalled();
  });
});

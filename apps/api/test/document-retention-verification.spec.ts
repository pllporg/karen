import {
  DocumentDispositionItemStatus,
  DocumentDispositionRunStatus,
  DocumentDispositionStatus,
} from '@prisma/client';
import { DocumentsService } from '../src/documents/documents.service';

const baseUser = {
  id: 'user-1',
  organizationId: 'org-1',
} as any;

describe('DocumentsService retention verification hardening', () => {
  it('re-checks legal hold at execution and skips newly-held pending documents', async () => {
    const documentUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    const shareLinkUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    const dispositionItemUpdateMany = jest.fn().mockResolvedValue({ count: 1 });
    const runUpdate = jest.fn().mockResolvedValue({
      id: 'run-1',
      organizationId: 'org-1',
      status: DocumentDispositionRunStatus.COMPLETED,
      executedAt: new Date('2026-02-01T02:00:00.000Z'),
    });

    const prisma = {
      documentDispositionRun: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'run-1',
          organizationId: 'org-1',
          status: DocumentDispositionRunStatus.APPROVED,
          notes: null,
          items: [
            {
              id: 'item-dispose',
              documentId: 'doc-1',
              status: DocumentDispositionItemStatus.PENDING,
            },
            {
              id: 'item-skip',
              documentId: 'doc-2',
              status: DocumentDispositionItemStatus.PENDING,
            },
            {
              id: 'item-existing-skip',
              documentId: 'doc-3',
              status: DocumentDispositionItemStatus.SKIPPED_LEGAL_HOLD,
            },
          ],
        }),
        update: runUpdate,
      },
      document: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'doc-1',
            legalHoldActive: false,
            dispositionStatus: DocumentDispositionStatus.PENDING_DISPOSITION,
          },
          {
            id: 'doc-2',
            legalHoldActive: true,
            dispositionStatus: DocumentDispositionStatus.PENDING_DISPOSITION,
          },
        ]),
        updateMany: documentUpdateMany,
      },
      documentShareLink: {
        updateMany: shareLinkUpdateMany,
      },
      documentDispositionItem: {
        updateMany: dispositionItemUpdateMany,
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

    const result = await service.executeDispositionRun({
      user: baseUser,
      runId: 'run-1',
      notes: 'Execute with hold re-check',
    });

    expect(result.disposedDocumentCount).toBe(1);
    expect(result.skippedForLegalHoldCount).toBe(1);

    expect(documentUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ['doc-1'] },
        }),
        data: expect.objectContaining({
          dispositionStatus: DocumentDispositionStatus.DISPOSED,
        }),
      }),
    );
    expect(documentUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ['doc-2'] },
          dispositionStatus: DocumentDispositionStatus.PENDING_DISPOSITION,
        }),
        data: {
          dispositionStatus: DocumentDispositionStatus.ACTIVE,
        },
      }),
    );
    expect(shareLinkUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          documentId: { in: ['doc-1'] },
        }),
      }),
    );
    expect(dispositionItemUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          documentId: { in: ['doc-1'] },
          status: DocumentDispositionItemStatus.PENDING,
        }),
        data: expect.objectContaining({
          status: DocumentDispositionItemStatus.DISPOSED,
        }),
      }),
    );
    expect(dispositionItemUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          documentId: { in: ['doc-2'] },
          status: DocumentDispositionItemStatus.PENDING,
        }),
        data: expect.objectContaining({
          status: DocumentDispositionItemStatus.SKIPPED_LEGAL_HOLD,
          note: 'Skipped at execution because legal hold is active.',
        }),
      }),
    );
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'document.disposition_run.completed',
        metadata: expect.objectContaining({
          disposedCount: 1,
          skippedForLegalHoldAtExecution: 1,
        }),
      }),
    );
  });
});

import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';
import { ExportsService } from '../src/exports/exports.service';
import {
  FULL_BACKUP_CONTRACT_VERSION,
  FULL_BACKUP_CSV_CONTRACT,
  FULL_BACKUP_MANIFEST_FILE,
  validateFullBackupPackageConformance,
} from '../src/exports/full-backup-contract';

describe('ExportsService full backup conformance', () => {
  it('builds a contract-conformant full backup package and tracks validation metadata', async () => {
    const jobUpdates: any[] = [];
    let uploadedBuffer: Buffer | null = null;

    const prisma = {
      exportJob: {
        create: jest.fn().mockResolvedValue({ id: 'job-1' }),
        update: jest.fn().mockImplementation(async (payload) => {
          jobUpdates.push(payload);
          return payload;
        }),
      },
      contact: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'contact-1',
            organizationId: 'org-1',
            kind: 'PERSON',
            displayName: 'Elena Homeowner',
            primaryEmail: 'elena@example.com',
            primaryPhone: '555-111-2222',
            tags: ['client'],
            rawSourcePayload: null,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-02T00:00:00.000Z'),
          },
        ]),
      },
      matter: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'matter-1',
            organizationId: 'org-1',
            matterNumber: 'MAT-001',
            name: 'Roofing dispute',
            practiceArea: 'Construction Litigation',
            jurisdiction: 'CA',
            venue: 'Orange County',
            stageId: null,
            matterTypeId: null,
            status: 'OPEN',
            ethicalWallEnabled: false,
            openedAt: new Date('2026-01-05T00:00:00.000Z'),
            closedAt: null,
            rawSourcePayload: null,
            createdAt: new Date('2026-01-05T00:00:00.000Z'),
            updatedAt: new Date('2026-01-06T00:00:00.000Z'),
          },
        ]),
      },
      task: { findMany: jest.fn().mockResolvedValue([]) },
      calendarEvent: { findMany: jest.fn().mockResolvedValue([]) },
      timeEntry: { findMany: jest.fn().mockResolvedValue([]) },
      invoice: { findMany: jest.fn().mockResolvedValue([]) },
      payment: { findMany: jest.fn().mockResolvedValue([]) },
      communicationMessage: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([
            {
              id: 'message-1',
              organizationId: 'org-1',
              threadId: 'thread-1',
              type: 'EMAIL',
              direction: 'OUTBOUND',
              subject: 'Status update',
              body: 'Update body',
              occurredAt: new Date('2026-01-10T00:00:00.000Z'),
              createdByUserId: 'user-1',
              rawSourcePayload: null,
              createdAt: new Date('2026-01-10T00:00:00.000Z'),
              updatedAt: new Date('2026-01-10T00:00:00.000Z'),
            },
          ])
          .mockResolvedValueOnce([
            {
              id: 'note-1',
              organizationId: 'org-1',
              threadId: 'thread-2',
              type: 'INTERNAL_NOTE',
              direction: 'INTERNAL',
              subject: 'Case note',
              body: 'Note body',
              occurredAt: new Date('2026-01-11T00:00:00.000Z'),
              createdByUserId: 'user-1',
              rawSourcePayload: null,
              createdAt: new Date('2026-01-11T00:00:00.000Z'),
              updatedAt: new Date('2026-01-11T00:00:00.000Z'),
            },
          ]),
      },
      customFieldValue: { findMany: jest.fn().mockResolvedValue([]) },
      document: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'document-1',
            organizationId: 'org-1',
            matterId: 'matter-1',
            title: 'Scope Agreement',
          },
          {
            id: 'document-2',
            organizationId: 'org-1',
            matterId: 'matter-1',
            title: 'Inspection Photos',
          },
        ]),
      },
      documentVersion: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'version-1',
            organizationId: 'org-1',
            documentId: 'document-1',
            storageKey: 'docs/version-1',
            sha256: 'abc123',
            mimeType: 'application/pdf',
            size: 512,
          },
          {
            id: 'version-2',
            organizationId: 'org-1',
            documentId: 'document-2',
            storageKey: 'docs/version-2',
            sha256: 'def456',
            mimeType: 'image/jpeg',
            size: 1024,
          },
        ]),
      },
    } as any;

    const s3 = {
      upload: jest.fn().mockImplementation(async (buffer: Buffer) => {
        uploadedBuffer = buffer;
        return { key: 'org/org-1/exports/export.zip' };
      }),
      signedDownloadUrl: jest.fn().mockResolvedValue('https://download.local/export.zip'),
      getObjectBuffer: jest.fn().mockImplementation(async (key: string) => {
        if (key === 'docs/version-1') {
          return Buffer.from('present-document');
        }
        throw new Error('blob missing');
      }),
    } as any;

    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new ExportsService(prisma, s3, audit);

    const result = await service.runFullBackup({ id: 'user-1', organizationId: 'org-1' } as any);

    expect(result.jobId).toBe('job-1');
    expect(result.downloadUrl).toBe('https://download.local/export.zip');
    expect(uploadedBuffer).not.toBeNull();
    if (!uploadedBuffer) {
      throw new Error('Expected upload buffer to be present');
    }

    const zip = new AdmZip(uploadedBuffer);
    const zipEntries = zip.getEntries().map((entry) => entry.entryName);

    for (const contract of FULL_BACKUP_CSV_CONTRACT) {
      expect(zipEntries).toContain(contract.fileName);
      const csvText = zip.readAsText(contract.fileName);
      const header = parse(csvText, { to_line: 1 })[0] as string[];
      for (const column of contract.requiredColumns) {
        expect(header).toContain(column);
      }
    }

    expect(zipEntries).toContain(FULL_BACKUP_MANIFEST_FILE);
    const manifest = JSON.parse(zip.readAsText(FULL_BACKUP_MANIFEST_FILE)) as Array<Record<string, unknown>>;
    expect(manifest).toHaveLength(2);
    manifest.forEach((entry) => {
      expect(typeof entry.path).toBe('string');
      expect(zipEntries).toContain(String(entry.path));
    });

    const missingEntry = manifest.find((entry) => entry.documentVersionId === 'version-2');
    expect(String(missingEntry?.path)).toMatch(/\.missing\.txt$/);
    expect(missingEntry?.placeholder).toBe(true);

    const completionUpdate = jobUpdates.find((item) => item.data?.status === 'COMPLETED');
    expect(completionUpdate).toBeTruthy();
    expect(completionUpdate.data.summaryJson).toMatchObject({
      contractVersion: FULL_BACKUP_CONTRACT_VERSION,
      validation: expect.objectContaining({
        valid: true,
      }),
      csvFileCount: FULL_BACKUP_CSV_CONTRACT.length,
      documentFileCount: 2,
      manifestEntryCount: 2,
    });
  });

  it('reports validation errors for missing files, columns, and invalid manifest references', async () => {
    const result = validateFullBackupPackageConformance({
      csvColumnsByFile: {
        'contacts.csv': ['id'],
      },
      manifestEntries: [
        {
          documentId: '',
          documentVersionId: 'dv-1',
          path: '../outside/path',
          matterId: '',
          title: '',
        },
      ],
      archivePaths: ['contacts.csv', FULL_BACKUP_MANIFEST_FILE],
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'missing_required_file' }),
        expect.objectContaining({ code: 'missing_required_column', file: 'contacts.csv' }),
        expect.objectContaining({ code: 'manifest_missing_field' }),
        expect.objectContaining({ code: 'manifest_invalid_path' }),
        expect.objectContaining({ code: 'manifest_missing_blob' }),
      ]),
    );
  });
});

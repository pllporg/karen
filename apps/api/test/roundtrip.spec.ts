import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import AdmZip from 'adm-zip';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { ImportsService } from '../src/imports/imports.service';
import { ExportsService } from '../src/exports/exports.service';

describe('Import/Export roundtrip fixture', () => {
  it('imports generic CSV contacts and exports canonical contacts CSV rows', async () => {
    const contacts: Array<{ id: string; displayName: string; primaryEmail: string | null; primaryPhone: string | null }> = [];

    const prisma = {
      importBatch: {
        create: jest.fn().mockResolvedValue({ id: 'batch1' }),
        update: jest.fn().mockResolvedValue({ id: 'batch1' }),
        findUnique: jest.fn().mockResolvedValue({ id: 'batch1', items: [] }),
      },
      importItem: {
        create: jest.fn().mockResolvedValue({ id: 'item1' }),
      },
      contact: {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockImplementation(({ data }) => {
          const value = {
            id: `contact-${contacts.length + 1}`,
            displayName: data.displayName,
            primaryEmail: data.primaryEmail || null,
            primaryPhone: data.primaryPhone || null,
          };
          contacts.push(value);
          return Promise.resolve(value);
        }),
      },
      externalReference: {
        upsert: jest.fn().mockResolvedValue({ id: 'er1' }),
      },
    } as any;

    const service = new ImportsService(prisma, { appendEvent: jest.fn() } as any);

    service.registerPlugin({
      sourceSystem: 'generic_csv',
      parse: jest.fn().mockImplementation(async () => {
        const fixture = readFileSync(join(__dirname, 'fixtures/import-export/generic-contacts.csv'), 'utf8');
        const rows = parse(fixture, { columns: true, skip_empty_lines: true });
        return rows.map((row: any, index: number) => ({
          entityType: row.entity_type,
          rowNumber: index + 1,
          rawJson: row,
        }));
      }),
    });

    await service.runImport({
      user: { id: 'user1', organizationId: 'org1' } as any,
      sourceSystem: 'generic_csv',
      file: { buffer: Buffer.from('') } as any,
    });

    expect(contacts).toHaveLength(2);

    const exported = stringify(contacts, { header: true });
    const expected = readFileSync(join(__dirname, 'fixtures/import-export/expected-generic-roundtrip.csv'), 'utf8');
    expect(exported.trim()).toBe(expected.trim());

    let uploadedBuffer: Buffer | null = null;

    const exportPrisma = {
      exportJob: {
        create: jest.fn().mockResolvedValue({ id: 'export-job-1' }),
        update: jest.fn().mockResolvedValue({ id: 'export-job-1' }),
      },
      contact: {
        findMany: jest.fn().mockResolvedValue(
          contacts.map((contact) => ({
            id: contact.id,
            organizationId: 'org1',
            kind: 'PERSON',
            displayName: contact.displayName,
            primaryEmail: contact.primaryEmail,
            primaryPhone: contact.primaryPhone,
            tags: [],
            rawSourcePayload: null,
            createdAt: new Date('2026-01-01T00:00:00.000Z'),
            updatedAt: new Date('2026-01-01T00:00:00.000Z'),
          })),
        ),
      },
      matter: { findMany: jest.fn().mockResolvedValue([]) },
      task: { findMany: jest.fn().mockResolvedValue([]) },
      calendarEvent: { findMany: jest.fn().mockResolvedValue([]) },
      timeEntry: { findMany: jest.fn().mockResolvedValue([]) },
      invoice: { findMany: jest.fn().mockResolvedValue([]) },
      payment: { findMany: jest.fn().mockResolvedValue([]) },
      communicationMessage: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      customFieldValue: { findMany: jest.fn().mockResolvedValue([]) },
      document: { findMany: jest.fn().mockResolvedValue([]) },
      documentVersion: { findMany: jest.fn().mockResolvedValue([]) },
    } as any;

    const exportsService = new ExportsService(
      exportPrisma,
      {
        upload: jest.fn().mockImplementation(async (buffer: Buffer) => {
          uploadedBuffer = buffer;
          return { key: 'org/org1/exports/export-1.zip' };
        }),
        signedDownloadUrl: jest.fn().mockResolvedValue('https://download.local/export-1.zip'),
        getObjectBuffer: jest.fn(),
      } as any,
      { appendEvent: jest.fn() } as any,
    );

    await exportsService.runFullBackup({ id: 'user1', organizationId: 'org1' } as any);

    if (!uploadedBuffer) {
      throw new Error('Expected upload buffer to be present');
    }

    const zip = new AdmZip(uploadedBuffer);
    const contactsCsv = zip.readAsText('contacts.csv');
    const exportedRows = parse(contactsCsv, { columns: true, skip_empty_lines: true }) as Array<
      Record<string, string>
    >;

    expect(exportedRows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          displayName: 'Jane Doe',
          primaryEmail: 'jane@example.com',
        }),
        expect.objectContaining({
          displayName: 'John Doe',
          primaryEmail: 'john@example.com',
        }),
      ]),
    );
  });
});

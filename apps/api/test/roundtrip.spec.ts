import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { ImportsService } from '../src/imports/imports.service';

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
  });
});

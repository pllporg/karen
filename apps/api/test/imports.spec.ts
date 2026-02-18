import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import AdmZip from 'adm-zip';
import { ImportsService } from '../src/imports/imports.service';
import { ClioTemplateImportPlugin } from '../src/imports/plugins/clio-template.plugin';
import { MyCaseZipImportPlugin } from '../src/imports/plugins/mycase-zip.plugin';

function buildImportPrismaMock() {
  const state = {
    contacts: [] as Array<Record<string, unknown>>,
    matters: [] as Array<Record<string, unknown>>,
    tasks: [] as Array<Record<string, unknown>>,
    calendarEvents: [] as Array<Record<string, unknown>>,
    invoices: [] as Array<Record<string, unknown>>,
    payments: [] as Array<Record<string, unknown>>,
    timeEntries: [] as Array<Record<string, unknown>>,
    communicationThreads: [] as Array<Record<string, unknown>>,
    communicationMessages: [] as Array<Record<string, unknown>>,
    externalReferences: [] as Array<Record<string, unknown>>,
    importItems: [] as Array<Record<string, unknown>>,
    importBatch: null as Record<string, unknown> | null,
  };

  const prisma = {
    importBatch: {
      create: jest.fn().mockImplementation(async ({ data }) => {
        state.importBatch = { id: 'batch1', ...data };
        return state.importBatch;
      }),
      update: jest.fn().mockImplementation(async ({ data }) => {
        state.importBatch = { ...(state.importBatch || {}), ...data };
        return state.importBatch;
      }),
      findUnique: jest.fn().mockImplementation(async () => ({
        ...(state.importBatch || { id: 'batch1' }),
        items: state.importItems,
      })),
    },
    importItem: {
      create: jest.fn().mockImplementation(async ({ data }) => {
        const item = { id: `import-item-${state.importItems.length + 1}`, ...data };
        state.importItems.push(item);
        return item;
      }),
    },
    contact: {
      findMany: jest.fn().mockImplementation(async ({ where }) => {
        const orgId = where.organizationId;
        return state.contacts.filter((item) => item.organizationId === orgId);
      }),
      create: jest.fn().mockImplementation(async ({ data }) => {
        const contact = { id: `contact-${state.contacts.length + 1}`, ...data };
        state.contacts.push(contact);
        return contact;
      }),
    },
    matter: {
      upsert: jest.fn().mockImplementation(async ({ where, update, create }) => {
        const matterNumber = where.organizationId_matterNumber.matterNumber;
        const organizationId = where.organizationId_matterNumber.organizationId;
        const existing = state.matters.find(
          (item) => item.organizationId === organizationId && item.matterNumber === matterNumber,
        );

        if (existing) {
          Object.assign(existing, update);
          return existing;
        }

        const matter = { id: `matter-${state.matters.length + 1}`, ...create };
        state.matters.push(matter);
        return matter;
      }),
      findFirst: jest.fn().mockImplementation(async ({ where }) => {
        const candidates = state.matters.filter((item) => item.organizationId === where.organizationId);
        for (const candidate of candidates) {
          for (const branch of where.OR || []) {
            if (branch.id && candidate.id === branch.id) return candidate;
            if (branch.matterNumber && candidate.matterNumber === branch.matterNumber) return candidate;
          }
        }
        return null;
      }),
    },
    task: {
      create: jest.fn().mockImplementation(async ({ data }) => {
        const task = { id: `task-${state.tasks.length + 1}`, ...data };
        state.tasks.push(task);
        return task;
      }),
    },
    calendarEvent: {
      create: jest.fn().mockImplementation(async ({ data }) => {
        const event = { id: `event-${state.calendarEvents.length + 1}`, ...data };
        state.calendarEvents.push(event);
        return event;
      }),
    },
    invoice: {
      create: jest.fn().mockImplementation(async ({ data }) => {
        const invoice = { id: `invoice-${state.invoices.length + 1}`, ...data };
        state.invoices.push(invoice);
        return invoice;
      }),
    },
    payment: {
      create: jest.fn().mockImplementation(async ({ data }) => {
        const payment = { id: `payment-${state.payments.length + 1}`, ...data };
        state.payments.push(payment);
        return payment;
      }),
    },
    timeEntry: {
      create: jest.fn().mockImplementation(async ({ data }) => {
        const timeEntry = { id: `time-${state.timeEntries.length + 1}`, ...data };
        state.timeEntries.push(timeEntry);
        return timeEntry;
      }),
    },
    communicationThread: {
      create: jest.fn().mockImplementation(async ({ data }) => {
        const thread = { id: `thread-${state.communicationThreads.length + 1}`, ...data };
        state.communicationThreads.push(thread);
        return thread;
      }),
    },
    communicationMessage: {
      create: jest.fn().mockImplementation(async ({ data }) => {
        const message = { id: `message-${state.communicationMessages.length + 1}`, ...data };
        state.communicationMessages.push(message);
        return message;
      }),
    },
    externalReference: {
      findFirst: jest.fn().mockImplementation(async ({ where }) => {
        return (
          state.externalReferences.find(
            (item) =>
              item.organizationId === where.organizationId &&
              item.sourceSystem === where.sourceSystem &&
              item.entityType === where.entityType &&
              item.externalId === where.externalId,
          ) || null
        );
      }),
      upsert: jest.fn().mockImplementation(async ({ where, update, create }) => {
        const key = where.organizationId_sourceSystem_entityType_externalId;
        const existing = state.externalReferences.find(
          (item) =>
            item.organizationId === key.organizationId &&
            item.sourceSystem === key.sourceSystem &&
            item.entityType === key.entityType &&
            item.externalId === key.externalId,
        );
        if (existing) {
          Object.assign(existing, update);
          return existing;
        }
        const value = { id: `external-${state.externalReferences.length + 1}`, ...create };
        state.externalReferences.push(value);
        return value;
      }),
    },
  } as any;

  return { prisma, state };
}

describe('ImportsService', () => {
  it('runs import batch with plugin and writes items', async () => {
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
        create: jest.fn().mockResolvedValue({ id: 'contact1' }),
      },
      externalReference: {
        upsert: jest.fn().mockResolvedValue({ id: 'er1' }),
      },
    } as any;

    const service = new ImportsService(prisma, { appendEvent: jest.fn() } as any);
    service.registerPlugin({
      sourceSystem: 'generic_csv',
      parse: jest.fn().mockResolvedValue([
        { entityType: 'contact', rowNumber: 1, rawJson: { name: 'Jane Doe', id: '1' } },
      ]),
    });

    const result = await service.runImport({
      user: { id: 'u1', organizationId: 'org1' } as any,
      sourceSystem: 'generic_csv',
      file: { buffer: Buffer.from('') } as any,
    });

    expect(result).not.toBeNull();
    expect(result!.id).toBe('batch1');
    expect(prisma.importItem.create).toHaveBeenCalled();
  });

  it('parses MyCase ZIP fixture into all supported entity types', async () => {
    const plugin = new MyCaseZipImportPlugin();
    const fixture = readFileSync(join(__dirname, 'fixtures/import-export/mycase-sample.zip'));
    const rows = await plugin.parse({
      buffer: fixture,
      originalname: 'mycase-sample.zip',
      mimetype: 'application/zip',
      size: fixture.length,
      fieldname: 'file',
      encoding: '7bit',
    } as any);

    const counts = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.entityType] = (acc[row.entityType] || 0) + 1;
      return acc;
    }, {});

    expect(counts).toMatchObject({
      contact: 2,
      matter: 1,
      task: 1,
      calendar_event: 1,
      invoice: 1,
      payment: 1,
      time_entry: 1,
      communication_message: 2,
    });

    const taskRow = rows.find((row) => row.entityType === 'task');
    expect(taskRow?.rawJson).toMatchObject({
      id: '900',
      matter_id: '100',
      due_at: '2026-04-10',
      __source_entity: 'task',
    });

    const paymentRow = rows.find((row) => row.entityType === 'payment');
    expect(paymentRow?.rawJson).toMatchObject({
      id: '500',
      invoice_id: '400',
      amount: '500',
    });
  });

  it('captures row-level warning and error mapping context for unresolved MyCase references', async () => {
    const zip = new AdmZip();
    zip.addFile('tasks.csv', Buffer.from('id,title\n900,Missing Matter Task\n'));
    const buffer = zip.toBuffer();

    const { prisma, state } = buildImportPrismaMock();
    const service = new ImportsService(prisma, { appendEvent: jest.fn() } as any);
    service.registerPlugin(new MyCaseZipImportPlugin());

    const batch = await service.runImport({
      user: { id: 'u1', organizationId: 'org1' } as any,
      sourceSystem: 'mycase_backup_zip',
      file: {
        buffer,
        originalname: 'mycase-sample.zip',
        mimetype: 'application/zip',
        size: buffer.length,
        fieldname: 'file',
        encoding: '7bit',
      } as any,
    });

    expect(batch?.summaryJson).toMatchObject({
      total: 1,
      imported: 0,
      failed: 1,
      warnings: 1,
    });

    expect(state.importItems).toHaveLength(1);
    expect(state.importItems[0].status).toBe('FAILED');
    expect(state.importItems[0].warningsJson).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: 'missing_matter_reference' })]),
    );
    expect(state.importItems[0].errorsJson).toEqual(
      expect.objectContaining({
        message: 'Task row missing resolvable matter reference',
        rowContext: expect.objectContaining({
          entityType: 'task',
          rowNumber: 1,
          sourceFile: 'tasks.csv',
          externalId: '900',
        }),
      }),
    );
  });

  it('imports MyCase rows in dependency-safe order even when ZIP entries are unsorted', async () => {
    const zip = new AdmZip();
    zip.addFile('tasks.csv', Buffer.from('id,matter_id,title,due_at\n900,100,Inspect slab cracks,2026-04-10\n'));
    zip.addFile('payments.csv', Buffer.from('id,invoice_id,amount,received_at\n500,400,500,2026-04-15\n'));
    zip.addFile('invoices.csv', Buffer.from('id,matter_id,invoice_number,total\n400,100,INV-400,500\n'));
    zip.addFile('matters.csv', Buffer.from('id,matter_number,name\n100,M-100,Pool deck dispute\n'));
    const buffer = zip.toBuffer();

    const { prisma, state } = buildImportPrismaMock();
    const service = new ImportsService(prisma, { appendEvent: jest.fn() } as any);
    service.registerPlugin(new MyCaseZipImportPlugin());

    const batch = await service.runImport({
      user: { id: 'u1', organizationId: 'org1' } as any,
      sourceSystem: 'mycase_backup_zip',
      file: {
        buffer,
        originalname: 'mycase-unsorted.zip',
        mimetype: 'application/zip',
        size: buffer.length,
        fieldname: 'file',
        encoding: '7bit',
      } as any,
    });

    expect(batch?.summaryJson).toMatchObject({
      total: 4,
      imported: 4,
      failed: 0,
      warnings: 0,
    });

    expect(state.importItems.map((item) => item.entityType)).toEqual(['matter', 'invoice', 'task', 'payment']);
    expect(state.tasks).toHaveLength(1);
    expect(state.invoices).toHaveLength(1);
    expect(state.payments).toHaveLength(1);
    expect(state.tasks[0].matterId).toBe(state.matters[0].id);
    expect(state.payments[0].invoiceId).toBe(state.invoices[0].id);
  });

  it('captures unlinked communication warnings for MyCase notes/messages with source row context', async () => {
    const zip = new AdmZip();
    zip.addFile('notes.csv', Buffer.from('id,title,body,created_at\n700,Unlinked note,No matter assigned,2026-04-11\n'));
    const buffer = zip.toBuffer();

    const { prisma, state } = buildImportPrismaMock();
    const service = new ImportsService(prisma, { appendEvent: jest.fn() } as any);
    service.registerPlugin(new MyCaseZipImportPlugin());

    const batch = await service.runImport({
      user: { id: 'u1', organizationId: 'org1' } as any,
      sourceSystem: 'mycase_backup_zip',
      file: {
        buffer,
        originalname: 'mycase-unlinked-note.zip',
        mimetype: 'application/zip',
        size: buffer.length,
        fieldname: 'file',
        encoding: '7bit',
      } as any,
    });

    expect(batch?.summaryJson).toMatchObject({
      total: 1,
      imported: 1,
      failed: 0,
      warnings: 1,
    });

    expect(state.importItems).toHaveLength(1);
    expect(state.importItems[0].status).toBe('IMPORTED');
    expect(state.importItems[0].warningsJson).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'unlinked_to_matter',
          context: expect.objectContaining({
            rowContext: expect.objectContaining({
              entityType: 'communication_message',
              sourceFile: 'notes.csv',
              sourceEntity: 'communication_message',
              externalId: '700',
            }),
          }),
        }),
      ]),
    );
  });

  it('imports expanded MyCase ZIP fixture end-to-end with cross-entity linkage', async () => {
    const fixture = readFileSync(join(__dirname, 'fixtures/import-export/mycase-sample.zip'));
    const { prisma, state } = buildImportPrismaMock();
    const service = new ImportsService(prisma, { appendEvent: jest.fn() } as any);
    service.registerPlugin(new MyCaseZipImportPlugin());

    const batch = await service.runImport({
      user: { id: 'u1', organizationId: 'org1' } as any,
      sourceSystem: 'mycase_backup_zip',
      file: {
        buffer: fixture,
        originalname: 'mycase-sample.zip',
        mimetype: 'application/zip',
        size: fixture.length,
        fieldname: 'file',
        encoding: '7bit',
      } as any,
    });

    expect(batch?.summaryJson).toMatchObject({
      total: 10,
      imported: 10,
      failed: 0,
      warnings: 0,
    });

    expect(state.contacts).toHaveLength(2);
    expect(state.matters).toHaveLength(1);
    expect(state.tasks).toHaveLength(1);
    expect(state.calendarEvents).toHaveLength(1);
    expect(state.invoices).toHaveLength(1);
    expect(state.payments).toHaveLength(1);
    expect(state.timeEntries).toHaveLength(1);
    expect(state.communicationMessages).toHaveLength(2);

    expect(state.tasks[0].matterId).toBe(state.matters[0].id);
    expect(state.calendarEvents[0].matterId).toBe(state.matters[0].id);
    expect(state.timeEntries[0].matterId).toBe(state.matters[0].id);
    expect(state.payments[0].invoiceId).toBe(state.invoices[0].id);

    const taskRef = state.externalReferences.find((ref) => ref.entityType === 'task' && ref.externalId === '900');
    const paymentRef = state.externalReferences.find((ref) => ref.entityType === 'payment' && ref.externalId === '500');
    const communicationRef = state.externalReferences.find(
      (ref) => ref.entityType === 'communication_message' && ref.externalId === '700',
    );

    expect(taskRef).toMatchObject({
      sourceSystem: 'mycase_backup_zip',
      externalParentId: '100',
      importBatchId: 'batch1',
      rawSourcePayload: expect.objectContaining({
        __source_file: 'tasks.csv',
        __source_entity: 'task',
      }),
    });
    expect(paymentRef).toMatchObject({
      sourceSystem: 'mycase_backup_zip',
      externalParentId: '400',
      importBatchId: 'batch1',
      rawSourcePayload: expect.objectContaining({
        __source_file: 'payments.csv',
        __source_entity: 'payment',
      }),
    });
    expect(communicationRef).toMatchObject({
      sourceSystem: 'mycase_backup_zip',
      externalParentId: '100',
      importBatchId: 'batch1',
      rawSourcePayload: expect.objectContaining({
        __source_file: expect.stringMatching(/^(notes|messages)\.csv$/),
        __source_entity: 'communication_message',
      }),
    });
  });

  it('parses Clio CSV fixture for all documented template entity types', async () => {
    const plugin = new ClioTemplateImportPlugin();
    const fixture = readFileSync(join(__dirname, 'fixtures/import-export/clio-template-full.csv'));
    const rows = await plugin.parse({
      buffer: fixture,
      originalname: 'clio-template-full.csv',
      mimetype: 'text/csv',
      size: fixture.length,
      fieldname: 'file',
      encoding: '7bit',
    } as any);

    const counts = rows.reduce<Record<string, number>>((acc, row) => {
      acc[row.entityType] = (acc[row.entityType] || 0) + 1;
      return acc;
    }, {});

    expect(counts).toMatchObject({
      contact: 1,
      matter: 1,
      task: 1,
      calendar_event: 1,
      time_entry: 1,
      communication_message: 3,
    });

    expect(rows[0].warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'unmapped_columns',
        }),
      ]),
    );
  });

  it('imports Clio XLSX workbook with sheet parity and unmapped-column diagnostics', async () => {
    const workbookBuffer = readFileSync(join(__dirname, 'fixtures/import-export/clio-template.xlsx'));

    const { prisma, state } = buildImportPrismaMock();
    const service = new ImportsService(prisma, { appendEvent: jest.fn() } as any);
    service.registerPlugin(new ClioTemplateImportPlugin());

    const batch = await service.runImport({
      user: { id: 'u1', organizationId: 'org1' } as any,
      sourceSystem: 'clio_template',
      file: {
        buffer: workbookBuffer,
        originalname: 'clio-template.xlsx',
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: workbookBuffer.length,
        fieldname: 'file',
        encoding: '7bit',
      } as any,
    });

    expect(batch?.summaryJson).toMatchObject({
      imported: 8,
      failed: 0,
    });

    expect((batch?.summaryJson as Record<string, unknown>)?.warningCodeCounts).toEqual(
      expect.objectContaining({
        unmapped_columns: 8,
      }),
    );

    const unmappedColumnsBySource = (batch?.summaryJson as Record<string, any>)?.unmappedColumnsBySource;
    expect(unmappedColumnsBySource['clio-template.xlsx#Contacts']).toContain('legacy_column');
    expect(unmappedColumnsBySource['clio-template.xlsx#Matters']).toContain('legacy_column');

    expect(state.contacts).toHaveLength(1);
    expect(state.matters).toHaveLength(1);
    expect(state.tasks).toHaveLength(1);
    expect(state.calendarEvents).toHaveLength(1);
    expect(state.timeEntries).toHaveLength(1);
    expect(state.communicationMessages).toHaveLength(3);
  });
});

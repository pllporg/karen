import { ImportsService } from '../src/imports/imports.service';

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
});

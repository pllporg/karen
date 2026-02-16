import { DocumentsService } from '../src/documents/documents.service';

describe('DocumentsService', () => {
  it('uploads document and creates first version', async () => {
    const prisma = {
      document: {
        create: jest.fn().mockResolvedValue({ id: 'doc1' }),
      },
      documentVersion: {
        create: jest.fn().mockResolvedValue({ id: 'ver1' }),
      },
    } as any;

    const service = new DocumentsService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { upload: jest.fn().mockResolvedValue({ key: 's3/key' }) } as any,
      { scan: jest.fn().mockResolvedValue({ clean: true }) } as any,
      { appendEvent: jest.fn() } as any,
    );

    const result = await service.uploadNew({
      user: { id: 'u1', organizationId: 'org1' } as any,
      matterId: 'matter1',
      title: 'Test Doc',
      file: {
        buffer: Buffer.from('hello'),
        mimetype: 'text/plain',
        originalname: 'hello.txt',
        size: 5,
      } as any,
    });

    expect(result.document.id).toBe('doc1');
    expect(result.version.id).toBe('ver1');
  });
});

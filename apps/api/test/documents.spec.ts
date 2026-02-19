import { DocumentsService } from '../src/documents/documents.service';
import { MalwareScanService } from '../src/files/malware-scan.service';
import { startFakeClamAv } from './helpers/fake-clamav';

describe('DocumentsService', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

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

  it('blocks upload when malware scanner returns a threat', async () => {
    const prisma = {
      document: {
        create: jest.fn(),
      },
      documentVersion: {
        create: jest.fn(),
      },
    } as any;

    const appendEvent = jest.fn();
    const service = new DocumentsService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { upload: jest.fn() } as any,
      {
        scan: jest.fn().mockResolvedValue({
          clean: false,
          reason: 'Malware signature detected: Eicar-Test-Signature',
          provider: 'clamav',
          signature: 'Eicar-Test-Signature',
          failOpen: false,
        }),
      } as any,
      { appendEvent } as any,
    );

    await expect(
      service.uploadNew({
        user: { id: 'u1', organizationId: 'org1' } as any,
        matterId: 'matter1',
        title: 'Infected Doc',
        file: {
          buffer: Buffer.from('infected'),
          mimetype: 'application/octet-stream',
          originalname: 'infected.bin',
          size: 8,
        } as any,
      }),
    ).rejects.toThrow('Malware signature detected: Eicar-Test-Signature');

    expect(prisma.document.create).not.toHaveBeenCalled();
    expect(prisma.documentVersion.create).not.toHaveBeenCalled();
    expect(appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'document.upload.blocked',
        entityType: 'document',
        metadata: expect.objectContaining({
          provider: 'clamav',
          signature: 'Eicar-Test-Signature',
        }),
      }),
    );
  });

  it('blocks upload when real clamav scan reports infected payload', async () => {
    const fakeClam = await startFakeClamAv('stream: Eicar-Test-Signature FOUND\n');
    try {
      process.env.MALWARE_SCANNER_PROVIDER = 'clamav';
      process.env.CLAMAV_HOST = '127.0.0.1';
      process.env.CLAMAV_PORT = String(fakeClam.port);
      process.env.CLAMAV_TIMEOUT_MS = '1000';

      const prisma = {
        document: {
          create: jest.fn(),
        },
        documentVersion: {
          create: jest.fn(),
        },
      } as any;

      const appendEvent = jest.fn();
      const service = new DocumentsService(
        prisma,
        { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
        { upload: jest.fn() } as any,
        new MalwareScanService(),
        { appendEvent } as any,
      );

      await expect(
        service.uploadNew({
          user: { id: 'u1', organizationId: 'org1' } as any,
          matterId: 'matter1',
          title: 'Eicar Payload',
          file: {
            buffer: Buffer.from('X5O!P%@AP'),
            mimetype: 'application/octet-stream',
            originalname: 'eicar.bin',
            size: 9,
          } as any,
        }),
      ).rejects.toThrow('Eicar-Test-Signature');

      expect(prisma.document.create).not.toHaveBeenCalled();
      expect(prisma.documentVersion.create).not.toHaveBeenCalled();
      expect(appendEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'document.upload.blocked',
          metadata: expect.objectContaining({
            provider: 'clamav',
            signature: 'Eicar-Test-Signature',
          }),
        }),
      );
    } finally {
      await fakeClam.close();
    }
  });

  it('uploads a new document version and emits audit event', async () => {
    const prisma = {
      document: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'doc-1',
          organizationId: 'org-1',
          matterId: 'matter-1',
          dispositionStatus: 'ACTIVE',
        }),
      },
      documentVersion: {
        create: jest.fn().mockResolvedValue({
          id: 'version-2',
          documentId: 'doc-1',
        }),
      },
    } as any;

    const appendEvent = jest.fn();
    const service = new DocumentsService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { upload: jest.fn().mockResolvedValue({ key: 's3/new-version-key' }) } as any,
      { scan: jest.fn().mockResolvedValue({ clean: true }) } as any,
      { appendEvent } as any,
    );

    const version = await service.uploadVersion({
      user: { id: 'u1', organizationId: 'org-1' } as any,
      documentId: 'doc-1',
      file: {
        buffer: Buffer.from('new version'),
        mimetype: 'text/plain',
        originalname: 'new-version.txt',
        size: 11,
      } as any,
    });

    expect(version.id).toBe('version-2');
    expect(prisma.documentVersion.create).toHaveBeenCalled();
    expect(appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'document.version.uploaded',
        entityType: 'documentVersion',
        entityId: 'version-2',
      }),
    );
  });

  it('updates document shared status and emits audit event', async () => {
    const prisma = {
      document: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'doc-1',
          organizationId: 'org-1',
          matterId: 'matter-1',
          dispositionStatus: 'ACTIVE',
        }),
        update: jest.fn().mockResolvedValue({
          id: 'doc-1',
          title: 'Inspection Report',
          category: 'REPORT',
          tags: ['inspection'],
          sharedWithClient: true,
          versions: [],
        }),
      },
    } as any;

    const appendEvent = jest.fn();
    const service = new DocumentsService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { upload: jest.fn() } as any,
      { scan: jest.fn() } as any,
      { appendEvent } as any,
    );

    const updated = await service.updateDocument({
      user: { id: 'u1', organizationId: 'org-1' } as any,
      documentId: 'doc-1',
      sharedWithClient: true,
    });

    expect(updated.sharedWithClient).toBe(true);
    expect(prisma.document.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'doc-1' },
        data: expect.objectContaining({
          sharedWithClient: true,
        }),
      }),
    );
    expect(appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'document.updated',
        entityType: 'document',
        entityId: 'doc-1',
      }),
    );
  });

  it('creates share link and emits audit event', async () => {
    const prisma = {
      document: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'doc-1',
          organizationId: 'org-1',
          matterId: 'matter-1',
          dispositionStatus: 'ACTIVE',
        }),
      },
      documentShareLink: {
        create: jest.fn().mockResolvedValue({
          id: 'share-1',
          token: 'token-1',
        }),
      },
    } as any;

    const appendEvent = jest.fn();
    const service = new DocumentsService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { upload: jest.fn() } as any,
      { scan: jest.fn() } as any,
      { appendEvent } as any,
    );

    const share = await service.createShareLink({
      user: { id: 'u1', organizationId: 'org-1' } as any,
      documentId: 'doc-1',
      expiresInHours: 1,
    });

    expect(share.url).toContain('/shared-doc/');
    expect(prisma.documentShareLink.create).toHaveBeenCalled();
    expect(appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'document.share_link.created',
        entityType: 'documentShareLink',
        entityId: 'share-1',
      }),
    );
  });
});

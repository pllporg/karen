import { BillingService } from '../src/billing/billing.service';

describe('BillingService LEDES export jobs', () => {
  it('fails validation when required UTBMS codes are missing', async () => {
    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const s3 = {
      upload: jest.fn(),
      signedDownloadUrl: jest.fn(),
    } as any;
    const prisma = {
      lEDESExportProfile: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'profile-1',
          organizationId: 'org-1',
          format: 'LEDES98B',
          requireUtbmsPhaseCode: true,
          requireUtbmsTaskCode: true,
          includeExpenseLineItems: true,
        }),
      },
      invoice: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'inv-1',
            invoiceNumber: 'INV-0001',
            issuedAt: new Date('2026-01-10T00:00:00.000Z'),
            matter: { id: 'matter-1', name: 'Matter 1', matterNumber: 'MAT-1' },
            lineItems: [
              {
                id: 'line-1',
                quantity: 1,
                amount: 500,
                description: 'Draft pleading',
                expenseId: null,
                utbmsPhaseCode: null,
                utbmsTaskCode: null,
              },
            ],
          },
        ]),
      },
      lEDESExportJob: {
        create: jest.fn().mockResolvedValue({ id: 'job-1' }),
        update: jest.fn().mockImplementation(async ({ where, data }: any) => ({ id: where.id, ...data })),
      },
    } as any;

    const service = new BillingService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      audit,
      s3,
    );

    const result = await service.createLedesExportJob({
      user: { id: 'u1', organizationId: 'org-1' } as any,
      profileId: 'profile-1',
    });

    expect(result.status).toBe('FAILED');
    expect(prisma.lEDESExportJob.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          validationStatus: 'FAILED',
          status: 'FAILED',
        }),
      }),
    );
    expect(s3.upload).not.toHaveBeenCalled();
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'billing.ledes.export.failed',
      }),
    );
  });

  it('creates completed LEDES export job with checksum and download url', async () => {
    let uploadedBuffer: Buffer | null = null;
    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const s3 = {
      upload: jest.fn().mockImplementation(async (buffer: Buffer) => {
        uploadedBuffer = buffer;
        return { key: 'org/org-1/exports/ledes/job-2.1998b' };
      }),
      signedDownloadUrl: jest.fn().mockResolvedValue('https://download.local/job-2.1998b'),
    } as any;
    const prisma = {
      lEDESExportProfile: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'profile-1',
          organizationId: 'org-1',
          format: 'LEDES98B',
          requireUtbmsPhaseCode: true,
          requireUtbmsTaskCode: true,
          includeExpenseLineItems: true,
        }),
      },
      invoice: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'inv-1',
            invoiceNumber: 'INV-0001',
            issuedAt: new Date('2026-01-10T00:00:00.000Z'),
            matter: { id: 'matter-1', name: 'Matter 1', matterNumber: 'MAT-1' },
            lineItems: [
              {
                id: 'line-1',
                quantity: 2,
                amount: 850,
                description: 'Draft pleading',
                expenseId: null,
                utbmsPhaseCode: 'L100',
                utbmsTaskCode: 'L110',
              },
            ],
          },
        ]),
      },
      lEDESExportJob: {
        create: jest.fn().mockResolvedValue({ id: 'job-2' }),
        update: jest.fn().mockImplementation(async ({ where, data }: any) => ({ id: where.id, ...data })),
      },
    } as any;

    const service = new BillingService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      audit,
      s3,
    );

    const result = await service.createLedesExportJob({
      user: { id: 'u1', organizationId: 'org-1' } as any,
      profileId: 'profile-1',
    });

    expect(uploadedBuffer).toBeTruthy();
    expect(String(uploadedBuffer)).toContain('LEDES1998B[]');
    expect(result.status).toBe('COMPLETED');
    expect(result.validationStatus).toBe('PASSED');
    expect((result as any).downloadUrl).toBe('https://download.local/job-2.1998b');
    expect(result.checksumSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'billing.ledes.export.completed',
      }),
    );
  });

  it('returns signed download url only for completed jobs', async () => {
    const service = new BillingService(
      {
        lEDESExportJob: {
          findFirst: jest
            .fn()
            .mockResolvedValueOnce({
              id: 'job-running',
              organizationId: 'org-1',
              status: 'RUNNING',
              storageKey: null,
            })
            .mockResolvedValueOnce({
              id: 'job-done',
              organizationId: 'org-1',
              status: 'COMPLETED',
              storageKey: 'org/org-1/exports/ledes/job-done.1998b',
            }),
        },
      } as any,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn() } as any,
      { upload: jest.fn(), signedDownloadUrl: jest.fn().mockResolvedValue('https://download.local/job-done') } as any,
    );

    await expect(
      service.getLedesExportDownloadUrl({ id: 'u1', organizationId: 'org-1' } as any, 'job-running'),
    ).rejects.toThrow('Download is only available for completed LEDES export jobs');

    const result = await service.getLedesExportDownloadUrl(
      { id: 'u1', organizationId: 'org-1' } as any,
      'job-done',
    );
    expect(result).toEqual({
      jobId: 'job-done',
      downloadUrl: 'https://download.local/job-done',
    });
  });
});

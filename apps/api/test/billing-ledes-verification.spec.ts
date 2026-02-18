import { NotFoundException } from '@nestjs/common';
import { BillingService } from '../src/billing/billing.service';

describe('BillingService LEDES verification hardening', () => {
  it('resets prior defaults when creating a new default export profile', async () => {
    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const tx = {
      lEDESExportProfile: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockResolvedValue({
          id: 'profile-new-default',
          organizationId: 'org-1',
          name: 'Default 1998B',
          format: 'LEDES98B',
          isDefault: true,
        }),
      },
    } as any;
    const prisma = {
      $transaction: jest.fn().mockImplementation(async (handler: (client: typeof tx) => Promise<unknown>) => handler(tx)),
    } as any;

    const service = new BillingService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      audit,
      { upload: jest.fn() } as any,
    );

    const profile = await service.createLedesExportProfile({
      user: { id: 'u1', organizationId: 'org-1' } as any,
      name: 'Default 1998B',
      isDefault: true,
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(tx.lEDESExportProfile.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { organizationId: 'org-1', isDefault: true },
        data: { isDefault: false },
      }),
    );
    expect(tx.lEDESExportProfile.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          organizationId: 'org-1',
          name: 'Default 1998B',
          isDefault: true,
        }),
      }),
    );
    expect(profile).toEqual(expect.objectContaining({ id: 'profile-new-default', isDefault: true }));
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'billing.ledes.profile.created',
        entityType: 'ledesExportProfile',
        entityId: 'profile-new-default',
      }),
    );
  });

  it('rejects explicit invoice export when any requested invoice id is missing', async () => {
    const prisma = {
      lEDESExportProfile: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'profile-1',
          organizationId: 'org-1',
          format: 'LEDES98B',
          requireUtbmsPhaseCode: false,
          requireUtbmsTaskCode: false,
          includeExpenseLineItems: true,
        }),
      },
      invoice: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'inv-1',
            invoiceNumber: 'INV-0001',
            issuedAt: new Date('2026-01-10T00:00:00.000Z'),
            matter: { id: 'matter-1', name: 'Matter One', matterNumber: 'MAT-1' },
            lineItems: [],
          },
        ]),
      },
      lEDESExportJob: {
        create: jest.fn(),
      },
    } as any;

    const service = new BillingService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      { upload: jest.fn(), signedDownloadUrl: jest.fn() } as any,
    );

    await expect(
      service.createLedesExportJob({
        user: { id: 'u1', organizationId: 'org-1' } as any,
        profileId: 'profile-1',
        invoiceIds: ['inv-1', 'inv-2', ' inv-2 '],
      }),
    ).rejects.toEqual(new NotFoundException('Invoice(s) not found for export: inv-2'));

    expect(prisma.invoice.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: { in: ['inv-1', 'inv-2'] },
        }),
      }),
    );
    expect(prisma.lEDESExportJob.create).not.toHaveBeenCalled();
  });

  it('excludes expense lines when profile opts out of expense line items', async () => {
    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const s3 = {
      upload: jest.fn().mockResolvedValue({ key: 'org/org-1/exports/ledes/job-1.1998b' }),
      signedDownloadUrl: jest.fn().mockResolvedValue('https://download.local/job-1.1998b'),
    } as any;
    const prisma = {
      lEDESExportProfile: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'profile-1',
          organizationId: 'org-1',
          format: 'LEDES98B',
          requireUtbmsPhaseCode: true,
          requireUtbmsTaskCode: true,
          includeExpenseLineItems: false,
        }),
      },
      invoice: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'inv-1',
            invoiceNumber: 'INV-0001',
            issuedAt: new Date('2026-01-10T00:00:00.000Z'),
            matter: { id: 'matter-1', name: 'Matter One', matterNumber: 'MAT-1' },
            lineItems: [
              {
                id: 'line-expense',
                quantity: 1,
                amount: 300,
                description: 'Expert invoice pass-through',
                expenseId: 'expense-1',
                utbmsPhaseCode: null,
                utbmsTaskCode: null,
              },
              {
                id: 'line-fee',
                quantity: 2,
                amount: 500,
                description: 'Draft complaint',
                expenseId: null,
                utbmsPhaseCode: 'L100',
                utbmsTaskCode: 'L110',
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

    expect(result.status).toBe('COMPLETED');
    expect(result.validationStatus).toBe('PASSED');
    expect(result.lineCount).toBe(1);
    expect(result.totalAmount).toBe(500);
    expect(s3.upload).toHaveBeenCalledTimes(1);
    const uploadedBody = String(s3.upload.mock.calls[0][0]);
    expect(uploadedBody).toContain('INV-0001');
    expect(uploadedBody).toContain('Draft complaint');
    expect(uploadedBody).not.toContain('Expert invoice pass-through');
  });
});

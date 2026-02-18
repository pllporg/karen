import { UnprocessableEntityException } from '@nestjs/common';
import { BillingService } from '../src/billing/billing.service';

describe('BillingService trust reconciliation verification hardening', () => {
  it('records negative-balance discrepancy reason codes in run creation', async () => {
    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const prisma = {
      trustAccount: {
        findFirst: jest.fn().mockResolvedValue({ id: 'ta-1' }),
      },
      matterTrustLedger: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'ledger-neg',
            trustAccountId: 'ta-1',
            matterId: 'matter-1',
            balance: -20,
            trustAccount: { name: 'IOLTA Account' },
            matter: { name: 'Matter One' },
          },
        ]),
      },
      trustTransaction: {
        findMany: jest.fn().mockResolvedValue([]),
      },
      trustReconciliationRun: {
        create: jest.fn().mockResolvedValue({
          id: 'run-neg',
          discrepancies: [{ id: 'disc-neg-1' }],
        }),
      },
    } as any;

    const service = new BillingService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      audit,
      { upload: jest.fn() } as any,
    );

    await service.createTrustReconciliationRun({
      user: { id: 'u1', organizationId: 'org-1' } as any,
      trustAccountId: 'ta-1',
      statementStartAt: '2026-01-01T00:00:00.000Z',
      statementEndAt: '2026-01-31T23:59:59.999Z',
    });

    expect(prisma.trustReconciliationRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          summaryJson: expect.objectContaining({
            negativeBalanceViolations: 1,
          }),
          discrepancies: {
            create: [
              expect.objectContaining({
                reasonCode: 'NEGATIVE_BALANCE',
                ledgerBalance: -20,
                expectedBalance: 0,
                difference: -20,
                status: 'OPEN',
              }),
            ],
          },
        }),
      }),
    );
  });

  it('appends submission notes while transitioning run to in-review', async () => {
    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const prisma = {
      trustReconciliationRun: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'run-1',
          organizationId: 'org-1',
          status: 'DRAFT',
          notes: 'Initial reconciliation summary',
        }),
        update: jest.fn().mockResolvedValue({
          id: 'run-1',
          status: 'IN_REVIEW',
          notes: 'Initial reconciliation summary\n\nAttorney review complete',
        }),
      },
    } as any;

    const service = new BillingService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      audit,
      { upload: jest.fn() } as any,
    );

    await service.submitTrustReconciliationRun({
      user: { id: 'u1', organizationId: 'org-1' } as any,
      runId: 'run-1',
      notes: 'Attorney review complete',
    });

    expect(prisma.trustReconciliationRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'IN_REVIEW',
          notes: 'Initial reconciliation summary\n\nAttorney review complete',
        }),
      }),
    );
  });

  it('rejects unsupported discrepancy statuses before persistence lookup', async () => {
    const prisma = {
      trustReconciliationDiscrepancy: {
        findFirst: jest.fn(),
      },
    } as any;
    const service = new BillingService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      { upload: jest.fn() } as any,
    );

    await expect(
      service.resolveTrustReconciliationDiscrepancy({
        user: { id: 'u1', organizationId: 'org-1' } as any,
        discrepancyId: 'disc-1',
        status: 'OPEN' as any,
        resolutionNote: 'No action required',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    expect(prisma.trustReconciliationDiscrepancy.findFirst).not.toHaveBeenCalled();
  });

  it('rejects resolution for discrepancies that are already resolved', async () => {
    const prisma = {
      trustReconciliationDiscrepancy: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'disc-1',
          organizationId: 'org-1',
          runId: 'run-1',
          status: 'RESOLVED',
          run: {
            id: 'run-1',
            status: 'IN_REVIEW',
          },
        }),
      },
    } as any;
    const service = new BillingService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      { upload: jest.fn() } as any,
    );

    await expect(
      service.resolveTrustReconciliationDiscrepancy({
        user: { id: 'u1', organizationId: 'org-1' } as any,
        discrepancyId: 'disc-1',
        status: 'WAIVED' as any,
        resolutionNote: 'Already addressed',
      }),
    ).rejects.toThrow('Only open discrepancies can be resolved');
  });
});

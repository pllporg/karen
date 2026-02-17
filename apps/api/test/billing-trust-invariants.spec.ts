import { BillingService } from '../src/billing/billing.service';

describe('BillingService trust invariants + reports', () => {
  it('blocks withdrawal when resulting trust balance would be negative', async () => {
    const prisma = {
      trustAccount: { findFirst: jest.fn().mockResolvedValue({ id: 'ta-1' }) },
      matterTrustLedger: { findFirst: jest.fn().mockResolvedValue({ id: 'ledger-1', balance: 100 }) },
      trustTransaction: { create: jest.fn() },
    } as any;

    const service = new BillingService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn() } as any,
      { upload: jest.fn() } as any,
    );

    await expect(
      service.trustTransaction({
        user: { id: 'u1', organizationId: 'org-1' } as any,
        matterId: 'matter-1',
        trustAccountId: 'ta-1',
        type: 'WITHDRAWAL' as any,
        amount: 150,
      }),
    ).rejects.toThrow('Trust balance invariant violation');

    expect(prisma.trustTransaction.create).not.toHaveBeenCalled();
  });

  it('records adjustment audit event with resulting balance metadata', async () => {
    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const prisma = {
      trustAccount: { findFirst: jest.fn().mockResolvedValue({ id: 'ta-1' }) },
      matterTrustLedger: {
        findFirst: jest.fn().mockResolvedValue({ id: 'ledger-1', balance: 250 }),
        update: jest.fn().mockResolvedValue({ id: 'ledger-1' }),
      },
      trustTransaction: {
        create: jest.fn().mockResolvedValue({ id: 'tx-1' }),
      },
    } as any;

    const service = new BillingService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      audit,
      { upload: jest.fn() } as any,
    );

    await service.trustTransaction({
      user: { id: 'u1', organizationId: 'org-1' } as any,
      matterId: 'matter-1',
      trustAccountId: 'ta-1',
      type: 'ADJUSTMENT' as any,
      amount: -25,
      description: 'Correct prior entry',
    });

    expect(prisma.trustTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          amount: 25,
        }),
      }),
    );
    expect(prisma.matterTrustLedger.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ledger-1' },
        data: { balance: 225 },
      }),
    );
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'trust.adjustment.created',
        metadata: expect.objectContaining({
          delta: -25,
          resultingBalance: 225,
        }),
      }),
    );
  });

  it('returns account and matter level trust summaries', async () => {
    const service = new BillingService(
      {
        matterTrustLedger: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'l1',
              trustAccountId: 'ta-1',
              matterId: 'm-1',
              balance: 300,
              trustAccount: { name: 'IOLTA Account' },
              matter: { name: 'Matter A', matterNumber: 'M-001' },
            },
            {
              id: 'l2',
              trustAccountId: 'ta-1',
              matterId: 'm-2',
              balance: 125,
              trustAccount: { name: 'IOLTA Account' },
              matter: { name: 'Matter B', matterNumber: 'M-002' },
            },
            {
              id: 'l3',
              trustAccountId: 'ta-2',
              matterId: 'm-2',
              balance: 75,
              trustAccount: { name: 'Settlement Trust' },
              matter: { name: 'Matter B', matterNumber: 'M-002' },
            },
          ]),
        },
      } as any,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn() } as any,
      { upload: jest.fn() } as any,
    );

    const summary = await service.trustSummary({ organizationId: 'org-1' } as any);

    expect(summary).toEqual(
      expect.objectContaining({
        ledgerCount: 3,
        totalTrustBalance: 500,
      }),
    );
    expect(summary.accountSummaries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ trustAccountId: 'ta-1', totalBalance: 425, matterCount: 2 }),
        expect.objectContaining({ trustAccountId: 'ta-2', totalBalance: 75, matterCount: 1 }),
      ]),
    );
    expect(summary.matterSummaries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ matterId: 'm-1', totalBalance: 300, trustAccountCount: 1 }),
        expect.objectContaining({ matterId: 'm-2', totalBalance: 200, trustAccountCount: 2 }),
      ]),
    );
  });

  it('reports reconciliation mismatches between ledger and transaction-derived balances', async () => {
    const service = new BillingService(
      {
        matterTrustLedger: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'l1',
              trustAccountId: 'ta-1',
              matterId: 'm-1',
              balance: 300,
              trustAccount: { name: 'IOLTA Account' },
              matter: { name: 'Matter A' },
            },
          ]),
        },
        trustTransaction: {
          findMany: jest.fn().mockResolvedValue([
            { trustAccountId: 'ta-1', matterId: 'm-1', type: 'DEPOSIT', amount: 500 },
            { trustAccountId: 'ta-1', matterId: 'm-1', type: 'WITHDRAWAL', amount: 150 },
          ]),
        },
      } as any,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn() } as any,
      { upload: jest.fn() } as any,
    );

    const report = await service.trustReconciliation({ organizationId: 'org-1' } as any);
    expect(report).toEqual(
      expect.objectContaining({
        checkedLedgers: 1,
        checkedTransactions: 2,
        mismatchCount: 1,
      }),
    );
    expect(report.mismatches[0]).toEqual(
      expect.objectContaining({
        trustAccountId: 'ta-1',
        matterId: 'm-1',
        expectedBalance: 350,
        ledgerBalance: 300,
        difference: -50,
      }),
    );
  });
});


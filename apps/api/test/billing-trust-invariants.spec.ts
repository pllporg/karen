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

  it('creates paired transfer entries and updates both ledgers atomically', async () => {
    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const txClient = {
      matterTrustLedger: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({ id: 'ledger-src', balance: 300 })
          .mockResolvedValueOnce({ id: 'ledger-dst', balance: 50 }),
        update: jest.fn().mockResolvedValue({}),
        create: jest.fn(),
      },
      trustTransaction: {
        create: jest
          .fn()
          .mockResolvedValueOnce({ id: 'tx-out' })
          .mockResolvedValueOnce({ id: 'tx-in' }),
      },
    } as any;
    const prisma = {
      trustAccount: { findFirst: jest.fn().mockResolvedValue({ id: 'ta-1' }) },
      $transaction: jest.fn().mockImplementation(async (handler: (client: typeof txClient) => Promise<unknown>) => handler(txClient)),
    } as any;

    const service = new BillingService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      audit,
      { upload: jest.fn() } as any,
    );

    const result = await service.transferTrust({
      user: { id: 'u1', organizationId: 'org-1' } as any,
      trustAccountId: 'ta-1',
      fromMatterId: 'matter-src',
      toMatterId: 'matter-dst',
      amount: 75,
      description: 'Reallocate trust retainer',
    });

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    expect(txClient.trustTransaction.create).toHaveBeenCalledTimes(2);
    expect(txClient.matterTrustLedger.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ledger-src' },
        data: { balance: 225 },
      }),
    );
    expect(txClient.matterTrustLedger.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ledger-dst' },
        data: { balance: 125 },
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({
        withdrawalTransactionId: 'tx-out',
        depositTransactionId: 'tx-in',
        sourceBalance: 225,
        destinationBalance: 125,
      }),
    );
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'trust.transfer.completed',
        metadata: expect.objectContaining({
          sourceBalance: 225,
          destinationBalance: 125,
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

  it('treats transfer in/out descriptors as opposite reconciliation deltas', async () => {
    const service = new BillingService(
      {
        matterTrustLedger: {
          findMany: jest.fn().mockResolvedValue([
            {
              id: 'l1',
              trustAccountId: 'ta-1',
              matterId: 'm-src',
              balance: 200,
              trustAccount: { name: 'IOLTA Account' },
              matter: { name: 'Matter Source' },
            },
            {
              id: 'l2',
              trustAccountId: 'ta-1',
              matterId: 'm-dst',
              balance: 100,
              trustAccount: { name: 'IOLTA Account' },
              matter: { name: 'Matter Dest' },
            },
          ]),
        },
        trustTransaction: {
          findMany: jest.fn().mockResolvedValue([
            { trustAccountId: 'ta-1', matterId: 'm-src', type: 'DEPOSIT', amount: 300 },
            {
              trustAccountId: 'ta-1',
              matterId: 'm-src',
              type: 'TRANSFER',
              amount: 100,
              description: 'Trust transfer | transfer:abc123 | out',
            },
            {
              trustAccountId: 'ta-1',
              matterId: 'm-dst',
              type: 'TRANSFER',
              amount: 100,
              description: 'Trust transfer | transfer:abc123 | in',
            },
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
        checkedLedgers: 2,
        checkedTransactions: 3,
        mismatchCount: 0,
      }),
    );
    expect(report.mismatches).toEqual([]);
  });

  it('creates trust reconciliation run with discrepancy records', async () => {
    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const prisma = {
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
          { trustAccountId: 'ta-1', matterId: 'm-1', type: 'DEPOSIT', amount: 500, occurredAt: new Date('2026-01-01') },
          { trustAccountId: 'ta-1', matterId: 'm-1', type: 'WITHDRAWAL', amount: 150, occurredAt: new Date('2026-01-05') },
        ]),
      },
      trustReconciliationRun: {
        create: jest.fn().mockResolvedValue({
          id: 'run-1',
          discrepancies: [{ id: 'disc-1' }],
        }),
      },
    } as any;

    const service = new BillingService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      audit,
      { upload: jest.fn() } as any,
    );

    const run = await service.createTrustReconciliationRun({
      user: { id: 'u1', organizationId: 'org-1' } as any,
      statementStartAt: '2026-01-01T00:00:00.000Z',
      statementEndAt: '2026-01-31T23:59:59.999Z',
    });

    expect(run.id).toBe('run-1');
    expect(prisma.trustReconciliationRun.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'DRAFT',
          discrepancies: expect.any(Object),
        }),
      }),
    );
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'trust.reconciliation.run.created',
        entityType: 'trustReconciliationRun',
      }),
    );
  });

  it('requires discrepancy resolution before reconciliation run completion and records sign-off', async () => {
    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const prisma = {
      trustReconciliationRun: {
        findFirst: jest
          .fn()
          .mockResolvedValueOnce({
            id: 'run-1',
            organizationId: 'org-1',
            status: 'IN_REVIEW',
            notes: null,
            discrepancies: [{ id: 'disc-1', status: 'OPEN' }],
          })
          .mockResolvedValueOnce({
            id: 'run-1',
            organizationId: 'org-1',
            status: 'IN_REVIEW',
            notes: null,
            discrepancies: [{ id: 'disc-1', status: 'RESOLVED' }],
          }),
        update: jest.fn().mockResolvedValue({
          id: 'run-1',
          status: 'COMPLETED',
          signedOffAt: new Date('2026-01-31T12:00:00.000Z'),
        }),
      },
    } as any;

    const service = new BillingService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      audit,
      { upload: jest.fn() } as any,
    );

    await expect(
      service.completeTrustReconciliationRun({
        user: { id: 'u1', organizationId: 'org-1' } as any,
        runId: 'run-1',
      }),
    ).rejects.toThrow('All discrepancies must be resolved or waived before completion');

    const completed = await service.completeTrustReconciliationRun({
      user: { id: 'u1', organizationId: 'org-1' } as any,
      runId: 'run-1',
      notes: 'Attorney sign-off complete',
    });

    expect(completed.status).toBe('COMPLETED');
    expect(prisma.trustReconciliationRun.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'COMPLETED',
          signedOffByUserId: 'u1',
        }),
      }),
    );
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'trust.reconciliation.run.completed',
      }),
    );
  });
});

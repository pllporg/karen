import { CommunicationsService } from '../src/communications/communications.service';

function user() {
  return {
    id: 'user-1',
    organizationId: 'org-1',
    membership: { role: { name: 'Attorney' } },
  } as any;
}

function sqlText(callArg: any) {
  return String(callArg?.strings?.join(' ') || '');
}

function sqlValues(callArg: any) {
  return Array.isArray(callArg?.values) ? callArg.values.map((value: unknown) => String(value)) : [];
}

describe('CommunicationsService search ranking', () => {
  it('returns ranked full-text results when matches are found', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: 'msg-1',
          threadId: 'thread-1',
          subject: 'Inspection report follow-up',
          body: 'Draft email to inspector',
          occurredAt: new Date('2026-02-01T10:00:00.000Z'),
          rank: 0.79,
          snippet: 'Inspection report ...',
        },
      ]),
    } as any;

    const service = new CommunicationsService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      { sendEmail: jest.fn(), sendSms: jest.fn() } as any,
    );

    const result = await service.search(user(), 'inspection follow-up');
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'msg-1',
          rank: 0.79,
          matchStrategy: 'full_text',
        }),
      ]),
    );
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(1);

    const queryArg = prisma.$queryRaw.mock.calls[0][0] as any;
    const querySql = sqlText(queryArg);
    expect(querySql).toContain('websearch_to_tsquery');
    expect(querySql).toContain('ORDER BY rank DESC');
  });

  it('falls back to substring search when full-text yields no rows', async () => {
    const prisma = {
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: 'msg-2',
            threadId: 'thread-1',
            subject: null,
            body: 'Need updated estimate',
            occurredAt: new Date('2026-02-02T10:00:00.000Z'),
          },
        ]),
    } as any;

    const service = new CommunicationsService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      { sendEmail: jest.fn(), sendSms: jest.fn() } as any,
    );

    const result = await service.search(user(), 'estimate');
    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'msg-2',
          rank: 0,
          matchStrategy: 'substring',
        }),
      ]),
    );
    expect(prisma.$queryRaw).toHaveBeenCalledTimes(2);
  });

  it('applies matter access checks and matter filter to search queries', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: 'msg-3',
          threadId: 'thread-2',
          subject: 'Court deadline memo',
          body: 'Serve updated disclosures',
          occurredAt: new Date('2026-02-03T10:00:00.000Z'),
          rank: 0.6,
          snippet: 'Court deadline memo',
        },
      ]),
    } as any;

    const access = {
      assertMatterAccess: jest.fn().mockResolvedValue(undefined),
    } as any;

    const service = new CommunicationsService(
      prisma,
      access,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      { sendEmail: jest.fn(), sendSms: jest.fn() } as any,
    );

    await service.search(user(), 'deadline memo', 'matter-77');

    expect(access.assertMatterAccess).toHaveBeenCalledWith(expect.any(Object), 'matter-77', 'read');
    const queryArg = prisma.$queryRaw.mock.calls[0][0] as any;
    expect(sqlText(queryArg)).toContain('AND t."matterId" =');
    expect(sqlValues(queryArg)).toContain('matter-77');
  });

  it('escapes SQL wildcard characters in fallback substring search', async () => {
    const prisma = {
      $queryRaw: jest
        .fn()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          {
            id: 'msg-4',
            threadId: 'thread-3',
            subject: null,
            body: 'Repair estimate updated',
            occurredAt: new Date('2026-02-04T10:00:00.000Z'),
          },
        ]),
    } as any;

    const service = new CommunicationsService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      { sendEmail: jest.fn(), sendSms: jest.fn() } as any,
    );

    await service.search(user(), '100%_estimate');

    const fallbackArg = prisma.$queryRaw.mock.calls[1][0] as any;
    expect(sqlText(fallbackArg)).toContain("ILIKE");
    expect(sqlValues(fallbackArg)).toContain('%100\\%\\_estimate%');
  });

  it('normalizes and bounds oversized query strings before query execution', async () => {
    const prisma = {
      $queryRaw: jest.fn().mockResolvedValue([
        {
          id: 'msg-5',
          threadId: 'thread-4',
          subject: 'Normalized query',
          body: 'Result',
          occurredAt: new Date('2026-02-05T10:00:00.000Z'),
          rank: 0.4,
          snippet: 'Normalized query',
        },
      ]),
    } as any;

    const service = new CommunicationsService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      { sendEmail: jest.fn(), sendSms: jest.fn() } as any,
    );

    const veryLongQuery = `   ${'A'.repeat(520)}   urgent    `;
    await service.search(user(), veryLongQuery);

    const firstArg = prisma.$queryRaw.mock.calls[0][0] as any;
    const values = sqlValues(firstArg);
    const tsQueryValue = values[0] || '';
    expect(tsQueryValue.length).toBe(512);
    expect(tsQueryValue.includes('  ')).toBe(false);
  });

  it('returns empty list for blank queries without querying database', async () => {
    const prisma = {
      $queryRaw: jest.fn(),
    } as any;

    const service = new CommunicationsService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
      { sendEmail: jest.fn(), sendSms: jest.fn() } as any,
    );

    const result = await service.search(user(), '   ');
    expect(result).toEqual([]);
    expect(prisma.$queryRaw).not.toHaveBeenCalled();
  });
});

import { CommunicationsService } from '../src/communications/communications.service';

function user() {
  return {
    id: 'user-1',
    organizationId: 'org-1',
    membership: { role: { name: 'Attorney' } },
  } as any;
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
    const sqlText = String(queryArg?.strings?.join(' ') || '');
    expect(sqlText).toContain('websearch_to_tsquery');
    expect(sqlText).toContain('ORDER BY rank DESC');
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

import { UnprocessableEntityException } from '@nestjs/common';
import { CalendarService } from '../src/calendar/calendar.service';

const baseUser = {
  id: 'user-1',
  organizationId: 'org-1',
} as any;

describe('CalendarService deadline rules verification hardening', () => {
  it('selects the most specific active matching rules pack with latest effective version', async () => {
    const prisma = {
      matter: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'matter-1',
          jurisdiction: 'CA',
          venue: 'Superior',
          practiceArea: 'Civil',
        }),
      },
      deadlineRuleTemplate: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'pack-global',
            name: 'Global CA Pack',
            configJson: {
              pack: {
                key: 'ca::general::general',
                jurisdiction: 'CA',
                version: '1.0',
                effectiveFrom: '2025-01-01T00:00:00.000Z',
                isActive: true,
              },
              rules: [{ id: 'rule-global', name: 'Global', offsetDays: 10, businessDaysOnly: false, eventType: 'Global' }],
            },
          },
          {
            id: 'pack-specific-v1',
            name: 'CA Superior Civil v1',
            configJson: {
              pack: {
                key: 'ca::superior::civil',
                jurisdiction: 'CA',
                court: 'Superior',
                procedure: 'Civil',
                version: '1.0',
                effectiveFrom: '2026-01-01T00:00:00.000Z',
                isActive: true,
              },
              rules: [{ id: 'rule-v1', name: 'V1', offsetDays: 5, businessDaysOnly: false, eventType: 'Specific V1' }],
            },
          },
          {
            id: 'pack-specific-v2',
            name: 'CA Superior Civil v2',
            configJson: {
              pack: {
                key: 'ca::superior::civil',
                jurisdiction: 'CA',
                court: 'Superior',
                procedure: 'Civil',
                version: '2.0',
                effectiveFrom: '2026-06-01T00:00:00.000Z',
                isActive: true,
              },
              rules: [{ id: 'rule-v2', name: 'V2', offsetDays: 7, businessDaysOnly: false, eventType: 'Specific V2' }],
            },
          },
        ]),
      },
    } as any;
    const access = { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new CalendarService(prisma, access, { appendEvent: jest.fn().mockResolvedValue(undefined) } as any);

    const preview = await service.previewDeadlines({
      user: baseUser,
      matterId: 'matter-1',
      triggerDate: '2026-06-20T00:00:00.000Z',
    });

    expect(preview.rulesPack.id).toBe('pack-specific-v2');
    expect(preview.previewRows[0]).toEqual(
      expect.objectContaining({
        ruleId: 'rule-v2',
        eventType: 'Specific V2',
      }),
    );
  });

  it('rejects explicit selection of an inactive rules pack', async () => {
    const prisma = {
      matter: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'matter-1',
          jurisdiction: 'CA',
          venue: 'Superior',
          practiceArea: 'Civil',
        }),
      },
      deadlineRuleTemplate: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'pack-inactive',
            name: 'Inactive Pack',
            configJson: {
              pack: {
                key: 'ca::superior::civil',
                jurisdiction: 'CA',
                court: 'Superior',
                procedure: 'Civil',
                version: '1.0',
                effectiveFrom: '2026-01-01T00:00:00.000Z',
                isActive: false,
              },
              rules: [{ id: 'rule-1', name: 'Deadline', offsetDays: 7, businessDaysOnly: false, eventType: 'Deadline' }],
            },
          },
        ]),
      },
    } as any;
    const service = new CalendarService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
    );

    await expect(
      service.previewDeadlines({
        user: baseUser,
        matterId: 'matter-1',
        triggerDate: '2026-06-20T00:00:00.000Z',
        rulesPackId: 'pack-inactive',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('rejects explicit selection of a pack outside effective window', async () => {
    const prisma = {
      matter: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'matter-1',
          jurisdiction: 'CA',
          venue: 'Superior',
          practiceArea: 'Civil',
        }),
      },
      deadlineRuleTemplate: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'pack-future',
            name: 'Future Pack',
            configJson: {
              pack: {
                key: 'ca::superior::civil',
                jurisdiction: 'CA',
                court: 'Superior',
                procedure: 'Civil',
                version: '2.0',
                effectiveFrom: '2027-01-01T00:00:00.000Z',
                isActive: true,
              },
              rules: [{ id: 'rule-1', name: 'Deadline', offsetDays: 7, businessDaysOnly: false, eventType: 'Deadline' }],
            },
          },
        ]),
      },
    } as any;
    const service = new CalendarService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
    );

    await expect(
      service.previewDeadlines({
        user: baseUser,
        matterId: 'matter-1',
        triggerDate: '2026-06-20T00:00:00.000Z',
        rulesPackId: 'pack-future',
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('rejects unknown and duplicate rule selections on apply', async () => {
    const prisma = {
      matter: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'matter-1',
          jurisdiction: 'CA',
          venue: 'Superior',
          practiceArea: 'Civil',
        }),
      },
      deadlineRuleTemplate: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'pack-1',
            name: 'Pack',
            configJson: {
              pack: {
                key: 'ca::superior::civil',
                jurisdiction: 'CA',
                court: 'Superior',
                procedure: 'Civil',
                version: '1.0',
                effectiveFrom: '2026-01-01T00:00:00.000Z',
                isActive: true,
              },
              rules: [{ id: 'rule-1', name: 'Deadline', offsetDays: 10, businessDaysOnly: false, eventType: 'Deadline' }],
            },
          },
        ]),
      },
      calendarEvent: {
        create: jest.fn(),
      },
    } as any;
    const service = new CalendarService(
      prisma,
      { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any,
      { appendEvent: jest.fn().mockResolvedValue(undefined) } as any,
    );

    await expect(
      service.applyDeadlinePreview({
        user: baseUser,
        matterId: 'matter-1',
        triggerDate: '2026-06-20T00:00:00.000Z',
        rulesPackId: 'pack-1',
        selections: [{ ruleId: 'rule-unknown', apply: true }],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);

    await expect(
      service.applyDeadlinePreview({
        user: baseUser,
        matterId: 'matter-1',
        triggerDate: '2026-06-20T00:00:00.000Z',
        rulesPackId: 'pack-1',
        selections: [
          { ruleId: 'rule-1', apply: true },
          { ruleId: 'rule-1', apply: false },
        ],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});

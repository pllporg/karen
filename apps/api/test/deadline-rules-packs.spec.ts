import { UnprocessableEntityException } from '@nestjs/common';
import { CalendarService } from '../src/calendar/calendar.service';

const baseUser = {
  id: 'user-1',
  organizationId: 'org-1',
} as any;

describe('CalendarService deadline rules packs', () => {
  it('creates a rules pack with versioned metadata and rules', async () => {
    const prisma = {
      deadlineRuleTemplate: {
        create: jest.fn().mockResolvedValue({
          id: 'pack-1',
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
            rules: [{ id: 'rule-1', name: 'Initial disclosures', offsetDays: 30, businessDaysOnly: false, eventType: 'Initial disclosures' }],
          },
        }),
      },
    } as any;

    const service = new CalendarService(prisma, { assertMatterAccess: jest.fn() } as any, {
      appendEvent: jest.fn().mockResolvedValue(undefined),
    } as any);

    const created = await service.createRulesPack({
      user: baseUser,
      jurisdiction: 'CA',
      court: 'Superior',
      procedure: 'Civil',
      version: '1.0',
      effectiveFrom: '2026-01-01',
      rules: [{ name: 'Initial disclosures', offsetDays: 30 }],
    });

    expect(prisma.deadlineRuleTemplate.create).toHaveBeenCalled();
    expect(created).toEqual(
      expect.objectContaining({
        id: 'pack-1',
        pack: expect.objectContaining({
          jurisdiction: 'CA',
          version: '1.0',
        }),
      }),
    );
  });

  it('previews deadlines from selected rules pack and computes business-day offsets', async () => {
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
              rules: [
                { id: 'rule-1', name: 'Status conference', offsetDays: 5, businessDaysOnly: true, eventType: 'Status Conference' },
              ],
            },
          },
        ]),
      },
    } as any;
    const access = { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new CalendarService(prisma, access, { appendEvent: jest.fn() } as any);

    const preview = await service.previewDeadlines({
      user: baseUser,
      matterId: 'matter-1',
      triggerDate: '2026-01-02T00:00:00.000Z', // Friday
      rulesPackId: 'pack-1',
    });

    expect(access.assertMatterAccess).toHaveBeenCalledWith(baseUser, 'matter-1');
    expect(preview.previewRows[0]).toEqual(
      expect.objectContaining({
        ruleId: 'rule-1',
        eventType: 'Status Conference',
      }),
    );
    // Friday + 5 business days = next Friday.
    expect(preview.previewRows[0].computedDate.startsWith('2026-01-09')).toBe(true);
  });

  it('requires override reason when applying deadline override', async () => {
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
                version: '1.0',
                effectiveFrom: '2026-01-01T00:00:00.000Z',
                isActive: true,
              },
              rules: [{ id: 'rule-1', name: 'Deadline', offsetDays: 10, businessDaysOnly: false, eventType: 'Deadline' }],
            },
          },
        ]),
      },
      calendarEvent: { create: jest.fn() },
    } as any;

    const access = { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new CalendarService(prisma, access, { appendEvent: jest.fn() } as any);

    await expect(
      service.applyDeadlinePreview({
        user: baseUser,
        matterId: 'matter-1',
        triggerDate: '2026-01-05',
        rulesPackId: 'pack-1',
        selections: [{ ruleId: 'rule-1', overrideDate: '2026-01-20' }],
      }),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });
});

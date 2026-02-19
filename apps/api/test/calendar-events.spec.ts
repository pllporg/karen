import { NotFoundException } from '@nestjs/common';
import { CalendarService } from '../src/calendar/calendar.service';

describe('CalendarService event lifecycle', () => {
  const baseUser = {
    id: 'user-1',
    email: 'user@example.com',
    organizationId: 'org-1',
    permissions: [],
    membership: { role: { name: 'Attorney' } },
  } as any;

  it('updates an event and emits audit event', async () => {
    const prisma = {
      calendarEvent: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'event-1',
          organizationId: 'org-1',
          matterId: 'matter-1',
          type: 'Inspection',
          startAt: new Date('2026-04-01T10:00:00.000Z'),
          endAt: null,
        }),
        update: jest.fn().mockResolvedValue({
          id: 'event-1',
          organizationId: 'org-1',
          matterId: 'matter-1',
          type: 'Site Visit',
          startAt: new Date('2026-04-02T11:00:00.000Z'),
          endAt: null,
        }),
      },
    } as any;

    const access = { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any;
    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new CalendarService(prisma, access, audit);

    const updated = await service.update({
      user: baseUser,
      eventId: 'event-1',
      type: 'Site Visit',
      startAt: '2026-04-02T11:00:00.000Z',
      clearEndAt: true,
    });

    expect(access.assertMatterAccess).toHaveBeenCalledWith(baseUser, 'matter-1', 'write');
    expect(prisma.calendarEvent.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'event-1' },
        data: expect.objectContaining({
          type: 'Site Visit',
          startAt: new Date('2026-04-02T11:00:00.000Z'),
          endAt: null,
        }),
      }),
    );
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'calendar_event.updated',
        entityId: 'event-1',
      }),
    );
    expect(updated.type).toBe('Site Visit');
  });

  it('deletes an event and emits audit event', async () => {
    const prisma = {
      calendarEvent: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'event-1',
          organizationId: 'org-1',
          matterId: 'matter-1',
        }),
        delete: jest.fn().mockResolvedValue(undefined),
      },
    } as any;

    const access = { assertMatterAccess: jest.fn().mockResolvedValue(undefined) } as any;
    const audit = { appendEvent: jest.fn().mockResolvedValue(undefined) } as any;
    const service = new CalendarService(prisma, access, audit);

    const removed = await service.remove({
      user: baseUser,
      eventId: 'event-1',
    });

    expect(access.assertMatterAccess).toHaveBeenCalledWith(baseUser, 'matter-1', 'write');
    expect(prisma.calendarEvent.delete).toHaveBeenCalledWith({ where: { id: 'event-1' } });
    expect(audit.appendEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'calendar_event.deleted',
        entityId: 'event-1',
      }),
    );
    expect(removed).toEqual({ id: 'event-1', removed: true });
  });

  it('throws NotFoundException for missing update target', async () => {
    const service = new CalendarService(
      {
        calendarEvent: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      } as any,
      { assertMatterAccess: jest.fn() } as any,
      { appendEvent: jest.fn() } as any,
    );

    await expect(
      service.update({
        user: baseUser,
        eventId: 'missing',
        type: 'Inspection',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws NotFoundException for missing delete target', async () => {
    const service = new CalendarService(
      {
        calendarEvent: {
          findFirst: jest.fn().mockResolvedValue(null),
        },
      } as any,
      { assertMatterAccess: jest.fn() } as any,
      { appendEvent: jest.fn() } as any,
    );

    await expect(
      service.remove({
        user: baseUser,
        eventId: 'missing',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});

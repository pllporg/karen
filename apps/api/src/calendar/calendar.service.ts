import { Injectable } from '@nestjs/common';
import { createEvents } from 'ics';
import { PrismaService } from '../prisma/prisma.service';
import { AccessService } from '../access/access.service';
import { AuthenticatedUser } from '../common/types';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class CalendarService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: AccessService,
    private readonly audit: AuditService,
  ) {}

  async list(user: AuthenticatedUser, matterId?: string) {
    if (matterId) {
      await this.access.assertMatterAccess(user, matterId);
    }
    return this.prisma.calendarEvent.findMany({
      where: {
        organizationId: user.organizationId,
        ...(matterId ? { matterId } : {}),
      },
      orderBy: { startAt: 'asc' },
    });
  }

  async create(input: {
    user: AuthenticatedUser;
    matterId: string;
    type: string;
    startAt: string;
    endAt?: string;
    location?: string;
    description?: string;
  }) {
    await this.access.assertMatterAccess(input.user, input.matterId, 'write');

    const event = await this.prisma.calendarEvent.create({
      data: {
        organizationId: input.user.organizationId,
        matterId: input.matterId,
        type: input.type,
        startAt: new Date(input.startAt),
        endAt: input.endAt ? new Date(input.endAt) : null,
        location: input.location,
        description: input.description,
      },
    });

    await this.audit.appendEvent({
      organizationId: input.user.organizationId,
      actorUserId: input.user.id,
      action: 'calendar_event.created',
      entityType: 'calendarEvent',
      entityId: event.id,
      metadata: event,
    });

    return event;
  }

  async exportIcs(user: AuthenticatedUser, matterId: string): Promise<string> {
    await this.access.assertMatterAccess(user, matterId);
    const events = await this.prisma.calendarEvent.findMany({
      where: {
        organizationId: user.organizationId,
        matterId,
      },
      orderBy: { startAt: 'asc' },
    });

    const icsEvents = events.map((event) => {
      const endAt = event.endAt ?? new Date(event.startAt.getTime() + 60 * 60 * 1000);
      return {
        title: event.type,
        description: event.description ?? '',
        location: event.location ?? '',
        start: [
          event.startAt.getUTCFullYear(),
          event.startAt.getUTCMonth() + 1,
          event.startAt.getUTCDate(),
          event.startAt.getUTCHours(),
          event.startAt.getUTCMinutes(),
        ] as [number, number, number, number, number],
        end: [
          endAt.getUTCFullYear(),
          endAt.getUTCMonth() + 1,
          endAt.getUTCDate(),
          endAt.getUTCHours(),
          endAt.getUTCMinutes(),
        ] as [number, number, number, number, number],
      };
    });

    const { error, value } = createEvents(icsEvents);
    if (error) {
      throw error;
    }

    return value ?? '';
  }
}

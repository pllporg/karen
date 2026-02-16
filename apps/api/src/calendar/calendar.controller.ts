import { Body, Controller, Get, Param, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { CalendarService } from './calendar.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';
import { CreateCalendarEventDto } from './dto/create-event.dto';

@Controller('calendar')
@UseGuards(SessionAuthGuard, PermissionGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('events')
  @RequirePermissions('calendar:read')
  list(@CurrentUser() user: AuthenticatedUser, @Query('matterId') matterId?: string) {
    return this.calendarService.list(user, matterId);
  }

  @Post('events')
  @RequirePermissions('calendar:write')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCalendarEventDto) {
    return this.calendarService.create({ user, ...dto });
  }

  @Get('events/:matterId/ics')
  @RequirePermissions('calendar:read')
  async exportIcs(@CurrentUser() user: AuthenticatedUser, @Param('matterId') matterId: string, @Res() res: Response) {
    const ics = await this.calendarService.exportIcs(user, matterId);
    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', `attachment; filename="${matterId}.ics"`);
    res.send(ics);
  }
}

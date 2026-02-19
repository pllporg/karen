import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { CalendarService } from './calendar.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';
import { CreateCalendarEventDto } from './dto/create-event.dto';
import { UpdateCalendarEventDto } from './dto/update-event.dto';
import { CreateRulesPackDto } from './dto/create-rules-pack.dto';
import { PreviewDeadlinesDto } from './dto/preview-deadlines.dto';
import { ApplyDeadlinePreviewDto } from './dto/apply-deadline-preview.dto';

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

  @Patch('events/:id')
  @RequirePermissions('calendar:write')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateCalendarEventDto) {
    return this.calendarService.update({
      user,
      eventId: id,
      ...dto,
    });
  }

  @Delete('events/:id')
  @RequirePermissions('calendar:write')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.calendarService.remove({
      user,
      eventId: id,
    });
  }

  @Get('rules-packs')
  @RequirePermissions('calendar:read')
  listRulesPacks(@CurrentUser() user: AuthenticatedUser) {
    return this.calendarService.listRulesPacks(user);
  }

  @Post('rules-packs')
  @RequirePermissions('calendar:write')
  createRulesPack(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRulesPackDto) {
    return this.calendarService.createRulesPack({
      user,
      ...dto,
    });
  }

  @Post('deadline-preview')
  @RequirePermissions('calendar:read')
  previewDeadlines(@CurrentUser() user: AuthenticatedUser, @Body() dto: PreviewDeadlinesDto) {
    return this.calendarService.previewDeadlines({
      user,
      matterId: dto.matterId,
      triggerDate: dto.triggerDate,
      rulesPackId: dto.rulesPackId,
    });
  }

  @Post('deadline-preview/apply')
  @RequirePermissions('calendar:write')
  applyDeadlinePreview(@CurrentUser() user: AuthenticatedUser, @Body() dto: ApplyDeadlinePreviewDto) {
    return this.calendarService.applyDeadlinePreview({
      user,
      matterId: dto.matterId,
      triggerDate: dto.triggerDate,
      rulesPackId: dto.rulesPackId,
      selections: dto.selections,
    });
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

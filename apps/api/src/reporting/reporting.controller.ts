import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { ReportingService } from './reporting.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';

@Controller('reporting')
@UseGuards(SessionAuthGuard, PermissionGuard)
export class ReportingController {
  constructor(private readonly reportingService: ReportingService) {}

  @Get('matters-by-stage')
  @RequirePermissions('reporting:read')
  mattersByStage(@CurrentUser() user: AuthenticatedUser) {
    return this.reportingService.mattersByStage(user.organizationId);
  }

  @Get('upcoming-deadlines')
  @RequirePermissions('reporting:read')
  upcomingDeadlines(@CurrentUser() user: AuthenticatedUser, @Query('days') days?: string) {
    return this.reportingService.upcomingDeadlines(user.organizationId, days ? Number(days) : 30);
  }

  @Get('wip')
  @RequirePermissions('reporting:read')
  wip(@CurrentUser() user: AuthenticatedUser) {
    return this.reportingService.wip(user.organizationId);
  }

  @Get('ar-aging')
  @RequirePermissions('reporting:read')
  arAging(@CurrentUser() user: AuthenticatedUser) {
    return this.reportingService.arAging(user.organizationId);
  }

  @Get('csv')
  @RequirePermissions('reporting:read')
  async csv(
    @CurrentUser() user: AuthenticatedUser,
    @Query('report') report: 'matters-by-stage' | 'upcoming-deadlines' | 'wip' | 'ar-aging',
    @Res() res: Response,
  ) {
    let rows: object[] = [];
    if (report === 'matters-by-stage') rows = await this.reportingService.mattersByStage(user.organizationId);
    if (report === 'upcoming-deadlines') rows = await this.reportingService.upcomingDeadlines(user.organizationId);
    if (report === 'wip') rows = await this.reportingService.wip(user.organizationId);
    if (report === 'ar-aging') rows = await this.reportingService.arAging(user.organizationId);

    const csv = this.reportingService.toCsv(rows);
    res.setHeader('content-type', 'text/csv');
    res.setHeader('content-disposition', `attachment; filename="${report}.csv"`);
    res.send(csv);
  }
}

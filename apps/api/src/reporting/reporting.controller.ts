import { BadRequestException, Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
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

  private async getAnalystRows(
    organizationId: string,
    report: 'bottlenecks' | 'capacity' | 'growth',
  ): Promise<object[]> {
    if (report === 'bottlenecks') return this.reportingService.bottlenecks(organizationId);
    if (report === 'capacity') return this.reportingService.capacity(organizationId);
    return this.reportingService.growth(organizationId);
  }

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

  @Get('analyst/bottlenecks')
  @RequirePermissions('reporting:read')
  analystBottlenecks(@CurrentUser() user: AuthenticatedUser) {
    return this.reportingService.bottlenecks(user.organizationId);
  }

  @Get('analyst/capacity')
  @RequirePermissions('reporting:read')
  analystCapacity(@CurrentUser() user: AuthenticatedUser) {
    return this.reportingService.capacity(user.organizationId);
  }

  @Get('analyst/growth')
  @RequirePermissions('reporting:read')
  analystGrowth(@CurrentUser() user: AuthenticatedUser) {
    return this.reportingService.growth(user.organizationId);
  }

  @Get('analyst/csv')
  @RequirePermissions('reporting:read')
  async analystCsv(
    @CurrentUser() user: AuthenticatedUser,
    @Query('report') report: string,
    @Res() res: Response,
  ) {
    if (report !== 'bottlenecks' && report !== 'capacity' && report !== 'growth') {
      throw new BadRequestException('report must be one of: bottlenecks, capacity, growth');
    }

    const columns: Record<'bottlenecks' | 'capacity' | 'growth', string[]> = {
      bottlenecks: ['matterId', 'matterName', 'stageName', 'overdueTaskCount', 'openTaskCount'],
      capacity: ['userId', 'userName', 'userEmail', 'openTaskCount', 'billedMinutes', 'billedAmount'],
      growth: ['month', 'mattersOpened', 'cumulativeMatters'],
    };
    const rows = await this.getAnalystRows(user.organizationId, report);
    const csv = this.reportingService.toCsv(rows, columns[report]);
    res.setHeader('content-type', 'text/csv');
    res.setHeader('content-disposition', `attachment; filename="analyst-${report}.csv"`);
    res.send(csv);
  }
}

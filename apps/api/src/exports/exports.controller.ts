import { Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ExportsService } from './exports.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';

@Controller('exports')
@UseGuards(SessionAuthGuard, PermissionGuard)
export class ExportsController {
  constructor(private readonly exportsService: ExportsService) {}

  @Get('jobs')
  @RequirePermissions('exports:read')
  listJobs(@CurrentUser() user: AuthenticatedUser) {
    return this.exportsService.listJobs(user.organizationId);
  }

  @Post('full-backup')
  @RequirePermissions('exports:write')
  runFullBackup(@CurrentUser() user: AuthenticatedUser) {
    return this.exportsService.runFullBackup(user);
  }
}

import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuditService } from './audit.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';

@Controller('audit')
@UseGuards(SessionAuthGuard, PermissionGuard)
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @RequirePermissions('audit:read')
  async list(@CurrentUser() user: AuthenticatedUser, @Query('limit') limit?: string) {
    return this.auditService.listByOrganization(user.organizationId, limit ? Number(limit) : 100);
  }
}

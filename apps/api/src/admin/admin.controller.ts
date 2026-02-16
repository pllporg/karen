import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { CreateStageDto } from './dto/create-stage.dto';

@Controller('admin')
@UseGuards(SessionAuthGuard, PermissionGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('organization')
  @RequirePermissions('organization:read')
  getOrganization(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.getOrganization(user.organizationId);
  }

  @Post('organization/settings')
  @RequirePermissions('organization:write')
  updateSettings(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateSettingsDto) {
    return this.adminService.updateSettings(user.organizationId, user.id, dto);
  }

  @Get('users')
  @RequirePermissions('users:read')
  users(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.listUsers(user.organizationId);
  }

  @Get('roles')
  @RequirePermissions('roles:read')
  roles(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.listRoles(user.organizationId);
  }

  @Post('roles')
  @RequirePermissions('roles:write')
  createRole(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRoleDto) {
    return this.adminService.createRole({
      organizationId: user.organizationId,
      actorUserId: user.id,
      name: dto.name,
      description: dto.description,
      permissionKeys: dto.permissionKeys,
    });
  }

  @Get('stages')
  @RequirePermissions('matter_stage:read')
  stages(@CurrentUser() user: AuthenticatedUser, @Query('practiceArea') practiceArea?: string) {
    return this.adminService.listStages(user.organizationId, practiceArea);
  }

  @Post('stages')
  @RequirePermissions('matter_stage:write')
  createStage(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStageDto) {
    return this.adminService.createStage({
      organizationId: user.organizationId,
      actorUserId: user.id,
      name: dto.name,
      practiceArea: dto.practiceArea,
      orderIndex: dto.orderIndex,
    });
  }
}

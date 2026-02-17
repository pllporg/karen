import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { CreateRoleDto } from './dto/create-role.dto';
import { CreateStageDto } from './dto/create-stage.dto';
import { CreateParticipantRoleDto } from './dto/create-participant-role.dto';
import { CreateConflictProfileDto } from './dto/create-conflict-profile.dto';
import { UpdateConflictProfileDto } from './dto/update-conflict-profile.dto';
import { RunConflictCheckDto } from './dto/run-conflict-check.dto';
import { ResolveConflictCheckDto } from './dto/resolve-conflict-check.dto';

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

  @Get('participant-roles')
  @RequirePermissions('roles:read')
  participantRoles(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.listParticipantRoles(user.organizationId);
  }

  @Post('participant-roles')
  @RequirePermissions('roles:write')
  createParticipantRole(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateParticipantRoleDto) {
    return this.adminService.createParticipantRole({
      organizationId: user.organizationId,
      actorUserId: user.id,
      key: dto.key,
      label: dto.label,
      description: dto.description,
      sideDefault: dto.sideDefault,
    });
  }

  @Get('conflict-rule-profiles')
  @RequirePermissions('organization:read')
  conflictRuleProfiles(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.listConflictRuleProfiles(user.organizationId);
  }

  @Post('conflict-rule-profiles')
  @RequirePermissions('organization:write')
  createConflictRuleProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateConflictProfileDto) {
    return this.adminService.upsertConflictRuleProfile({
      organizationId: user.organizationId,
      actorUserId: user.id,
      ...dto,
    });
  }

  @Patch('conflict-rule-profiles/:id')
  @RequirePermissions('organization:write')
  updateConflictRuleProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateConflictProfileDto,
  ) {
    return this.adminService.upsertConflictRuleProfile({
      organizationId: user.organizationId,
      actorUserId: user.id,
      id,
      ...dto,
    });
  }

  @Post('conflict-checks')
  @RequirePermissions('organization:read')
  runConflictCheck(@CurrentUser() user: AuthenticatedUser, @Body() dto: RunConflictCheckDto) {
    return this.adminService.runConflictCheck({
      organizationId: user.organizationId,
      actorUserId: user.id,
      queryText: dto.queryText,
      profileId: dto.profileId,
      practiceArea: dto.practiceArea,
      matterTypeId: dto.matterTypeId,
    });
  }

  @Get('conflict-checks')
  @RequirePermissions('organization:read')
  listConflictChecks(@CurrentUser() user: AuthenticatedUser, @Query('limit') limit?: string) {
    return this.adminService.listConflictChecks(user.organizationId, limit ? Number(limit) : undefined);
  }

  @Post('conflict-checks/:id/resolve')
  @RequirePermissions('organization:write')
  resolveConflictCheck(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ResolveConflictCheckDto,
  ) {
    return this.adminService.resolveConflictCheck({
      organizationId: user.organizationId,
      actorUserId: user.id,
      conflictCheckId: id,
      decision: dto.decision,
      rationale: dto.rationale,
    });
  }
}

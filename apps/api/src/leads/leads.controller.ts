import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateIntakeDraftDto } from './dto/create-intake-draft.dto';
import { RunConflictCheckDto } from './dto/run-conflict-check.dto';
import { ResolveConflictDto } from './dto/resolve-conflict.dto';
import { GenerateEngagementDto } from './dto/generate-engagement.dto';
import { SendEngagementDto } from './dto/send-engagement.dto';
import { ConvertLeadDto } from './dto/convert-lead.dto';

@Controller('leads')
@UseGuards(SessionAuthGuard, PermissionGuard)
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  @RequirePermissions('leads:read')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.leadsService.list(user.organizationId);
  }

  @Post()
  @RequirePermissions('leads:write')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateLeadDto) {
    return this.leadsService.create(user.organizationId, user.id, dto);
  }

  @Get(':id')
  @RequirePermissions('leads:read')
  getById(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.leadsService.getById(user.organizationId, id);
  }

  @Patch(':id')
  @RequirePermissions('leads:write')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return this.leadsService.update(user.organizationId, user.id, id, dto);
  }

  @Post(':id/intake-drafts')
  @RequirePermissions('leads:write')
  createIntakeDraft(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: CreateIntakeDraftDto) {
    return this.leadsService.createIntakeDraft(user.organizationId, user.id, id, dto);
  }

  @Post(':id/conflict-check')
  @RequirePermissions('leads:write')
  runConflictCheck(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: RunConflictCheckDto) {
    return this.leadsService.runConflictCheck(user.organizationId, user.id, id, dto);
  }

  @Post(':id/conflict-resolution')
  @RequirePermissions('leads:write')
  resolveConflict(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: ResolveConflictDto) {
    return this.leadsService.resolveConflict(user.organizationId, user.id, id, dto);
  }

  @Post(':id/engagement/generate')
  @RequirePermissions('leads:write')
  generateEngagement(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: GenerateEngagementDto) {
    return this.leadsService.generateEngagement(user.organizationId, user.id, id, dto);
  }

  @Post(':id/engagement/send')
  @RequirePermissions('leads:write')
  sendEngagement(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: SendEngagementDto) {
    return this.leadsService.sendEngagement(user.organizationId, user.id, id, dto);
  }

  @Post(':id/convert')
  @RequirePermissions('leads:write')
  convert(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: ConvertLeadDto) {
    return this.leadsService.convert(user.organizationId, user.id, id, dto);
  }

  @Get(':id/setup-checklist')
  @RequirePermissions('leads:read')
  setupChecklist(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.leadsService.setupChecklist(user.organizationId, user.id, id);
  }
}

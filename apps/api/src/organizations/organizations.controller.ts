import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { CreateSectionDefinitionDto } from './dto/create-section-definition.dto';

@Controller('config')
@UseGuards(SessionAuthGuard, PermissionGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get('custom-fields')
  @RequirePermissions('config:read')
  customFields(@CurrentUser() user: AuthenticatedUser, @Query('entityType') entityType?: string) {
    return this.organizationsService.listCustomFields(user, entityType);
  }

  @Post('custom-fields')
  @RequirePermissions('config:write')
  createCustomField(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCustomFieldDto) {
    return this.organizationsService.createCustomField(user, dto);
  }

  @Post('custom-field-values')
  @RequirePermissions('config:write')
  setCustomFieldValue(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { entityType: string; entityId: string; fieldDefinitionId: string; valueJson: Record<string, unknown> },
  ) {
    return this.organizationsService.setCustomFieldValue(user, body);
  }

  @Get('sections')
  @RequirePermissions('config:read')
  sections(@CurrentUser() user: AuthenticatedUser, @Query('matterTypeId') matterTypeId?: string) {
    return this.organizationsService.listSectionDefinitions(user, matterTypeId);
  }

  @Post('sections')
  @RequirePermissions('config:write')
  createSection(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSectionDefinitionDto) {
    return this.organizationsService.createSectionDefinition(user, dto);
  }

  @Post('section-instances')
  @RequirePermissions('config:write')
  upsertSection(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { matterId: string; sectionDefinitionId: string; dataJson: Record<string, unknown> },
  ) {
    return this.organizationsService.upsertSectionInstance(user, body);
  }

  @Get('section-instances')
  @RequirePermissions('config:read')
  sectionInstances(@CurrentUser() user: AuthenticatedUser, @Query('matterId') matterId: string) {
    return this.organizationsService.listSectionInstances(user, matterId);
  }
}

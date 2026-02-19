import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { MattersService } from './matters.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';
import { CreateMatterDto } from './dto/create-matter.dto';
import { AddParticipantDto } from './dto/add-participant.dto';
import { IntakeWizardDto } from './dto/intake-wizard.dto';
import { SaveIntakeDraftDto } from './dto/save-intake-draft.dto';
import { LogCommunicationEntryDto } from './dto/log-communication-entry.dto';

@Controller('matters')
@UseGuards(SessionAuthGuard, PermissionGuard)
export class MattersController {
  constructor(private readonly mattersService: MattersService) {}

  @Get()
  @RequirePermissions('matters:read')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.mattersService.list(user.organizationId);
  }

  @Post()
  @RequirePermissions('matters:write')
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMatterDto) {
    return this.mattersService.create({
      organizationId: user.organizationId,
      actorUserId: user.id,
      ...dto,
    });
  }

  @Get(':id/dashboard')
  @RequirePermissions('matters:read')
  dashboard(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.mattersService.dashboard(user, id);
  }

  @Post(':id/participants')
  @RequirePermissions('matters:write')
  addParticipant(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: AddParticipantDto) {
    return this.mattersService.addParticipant({
      user,
      matterId: id,
      ...dto,
    });
  }

  @Delete(':id/participants/:participantId')
  @RequirePermissions('matters:write')
  removeParticipant(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('participantId') participantId: string,
  ) {
    return this.mattersService.removeParticipant({
      user,
      matterId: id,
      participantId,
    });
  }

  @Get(':id/participant-roles')
  @RequirePermissions('matters:read')
  participantRoleOptions(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.mattersService.listParticipantRoleOptions(user, id);
  }

  @Post(':id/communications/log')
  @RequirePermissions('matters:write')
  logCommunicationEntry(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: LogCommunicationEntryDto,
  ) {
    return this.mattersService.logCommunicationEntry({
      user,
      matterId: id,
      ...dto,
    });
  }

  @Post('intake-wizard')
  @RequirePermissions('matters:write')
  intakeWizard(@CurrentUser() user: AuthenticatedUser, @Body() dto: IntakeWizardDto) {
    return this.mattersService.intakeWizard({
      user,
      ...dto,
    });
  }

  @Get('intake-wizard/drafts')
  @RequirePermissions('matters:read')
  listIntakeDrafts(@CurrentUser() user: AuthenticatedUser) {
    return this.mattersService.listIntakeDrafts(user);
  }

  @Get('intake-wizard/drafts/:draftId')
  @RequirePermissions('matters:read')
  getIntakeDraft(@CurrentUser() user: AuthenticatedUser, @Param('draftId') draftId: string) {
    return this.mattersService.getIntakeDraft({ user, draftId });
  }

  @Post('intake-wizard/drafts')
  @RequirePermissions('matters:write')
  saveIntakeDraft(@CurrentUser() user: AuthenticatedUser, @Body() dto: SaveIntakeDraftDto) {
    return this.mattersService.saveIntakeDraft({
      user,
      draftId: dto.draftId,
      payload: dto.payload,
    });
  }

  @Patch(':id/ethical-wall')
  @RequirePermissions('matters:write')
  setEthicalWall(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() body: { enabled: boolean }) {
    return this.mattersService.setEthicalWall({ user, matterId: id, enabled: body.enabled });
  }

  @Post(':id/deny-users')
  @RequirePermissions('matters:write')
  denyUser(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { deniedUserId: string; reason?: string },
  ) {
    return this.mattersService.addDeniedUser({
      user,
      matterId: id,
      deniedUserId: body.deniedUserId,
      reason: body.reason,
    });
  }
}

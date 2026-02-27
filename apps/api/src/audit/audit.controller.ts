import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { MatterAuditSignalReviewState } from '@prisma/client';
import { AuditService } from './audit.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';
import { MatterAuditSignalService } from './matter-audit-signal.service';
import { UpdateSignalReviewStateDto } from './dto/update-signal-review-state.dto';

@Controller('audit')
@UseGuards(SessionAuthGuard, PermissionGuard)
export class AuditController {
  constructor(
    private readonly auditService: AuditService,
    private readonly matterAuditSignalService: MatterAuditSignalService,
  ) {}

  @Get()
  @RequirePermissions('audit:read')
  async list(@CurrentUser() user: AuthenticatedUser, @Query('limit') limit?: string) {
    return this.auditService.listByOrganization(user.organizationId, limit ? Number(limit) : 100);
  }

  @Get('matter-signals')
  @RequirePermissions('audit:read')
  async listMatterSignals(
    @CurrentUser() user: AuthenticatedUser,
    @Query('reviewState') reviewState?: MatterAuditSignalReviewState,
    @Query('matterId') matterId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.matterAuditSignalService.listSignals({
      organizationId: user.organizationId,
      reviewState,
      matterId,
      limit: limit ? Number(limit) : 100,
    });
  }

  @Post('matter-signals/generate')
  @RequirePermissions('audit:read')
  async generateMatterSignals(
    @CurrentUser() user: AuthenticatedUser,
    @Query('matterId') matterId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.matterAuditSignalService.generateMissedValueSignals({
      organizationId: user.organizationId,
      actorUserId: user.id,
      matterId,
      limit: limit ? Number(limit) : 100,
    });
  }

  @Patch('matter-signals/:signalId/review-state')
  @RequirePermissions('audit:read')
  async updateMatterSignalReviewState(
    @CurrentUser() user: AuthenticatedUser,
    @Param('signalId') signalId: string,
    @Body() body: UpdateSignalReviewStateDto,
  ) {
    return this.matterAuditSignalService.updateReviewState({
      organizationId: user.organizationId,
      actorUserId: user.id,
      signalId,
      reviewState: body.reviewState,
      reviewNotes: body.reviewNotes,
    });
  }
}

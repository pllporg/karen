import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AiArtifactReviewStatus } from '@prisma/client';
import { AiService } from './ai.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';
import { CreateAiJobDto } from './dto/create-ai-job.dto';
import { RateLimitGuard } from '../common/guards/rate-limit.guard';
import { RateLimit } from '../common/decorators/rate-limit.decorator';
import { CreateStylePackDto } from './dto/create-style-pack.dto';
import { UpdateStylePackDto } from './dto/update-style-pack.dto';
import { AttachStylePackSourceDocDto } from './dto/attach-style-pack-source-doc.dto';

@Controller('ai')
@UseGuards(SessionAuthGuard, PermissionGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('jobs')
  @RequirePermissions('ai:read')
  jobs(@CurrentUser() user: AuthenticatedUser, @Query('matterId') matterId?: string) {
    return this.aiService.listJobs(user, matterId);
  }

  @Get('style-packs')
  @RequirePermissions('ai:read')
  listStylePacks(@CurrentUser() user: AuthenticatedUser) {
    return this.aiService.listStylePacks(user);
  }

  @Post('style-packs')
  @RequirePermissions('organization:write')
  createStylePack(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateStylePackDto) {
    return this.aiService.createStylePack({
      user,
      name: dto.name,
      description: dto.description,
    });
  }

  @Patch('style-packs/:id')
  @RequirePermissions('organization:write')
  updateStylePack(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateStylePackDto) {
    return this.aiService.updateStylePack({
      user,
      stylePackId: id,
      name: dto.name,
      description: dto.description,
    });
  }

  @Post('style-packs/:id/source-docs')
  @RequirePermissions('organization:write')
  addStylePackSourceDoc(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AttachStylePackSourceDocDto,
  ) {
    return this.aiService.addStylePackSourceDoc({
      user,
      stylePackId: id,
      documentVersionId: dto.documentVersionId,
    });
  }

  @Delete('style-packs/:id/source-docs/:documentVersionId')
  @RequirePermissions('organization:write')
  removeStylePackSourceDoc(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('documentVersionId') documentVersionId: string,
  ) {
    return this.aiService.removeStylePackSourceDoc({
      user,
      stylePackId: id,
      documentVersionId,
    });
  }

  @Post('jobs')
  @RequirePermissions('ai:write')
  @UseGuards(RateLimitGuard)
  @RateLimit(30, 60_000)
  createJob(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAiJobDto) {
    return this.aiService.createJob({
      user,
      matterId: dto.matterId,
      toolName: dto.toolName,
      payload: dto.input,
      stylePackId: dto.stylePackId,
    });
  }

  @Post('ingest')
  @RequirePermissions('ai:write')
  @UseGuards(RateLimitGuard)
  @RateLimit(20, 60_000)
  ingest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { matterId: string; documentVersionId: string; text: string; metadata?: Record<string, unknown> },
  ) {
    return this.aiService.ingestDocument({
      user,
      matterId: body.matterId,
      documentVersionId: body.documentVersionId,
      text: body.text,
      metadata: body.metadata,
    });
  }

  @Post('artifacts/:id/review')
  @RequirePermissions('ai:write')
  review(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { status: AiArtifactReviewStatus; editedContent?: string },
  ) {
    return this.aiService.reviewArtifact({
      user,
      artifactId: id,
      status: body.status,
      editedContent: body.editedContent,
    });
  }

  @Post('artifacts/:id/confirm-deadlines')
  @RequirePermissions('ai:write')
  confirmDeadlines(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { selections: Array<{ date: string; description: string; createTask?: boolean; createEvent?: boolean }> },
  ) {
    return this.aiService.confirmDeadlines({
      user,
      artifactId: id,
      selections: body.selections,
    });
  }
}

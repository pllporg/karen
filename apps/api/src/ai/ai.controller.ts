import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
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

@Controller('ai')
@UseGuards(SessionAuthGuard, PermissionGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('jobs')
  @RequirePermissions('ai:read')
  jobs(@CurrentUser() user: AuthenticatedUser, @Query('matterId') matterId?: string) {
    return this.aiService.listJobs(user, matterId);
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

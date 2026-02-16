import { Body, Controller, Get, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImportsService } from './imports.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser, UploadedFile as UploadedBinary } from '../common/types';
import { CreateMappingProfileDto } from './dto/create-mapping-profile.dto';

@Controller('imports')
@UseGuards(SessionAuthGuard, PermissionGuard)
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Get('batches')
  @RequirePermissions('imports:read')
  batches(@CurrentUser() user: AuthenticatedUser) {
    return this.importsService.listBatches(user.organizationId);
  }

  @Get('mapping-profiles')
  @RequirePermissions('imports:read')
  mappingProfiles(@CurrentUser() user: AuthenticatedUser, @Query('sourceSystem') sourceSystem?: string) {
    return this.importsService.listMappingProfiles(user.organizationId, sourceSystem);
  }

  @Post('mapping-profiles')
  @RequirePermissions('imports:write')
  createMappingProfile(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMappingProfileDto) {
    return this.importsService.createMappingProfile({
      organizationId: user.organizationId,
      actorUserId: user.id,
      ...dto,
    });
  }

  @Post('run')
  @RequirePermissions('imports:write')
  @UseInterceptors(FileInterceptor('file'))
  run(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedBinary,
    @Body() body: { sourceSystem: string; mappingProfileId?: string; entityType?: string },
  ) {
    return this.importsService.runImport({
      user,
      sourceSystem: body.sourceSystem,
      file,
      mappingProfileId: body.mappingProfileId,
      entityTypeOverride: body.entityType,
    });
  }
}

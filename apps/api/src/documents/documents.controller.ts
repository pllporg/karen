import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Redirect,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DocumentsService } from './documents.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser, UploadedFile as UploadedBinary } from '../common/types';
import { UploadDocumentDto } from './dto/upload-document.dto';

@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Get('share/:token')
  @Redirect()
  async resolveShare(@Param('token') token: string) {
    const result = await this.documentsService.resolveShareLink(token);
    return { url: result.url };
  }

  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Get()
  @RequirePermissions('documents:read')
  list(@CurrentUser() user: AuthenticatedUser, @Query('matterId') matterId?: string) {
    return this.documentsService.list(user, matterId);
  }

  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Post('upload')
  @RequirePermissions('documents:write')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedBinary,
    @Body() dto: UploadDocumentDto,
  ) {
    return this.documentsService.uploadNew({
      user,
      matterId: dto.matterId,
      title: dto.title,
      category: dto.category,
      tags: dto.tags ? dto.tags.split(',').map((tag) => tag.trim()) : [],
      sharedWithClient: dto.sharedWithClient,
      file,
    });
  }

  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Post(':id/versions')
  @RequirePermissions('documents:write')
  @UseInterceptors(FileInterceptor('file'))
  uploadVersion(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @UploadedFile() file: UploadedBinary) {
    return this.documentsService.uploadVersion({
      user,
      documentId: id,
      file,
    });
  }

  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Get('versions/:versionId/download-url')
  @RequirePermissions('documents:read')
  signedDownload(@CurrentUser() user: AuthenticatedUser, @Param('versionId') versionId: string) {
    return this.documentsService.signedDownloadUrl(user, versionId);
  }

  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Post(':id/share-link')
  @RequirePermissions('documents:write')
  share(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() body: { expiresInHours?: number },
  ) {
    return this.documentsService.createShareLink({
      user,
      documentId: id,
      expiresInHours: body.expiresInHours,
    });
  }

  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Post('template-merge')
  @RequirePermissions('documents:write')
  templateMerge(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { templateVersionId: string; mergeData: Record<string, unknown>; matterId: string; title: string },
  ) {
    return this.documentsService.mergeDocxTemplate({
      user,
      templateVersionId: body.templateVersionId,
      mergeData: body.mergeData,
      matterId: body.matterId,
      title: body.title,
    });
  }

  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Post('generate-pdf')
  @RequirePermissions('documents:write')
  generatePdf(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { matterId: string; title: string; lines: string[] },
  ) {
    return this.documentsService.generateSimplePdf({
      user,
      matterId: body.matterId,
      title: body.title,
      lines: body.lines,
    });
  }
}

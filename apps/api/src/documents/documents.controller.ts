import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { UpdateDocumentDto } from './dto/update-document.dto';
import { CreateRetentionPolicyDto } from './dto/create-retention-policy.dto';
import { AssignRetentionPolicyDto } from './dto/assign-retention-policy.dto';
import { PlaceLegalHoldDto, ReleaseLegalHoldDto } from './dto/legal-hold.dto';
import { CreateDispositionRunDto, DispositionRunActionDto } from './dto/disposition-run.dto';

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
  @Patch(':id')
  @RequirePermissions('documents:write')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
  ) {
    return this.documentsService.updateDocument({
      user,
      documentId: id,
      title: dto.title,
      category: dto.category,
      tags: dto.tags,
      sharedWithClient: dto.sharedWithClient,
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
    @Body()
    body: {
      templateVersionId: string;
      mergeData?: Record<string, unknown>;
      strictValidation?: boolean;
      matterId: string;
      title: string;
    },
  ) {
    return this.documentsService.mergeDocxTemplate({
      user,
      templateVersionId: body.templateVersionId,
      mergeData: body.mergeData,
      strictValidation: body.strictValidation,
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

  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Get('retention/policies')
  @RequirePermissions('documents:read')
  listRetentionPolicies(@CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.listRetentionPolicies(user);
  }

  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Post('retention/policies')
  @RequirePermissions('documents:write')
  createRetentionPolicy(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRetentionPolicyDto) {
    return this.documentsService.createRetentionPolicy({
      user,
      ...dto,
    });
  }

  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Post(':id/retention-policy')
  @RequirePermissions('documents:write')
  assignRetentionPolicy(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') documentId: string,
    @Body() dto: AssignRetentionPolicyDto,
  ) {
    return this.documentsService.assignRetentionPolicy({
      user,
      documentId,
      policyId: dto.policyId,
    });
  }

  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Post(':id/legal-hold')
  @RequirePermissions('documents:write')
  placeLegalHold(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') documentId: string,
    @Body() dto: PlaceLegalHoldDto,
  ) {
    return this.documentsService.placeLegalHold({
      user,
      documentId,
      reason: dto.reason,
    });
  }

  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Post(':id/legal-hold/release')
  @RequirePermissions('documents:write')
  releaseLegalHold(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') documentId: string,
    @Body() dto: ReleaseLegalHoldDto,
  ) {
    return this.documentsService.releaseLegalHold({
      user,
      documentId,
      reason: dto.reason,
    });
  }

  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Get('disposition/runs')
  @RequirePermissions('documents:read')
  listDispositionRuns(@CurrentUser() user: AuthenticatedUser) {
    return this.documentsService.listDispositionRuns(user);
  }

  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Post('disposition/runs')
  @RequirePermissions('documents:write')
  createDispositionRun(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDispositionRunDto) {
    return this.documentsService.createDispositionRun({
      user,
      policyId: dto.policyId,
      cutoffAt: dto.cutoffAt,
      notes: dto.notes,
    });
  }

  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Post('disposition/runs/:id/approve')
  @RequirePermissions('documents:write')
  approveDispositionRun(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') runId: string,
    @Body() dto: DispositionRunActionDto,
  ) {
    return this.documentsService.approveDispositionRun({
      user,
      runId,
      notes: dto.notes,
    });
  }

  @UseGuards(SessionAuthGuard, PermissionGuard)
  @Post('disposition/runs/:id/execute')
  @RequirePermissions('documents:write')
  executeDispositionRun(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') runId: string,
    @Body() dto: DispositionRunActionDto,
  ) {
    return this.documentsService.executeDispositionRun({
      user,
      runId,
      notes: dto.notes,
    });
  }
}

import { Body, Controller, Get, Param, Post, Query, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PortalService } from './portal.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser, UploadedFile as UploadedBinary } from '../common/types';

@Controller('portal')
@UseGuards(SessionAuthGuard)
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get('snapshot')
  snapshot(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.getPortalSnapshot(user);
  }

  @Post('messages')
  message(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { matterId: string; subject?: string; body: string; attachmentVersionIds?: string[] },
  ) {
    return this.portalService.sendPortalMessage({
      user,
      matterId: body.matterId,
      subject: body.subject,
      body: body.body,
      attachmentVersionIds: body.attachmentVersionIds,
    });
  }

  @Post('attachments/upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadAttachment(
    @CurrentUser() user: AuthenticatedUser,
    @UploadedFile() file: UploadedBinary,
    @Body() body: { matterId: string; title?: string; category?: string; tags?: string },
  ) {
    return this.portalService.uploadPortalAttachment({
      user,
      matterId: body.matterId,
      title: body.title,
      category: body.category,
      tags: body.tags ? body.tags.split(',').map((tag) => tag.trim()) : [],
      file,
    });
  }

  @Get('attachments/:versionId/download-url')
  attachmentDownload(@CurrentUser() user: AuthenticatedUser, @Param('versionId') versionId: string) {
    return this.portalService.getPortalAttachmentDownloadUrl({
      user,
      documentVersionId: versionId,
    });
  }

  @Post('intake-submissions')
  intake(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { intakeFormDefinitionId: string; matterId?: string; data: Record<string, unknown> },
  ) {
    return this.portalService.submitIntake({
      user,
      intakeFormDefinitionId: body.intakeFormDefinitionId,
      matterId: body.matterId,
      data: body.data,
    });
  }

  @Post('esign')
  esign(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { engagementLetterTemplateId: string; matterId?: string; provider?: string },
  ) {
    return this.portalService.createEsignEnvelope({
      user,
      engagementLetterTemplateId: body.engagementLetterTemplateId,
      matterId: body.matterId,
      provider: body.provider,
    });
  }

  @Get('esign/envelopes')
  esignEnvelopes(@CurrentUser() user: AuthenticatedUser, @Query('matterId') matterId?: string) {
    return this.portalService.listPortalEsignEnvelopes({
      user,
      matterId,
    });
  }

  @Post('esign/:envelopeId/refresh')
  refreshEsignEnvelope(@CurrentUser() user: AuthenticatedUser, @Param('envelopeId') envelopeId: string) {
    return this.portalService.refreshPortalEsignEnvelope({
      user,
      envelopeId,
    });
  }
}

import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { PortalService } from './portal.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';

@Controller('portal')
@UseGuards(SessionAuthGuard)
export class PortalController {
  constructor(private readonly portalService: PortalService) {}

  @Get('snapshot')
  snapshot(@CurrentUser() user: AuthenticatedUser) {
    return this.portalService.getPortalSnapshot(user);
  }

  @Post('messages')
  message(@CurrentUser() user: AuthenticatedUser, @Body() body: { matterId: string; subject?: string; body: string }) {
    return this.portalService.sendPortalMessage({
      user,
      matterId: body.matterId,
      subject: body.subject,
      body: body.body,
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
  esign(@CurrentUser() user: AuthenticatedUser, @Body() body: { engagementLetterTemplateId: string; matterId?: string }) {
    return this.portalService.createEsignStub({
      user,
      engagementLetterTemplateId: body.engagementLetterTemplateId,
      matterId: body.matterId,
    });
  }
}

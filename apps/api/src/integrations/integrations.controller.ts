import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { IntegrationProvider } from '@prisma/client';
import { IntegrationsService } from './integrations.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';

@Controller('integrations')
@UseGuards(SessionAuthGuard, PermissionGuard)
export class IntegrationsController {
  constructor(private readonly integrationsService: IntegrationsService) {}

  @Get('connections')
  @RequirePermissions('integrations:read')
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.integrationsService.list(user);
  }

  @Post('connections')
  @RequirePermissions('integrations:write')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      provider: IntegrationProvider;
      name: string;
      accessToken?: string;
      refreshToken?: string;
      encryptedAccessToken?: string;
      encryptedRefreshToken?: string;
      scopes?: string[];
      config?: Record<string, unknown>;
    },
  ) {
    return this.integrationsService.create({ user, ...body });
  }

  @Post('sync')
  @RequirePermissions('integrations:write')
  sync(@CurrentUser() user: AuthenticatedUser, @Body() body: { connectionId: string; idempotencyKey: string }) {
    return this.integrationsService.triggerSync({
      user,
      connectionId: body.connectionId,
      idempotencyKey: body.idempotencyKey,
    });
  }

  @Post('webhook-subscriptions')
  @RequirePermissions('integrations:write')
  subscribe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { connectionId: string; event: string; targetUrl: string },
  ) {
    return this.integrationsService.subscribeWebhook({
      user,
      connectionId: body.connectionId,
      event: body.event,
      targetUrl: body.targetUrl,
    });
  }
}

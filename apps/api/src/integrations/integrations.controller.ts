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

  @Post('oauth/start')
  @RequirePermissions('integrations:write')
  oauthStart(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      provider: IntegrationProvider;
      name: string;
      redirectUri: string;
      scopes?: string[];
      config?: Record<string, unknown>;
    },
  ) {
    return this.integrationsService.startOAuth({
      user,
      provider: body.provider,
      name: body.name,
      redirectUri: body.redirectUri,
      scopes: body.scopes,
      config: body.config,
    });
  }

  @Post('oauth/callback')
  @RequirePermissions('integrations:write')
  oauthCallback(
    @CurrentUser() user: AuthenticatedUser,
    @Body()
    body: {
      connectionId: string;
      code: string;
      state: string;
      redirectUri?: string;
    },
  ) {
    return this.integrationsService.completeOAuth({
      user,
      connectionId: body.connectionId,
      code: body.code,
      state: body.state,
      redirectUri: body.redirectUri,
    });
  }

  @Post('sync')
  @RequirePermissions('integrations:write')
  sync(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { connectionId: string; idempotencyKey: string; cursor?: string | null },
  ) {
    return this.integrationsService.triggerSync({
      user,
      connectionId: body.connectionId,
      idempotencyKey: body.idempotencyKey,
      cursor: body.cursor,
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

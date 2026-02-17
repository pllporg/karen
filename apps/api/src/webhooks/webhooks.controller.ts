import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { SessionAuthGuard } from '../common/guards/session-auth.guard';
import { PermissionGuard } from '../common/guards/permission.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../common/types';

@Controller('webhooks')
@UseGuards(SessionAuthGuard, PermissionGuard)
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get('endpoints')
  @RequirePermissions('webhooks:read')
  listEndpoints(@CurrentUser() user: AuthenticatedUser) {
    return this.webhooksService.listEndpoints(user.organizationId);
  }

  @Post('endpoints')
  @RequirePermissions('webhooks:write')
  registerEndpoint(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: { url: string; secret: string; events: string[] },
  ) {
    return this.webhooksService.registerEndpoint({
      organizationId: user.organizationId,
      url: body.url,
      secret: body.secret,
      events: body.events,
    });
  }

  @Get('deliveries')
  @RequirePermissions('webhooks:read')
  listDeliveries(
    @CurrentUser() user: AuthenticatedUser,
    @Query('endpointId') endpointId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: string,
  ) {
    return this.webhooksService.listDeliveries(user.organizationId, {
      endpointId,
      status,
      limit: limit ? Number(limit) : undefined,
    });
  }

  @Post('deliveries/:deliveryId/retry')
  @RequirePermissions('webhooks:write')
  retryDelivery(@CurrentUser() user: AuthenticatedUser, @Param('deliveryId') deliveryId: string) {
    return this.webhooksService.retryDelivery(user.organizationId, deliveryId);
  }
}

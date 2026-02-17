import { Body, Controller, Headers, Param, Post } from '@nestjs/common';
import { PortalService } from './portal.service';

@Controller('portal/esign/webhooks')
export class PortalEsignWebhookController {
  constructor(private readonly portalService: PortalService) {}

  @Post(':provider')
  webhook(
    @Param('provider') provider: string,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() payload: unknown,
  ) {
    return this.portalService.handleEsignWebhook({
      providerKey: provider,
      headers,
      payload,
    });
  }
}

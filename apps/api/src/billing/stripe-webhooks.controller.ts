import { Body, Controller, Headers, Post, Req, RawBodyRequest } from '@nestjs/common';
import { Request } from 'express';
import { BillingService } from './billing.service';

@Controller('billing/stripe')
export class StripeWebhooksController {
  constructor(private readonly billingService: BillingService) {}

  @Post('webhook')
  handleWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers('stripe-signature') signature?: string,
    @Body() payload?: Record<string, unknown>,
  ) {
    return this.billingService.handleStripeWebhook({
      signature,
      rawBody: req.rawBody,
      payload,
    });
  }
}


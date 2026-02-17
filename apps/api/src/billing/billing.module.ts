import { Module } from '@nestjs/common';
import { BillingController } from './billing.controller';
import { BillingService } from './billing.service';
import { AuditModule } from '../audit/audit.module';
import { StripeWebhooksController } from './stripe-webhooks.controller';

@Module({
  imports: [AuditModule],
  controllers: [BillingController, StripeWebhooksController],
  providers: [BillingService],
})
export class BillingModule {}

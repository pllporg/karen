import { Module } from '@nestjs/common';
import { PortalController } from './portal.controller';
import { PortalEsignWebhookController } from './portal-esign-webhook.controller';
import { PortalService } from './portal.service';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [AuditModule],
  controllers: [PortalController, PortalEsignWebhookController],
  providers: [PortalService],
})
export class PortalModule {}

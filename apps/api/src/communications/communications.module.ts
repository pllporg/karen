import { Module } from '@nestjs/common';
import { CommunicationsController } from './communications.controller';
import { CommunicationsService } from './communications.service';
import { AuditModule } from '../audit/audit.module';
import { StubMessageProvider } from './providers/stub-message.provider';
import { ResendEmailProvider } from './providers/resend-email.provider';
import { TwilioSmsProvider } from './providers/twilio-sms.provider';
import { MessageDispatchService } from './providers/message-dispatch.service';
import { AuditScanSchedulerService } from './audit-scan-scheduler.service';

@Module({
  imports: [AuditModule],
  controllers: [CommunicationsController],
  providers: [
    CommunicationsService,
    StubMessageProvider,
    ResendEmailProvider,
    TwilioSmsProvider,
    MessageDispatchService,
    AuditScanSchedulerService,
  ],
  exports: [MessageDispatchService],
})
export class CommunicationsModule {}

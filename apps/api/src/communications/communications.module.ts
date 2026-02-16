import { Module } from '@nestjs/common';
import { CommunicationsController } from './communications.controller';
import { CommunicationsService } from './communications.service';
import { AuditModule } from '../audit/audit.module';
import { StubMessageProvider } from './providers/stub-message.provider';

@Module({
  imports: [AuditModule],
  controllers: [CommunicationsController],
  providers: [CommunicationsService, StubMessageProvider],
  exports: [StubMessageProvider],
})
export class CommunicationsModule {}

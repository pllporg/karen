import { Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditService } from './audit.service';
import { LeadsModule } from '../leads/leads.module';
import { MatterAuditSignalService } from './matter-audit-signal.service';

@Module({
  imports: [LeadsModule],
  providers: [AuditService, MatterAuditSignalService],
  controllers: [AuditController],
  exports: [AuditService, MatterAuditSignalService],
})
export class AuditModule {}

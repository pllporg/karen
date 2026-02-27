import { Module } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditService } from '../audit/audit.service';

@Module({
  imports: [PrismaModule],
  controllers: [LeadsController],
  providers: [LeadsService, AuditService],
})
export class LeadsModule {}

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrismaModule } from './prisma/prisma.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './auth/auth.module';
import { AuditModule } from './audit/audit.module';
import { AccessModule } from './access/access.module';
import { FilesModule } from './files/files.module';
import { QueueModule } from './queue/queue.module';
import { AdminModule } from './admin/admin.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { ContactsModule } from './contacts/contacts.module';
import { MattersModule } from './matters/matters.module';
import { TasksModule } from './tasks/tasks.module';
import { CalendarModule } from './calendar/calendar.module';
import { DocumentsModule } from './documents/documents.module';
import { CommunicationsModule } from './communications/communications.module';
import { BillingModule } from './billing/billing.module';
import { ImportsModule } from './imports/imports.module';
import { ExportsModule } from './exports/exports.module';
import { AiModule } from './ai/ai.module';
import { IntegrationsModule } from './integrations/integrations.module';
import { WebhooksModule } from './webhooks/webhooks.module';
import { ReportingModule } from './reporting/reporting.module';
import { PortalModule } from './portal/portal.module';
import { LookupsModule } from './lookups/lookups.module';
import { OpsModule } from './ops/ops.module';
import { AuditInterceptor } from './common/interceptors/audit.interceptor';
import { GuardsModule } from './common/guards/guards.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    GuardsModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    AuditModule,
    AccessModule,
    FilesModule,
    QueueModule,
    AdminModule,
    OrganizationsModule,
    ContactsModule,
    MattersModule,
    TasksModule,
    CalendarModule,
    DocumentsModule,
    CommunicationsModule,
    BillingModule,
    ImportsModule,
    ExportsModule,
    AiModule,
    IntegrationsModule,
    WebhooksModule,
    ReportingModule,
    PortalModule,
    LookupsModule,
    OpsModule,
  ],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
export class AppModule {}

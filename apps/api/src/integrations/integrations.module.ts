import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { AuditModule } from '../audit/audit.module';
import { ClioConnector } from './connectors/clio.connector';
import { MyCaseConnector } from './connectors/mycase.connector';
import { FilevineConnector } from './connectors/filevine.connector';
import { PracticePantherConnector } from './connectors/practicepanther.connector';
import { GenericRestConnector } from './connectors/generic-rest.connector';
import { GmailConnector } from './connectors/gmail.connector';
import { OutlookConnector } from './connectors/outlook.connector';
import { IntegrationTokenCryptoService } from './integration-token-crypto.service';

@Module({
  imports: [AuditModule],
  controllers: [IntegrationsController],
  providers: [
    IntegrationsService,
    ClioConnector,
    MyCaseConnector,
    FilevineConnector,
    PracticePantherConnector,
    GenericRestConnector,
    GmailConnector,
    OutlookConnector,
    IntegrationTokenCryptoService,
  ],
})
export class IntegrationsModule {}

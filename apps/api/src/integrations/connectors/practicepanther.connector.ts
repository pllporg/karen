import { Injectable } from '@nestjs/common';
import { ConnectorSyncParams, ConnectorSyncResult, ConnectorWebhookParams, IncrementalSyncConnector } from './connector.interface';

@Injectable()
export class PracticePantherConnector implements IncrementalSyncConnector {
  provider: 'PRACTICEPANTHER' = 'PRACTICEPANTHER';
  supportsOAuth = false;

  async sync(params: ConnectorSyncParams): Promise<ConnectorSyncResult> {
    return {
      nextCursor: params.cursor ?? new Date().toISOString(),
      importedCount: 0,
      warnings: ['PracticePanther connector adapter is scaffolded; provider-specific pull mapping not yet enabled.'],
    };
  }

  async subscribeWebhooks(params: ConnectorWebhookParams): Promise<{ subscriptionId: string }> {
    return { subscriptionId: `practicepanther-${params.connectionId}-${Date.now()}` };
  }
}

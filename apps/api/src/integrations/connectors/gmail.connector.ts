import { Injectable } from '@nestjs/common';
import { ConnectorSyncParams, ConnectorSyncResult, ConnectorWebhookParams, IncrementalSyncConnector } from './connector.interface';

@Injectable()
export class GmailConnector implements IncrementalSyncConnector {
  provider = 'GMAIL' as const;
  supportsOAuth = false;

  async sync(params: ConnectorSyncParams): Promise<ConnectorSyncResult> {
    return {
      nextCursor: params.cursor ?? new Date().toISOString(),
      importedCount: 0,
      warnings: ['Gmail sync remains phase-2 scaffold.'],
    };
  }

  async subscribeWebhooks(params: ConnectorWebhookParams): Promise<{ subscriptionId: string }> {
    return { subscriptionId: `gmail-${params.connectionId}-${Date.now()}` };
  }
}

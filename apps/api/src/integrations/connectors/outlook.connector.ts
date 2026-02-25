import { Injectable } from '@nestjs/common';
import { ConnectorSyncParams, ConnectorSyncResult, ConnectorWebhookParams, IncrementalSyncConnector } from './connector.interface';

@Injectable()
export class OutlookConnector implements IncrementalSyncConnector {
  provider = 'OUTLOOK' as const;
  supportsOAuth = false;

  async sync(params: ConnectorSyncParams): Promise<ConnectorSyncResult> {
    return {
      nextCursor: params.cursor ?? new Date().toISOString(),
      importedCount: 0,
      warnings: ['Outlook sync remains phase-2 scaffold.'],
    };
  }

  async subscribeWebhooks(params: ConnectorWebhookParams): Promise<{ subscriptionId: string }> {
    return { subscriptionId: `outlook-${params.connectionId}-${Date.now()}` };
  }
}

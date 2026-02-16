import { Injectable } from '@nestjs/common';
import { ConnectorSyncParams, ConnectorSyncResult, ConnectorWebhookParams, IncrementalSyncConnector } from './connector.interface';

@Injectable()
export class GenericRestConnector implements IncrementalSyncConnector {
  provider: 'GENERIC_REST' = 'GENERIC_REST';
  supportsOAuth = false;

  async sync(params: ConnectorSyncParams): Promise<ConnectorSyncResult> {
    return {
      nextCursor: params.cursor ?? new Date().toISOString(),
      importedCount: 0,
      warnings: ['Generic REST connector adapter is scaffolded; configure provider mapping profile before use.'],
    };
  }

  async subscribeWebhooks(params: ConnectorWebhookParams): Promise<{ subscriptionId: string }> {
    return { subscriptionId: `generic-rest-${params.connectionId}-${Date.now()}` };
  }
}

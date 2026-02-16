import { Injectable } from '@nestjs/common';
import { IncrementalSyncConnector } from './connector.interface';

@Injectable()
export class GenericRestConnector implements IncrementalSyncConnector {
  provider: 'GENERIC_REST' = 'GENERIC_REST';

  async sync(): Promise<{ nextCursor?: string | null; importedCount: number }> {
    return { nextCursor: null, importedCount: 0 };
  }

  async subscribeWebhooks(): Promise<{ subscriptionId: string }> {
    return { subscriptionId: 'generic-rest-stub-subscription' };
  }
}

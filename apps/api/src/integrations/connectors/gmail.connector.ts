import { Injectable } from '@nestjs/common';
import { IncrementalSyncConnector } from './connector.interface';

@Injectable()
export class GmailConnector implements IncrementalSyncConnector {
  provider: 'GMAIL' = 'GMAIL';

  async sync(): Promise<{ nextCursor?: string | null; importedCount: number }> {
    return { nextCursor: null, importedCount: 0 };
  }

  async subscribeWebhooks(): Promise<{ subscriptionId: string }> {
    return { subscriptionId: 'gmail-sync-stub' };
  }
}

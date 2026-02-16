export interface IncrementalSyncConnector {
  provider: 'CLIO' | 'MYCASE' | 'FILEVINE' | 'PRACTICEPANTHER' | 'GMAIL' | 'OUTLOOK' | 'GENERIC_REST';
  sync(params: { connectionId: string; cursor?: string | null }): Promise<{ nextCursor?: string | null; importedCount: number }>;
  subscribeWebhooks(params: { connectionId: string; targetUrl: string }): Promise<{ subscriptionId: string }>;
}

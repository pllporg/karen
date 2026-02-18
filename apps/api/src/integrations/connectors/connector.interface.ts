import { IntegrationProvider } from '@prisma/client';

export const INTEGRATION_CONNECTORS = 'INTEGRATION_CONNECTORS';

export type ConnectorAuthorizationParams = {
  redirectUri: string;
  state: string;
  scopes?: string[];
};

export type ConnectorTokenExchangeParams = {
  code: string;
  redirectUri: string;
};

export type ConnectorRefreshParams = {
  refreshToken: string;
};

export type ConnectorTokenExchangeResult = {
  accessToken: string;
  refreshToken?: string | null;
  expiresAt?: Date | null;
  scopes?: string[];
  metadata?: Record<string, unknown>;
};

export type ConnectorSyncParams = {
  connectionId: string;
  cursor?: string | null;
  accessToken?: string | null;
  refreshToken?: string | null;
  config?: Record<string, unknown>;
};

export type ConnectorSyncResult = {
  nextCursor?: string | null;
  importedCount: number;
  warnings?: string[];
};

export type ConnectorWebhookParams = {
  connectionId: string;
  targetUrl: string;
  event: string;
  accessToken?: string | null;
  config?: Record<string, unknown>;
};

export interface IncrementalSyncConnector {
  provider: IntegrationProvider;
  supportsOAuth: boolean;
  getAuthorizationUrl?(params: ConnectorAuthorizationParams): string;
  exchangeAuthorizationCode?(params: ConnectorTokenExchangeParams): Promise<ConnectorTokenExchangeResult>;
  refreshAccessToken?(params: ConnectorRefreshParams): Promise<ConnectorTokenExchangeResult>;
  sync(params: ConnectorSyncParams): Promise<ConnectorSyncResult>;
  subscribeWebhooks(params: ConnectorWebhookParams): Promise<{ subscriptionId: string }>;
}

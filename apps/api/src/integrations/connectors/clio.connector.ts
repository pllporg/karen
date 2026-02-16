import { Injectable } from '@nestjs/common';
import {
  ConnectorAuthorizationParams,
  ConnectorTokenExchangeParams,
  ConnectorTokenExchangeResult,
  ConnectorSyncParams,
  ConnectorSyncResult,
  ConnectorWebhookParams,
  IncrementalSyncConnector,
} from './connector.interface';

@Injectable()
export class ClioConnector implements IncrementalSyncConnector {
  provider: 'CLIO' = 'CLIO';
  supportsOAuth = true;

  getAuthorizationUrl(params: ConnectorAuthorizationParams): string {
    const authUrl = process.env.CLIO_AUTH_URL || 'https://app.clio.com/oauth/authorize';
    const clientId = process.env.CLIO_CLIENT_ID || 'stub-clio-client-id';

    const query = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: params.redirectUri,
      state: params.state,
      scope: (params.scopes || ['matters:read', 'contacts:read']).join(' '),
    });

    return `${authUrl}?${query.toString()}`;
  }

  async exchangeAuthorizationCode(params: ConnectorTokenExchangeParams): Promise<ConnectorTokenExchangeResult> {
    const liveOauth = this.isLiveOauthEnabled();
    const tokenUrl = process.env.CLIO_TOKEN_URL || 'https://app.clio.com/oauth/token';
    const clientId = process.env.CLIO_CLIENT_ID || 'stub-clio-client-id';
    const clientSecret = process.env.CLIO_CLIENT_SECRET || 'stub-clio-client-secret';

    if (!liveOauth) {
      return {
        accessToken: `clio_access_${params.code.slice(0, 12)}`,
        refreshToken: `clio_refresh_${params.code.slice(0, 12)}`,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
        scopes: ['matters:read', 'contacts:read'],
        metadata: {
          mode: 'stub',
        },
      };
    }

    const body = new URLSearchParams({
      grant_type: 'authorization_code',
      code: params.code,
      redirect_uri: params.redirectUri,
      client_id: clientId,
      client_secret: clientSecret,
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Clio token exchange failed (${response.status}): ${text}`);
    }

    const payload = (await response.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
      created_at?: number;
    };
    if (!payload.access_token) {
      throw new Error('Clio token exchange did not return access_token');
    }

    const baseTime = typeof payload.created_at === 'number' ? payload.created_at * 1000 : Date.now();
    const expiresAt =
      typeof payload.expires_in === 'number'
        ? new Date(baseTime + payload.expires_in * 1000)
        : new Date(Date.now() + 1000 * 60 * 60);

    return {
      accessToken: payload.access_token,
      refreshToken: payload.refresh_token ?? null,
      expiresAt,
      scopes: payload.scope ? payload.scope.split(' ').filter(Boolean) : ['matters:read', 'contacts:read'],
      metadata: {
        mode: 'live',
      },
    };
  }

  async sync(params: ConnectorSyncParams): Promise<ConnectorSyncResult> {
    if (!params.accessToken) {
      throw new Error('Clio sync requires an access token');
    }

    return {
      nextCursor: new Date().toISOString(),
      importedCount: 0,
      warnings: ['Clio connector is running in bootstrap mode with no entity pulls yet.'],
    };
  }

  async subscribeWebhooks(params: ConnectorWebhookParams): Promise<{ subscriptionId: string }> {
    if (!params.accessToken) {
      throw new Error('Clio webhook subscription requires an access token');
    }

    return {
      subscriptionId: `clio-${params.connectionId}-${this.slug(params.event)}-${Date.now()}`,
    };
  }

  private isLiveOauthEnabled(): boolean {
    const value = String(process.env.INTEGRATION_OAUTH_ENABLE_LIVE || '').trim().toLowerCase();
    return value === '1' || value === 'true' || value === 'yes' || value === 'on';
  }

  private slug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32);
  }
}

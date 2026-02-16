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

type JsonRecord = Record<string, unknown>;

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
    if (!this.isLiveSyncEnabled()) {
      return {
        nextCursor: params.cursor ?? new Date().toISOString(),
        importedCount: 0,
        warnings: ['Clio sync is running in scaffold mode. Set INTEGRATION_SYNC_ENABLE_LIVE=true to enable provider pulls.'],
      };
    }

    if (!params.accessToken) {
      throw new Error('Clio sync requires an access token when INTEGRATION_SYNC_ENABLE_LIVE=true');
    }

    const config = this.parseConfig(params.config);
    const baseUrl = this.readConfigString(config, 'baseUrl') || process.env.CLIO_API_BASE_URL || 'https://app.clio.com/api/v4';
    const contactsPath = this.readConfigString(config, 'contactsPath') || '/contacts';
    const mattersPath = this.readConfigString(config, 'mattersPath') || '/matters';
    const cursorParam = this.readConfigString(config, 'cursorParam') || 'updated_since';

    const [contacts, matters] = await Promise.all([
      this.pullEntityRecords({
        providerLabel: 'Clio',
        baseUrl,
        path: contactsPath,
        accessToken: params.accessToken,
        cursor: params.cursor,
        cursorParam,
      }),
      this.pullEntityRecords({
        providerLabel: 'Clio',
        baseUrl,
        path: mattersPath,
        accessToken: params.accessToken,
        cursor: params.cursor,
        cursorParam,
      }),
    ]);

    const records = [...contacts.records, ...matters.records];
    const warnings = [
      ...contacts.warnings,
      ...matters.warnings,
      'Clio sync currently maps contacts and matters only; additional entity pulls remain pending.',
    ];

    return {
      nextCursor: this.resolveNextCursor(records, params.cursor),
      importedCount: records.length,
      warnings,
    };
  }

  async subscribeWebhooks(params: ConnectorWebhookParams): Promise<{ subscriptionId: string }> {
    if (!params.accessToken) {
      throw new Error('Clio webhook subscription requires an access token');
    }

    if (!this.isLiveSyncEnabled()) {
      return {
        subscriptionId: `clio-${params.connectionId}-${this.slug(params.event)}-${Date.now()}`,
      };
    }

    const config = this.parseConfig(params.config);
    const registrationUrl =
      this.readConfigString(config, 'webhookRegistrationUrl') || process.env.CLIO_WEBHOOK_REGISTER_URL || '';
    if (!registrationUrl) {
      return {
        subscriptionId: `clio-${params.connectionId}-${this.slug(params.event)}-${Date.now()}`,
      };
    }

    const response = await fetch(registrationUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        Accept: 'application/json',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        event: params.event,
        target_url: params.targetUrl,
        connection_id: params.connectionId,
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Clio webhook registration failed (${response.status}): ${this.clipMessage(text)}`);
    }
    const payload = (await response.json()) as unknown;
    const externalId = this.extractSubscriptionId(payload);
    if (externalId) {
      return { subscriptionId: externalId };
    }

    return {
      subscriptionId: `clio-${params.connectionId}-${this.slug(params.event)}-${Date.now()}`,
    };
  }

  private isLiveOauthEnabled(): boolean {
    const value = String(process.env.INTEGRATION_OAUTH_ENABLE_LIVE || '').trim().toLowerCase();
    return value === '1' || value === 'true' || value === 'yes' || value === 'on';
  }

  private isLiveSyncEnabled(): boolean {
    const value = String(process.env.INTEGRATION_SYNC_ENABLE_LIVE || '').trim().toLowerCase();
    return value === '1' || value === 'true' || value === 'yes' || value === 'on';
  }

  private async pullEntityRecords(input: {
    providerLabel: string;
    baseUrl: string;
    path: string;
    accessToken: string;
    cursor?: string | null;
    cursorParam: string;
  }): Promise<{ records: JsonRecord[]; warnings: string[] }> {
    const path = this.normalizePath(input.path);
    const url = new URL(path, this.ensureTrailingSlash(input.baseUrl));
    url.searchParams.set('limit', '100');
    if (input.cursor) {
      url.searchParams.set(input.cursorParam, input.cursor);
    }

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${input.accessToken}`,
          Accept: 'application/json',
        },
      });

      if (!response.ok) {
        const body = await response.text();
        return {
          records: [],
          warnings: [`${input.providerLabel} ${path} returned status ${response.status}. ${this.clipMessage(body) || 'No response body.'}`],
        };
      }

      const payload = (await response.json()) as unknown;
      const records = this.extractRecords(payload);
      if (records.length === 0) {
        return {
          records: [],
          warnings: [`${input.providerLabel} ${path} returned no parseable records in the response payload.`],
        };
      }

      return { records, warnings: [] };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        records: [],
        warnings: [`${input.providerLabel} ${path} request failed: ${this.clipMessage(message)}`],
      };
    }
  }

  private resolveNextCursor(records: JsonRecord[], fallback?: string | null): string {
    const timestampKeys = [
      'updated_at',
      'updatedAt',
      'modified_at',
      'modifiedAt',
      'last_activity_at',
      'lastActivityAt',
    ];
    let maxTimestamp = Number.NaN;

    for (const record of records) {
      for (const key of timestampKeys) {
        const raw = record[key];
        if (raw === null || raw === undefined) continue;
        const parsed = Date.parse(String(raw));
        if (Number.isFinite(parsed) && (!Number.isFinite(maxTimestamp) || parsed > maxTimestamp)) {
          maxTimestamp = parsed;
        }
      }
    }

    if (Number.isFinite(maxTimestamp)) {
      return new Date(maxTimestamp).toISOString();
    }
    if (fallback && fallback.trim().length > 0) {
      return fallback;
    }
    return new Date().toISOString();
  }

  private extractRecords(payload: unknown): JsonRecord[] {
    const direct = this.recordsFromCandidate(payload);
    if (direct.length > 0) return direct;

    const root = this.asRecord(payload);
    if (!root) return [];
    for (const key of ['data', 'results', 'items', 'records']) {
      const nested = this.recordsFromCandidate(root[key]);
      if (nested.length > 0) return nested;
    }
    return [];
  }

  private recordsFromCandidate(value: unknown): JsonRecord[] {
    if (Array.isArray(value)) {
      return value.filter((entry): entry is JsonRecord => Boolean(this.asRecord(entry)));
    }

    const record = this.asRecord(value);
    if (!record) return [];

    for (const key of ['data', 'results', 'items', 'records']) {
      const nested = record[key];
      if (Array.isArray(nested)) {
        return nested.filter((entry): entry is JsonRecord => Boolean(this.asRecord(entry)));
      }
    }

    return [];
  }

  private extractSubscriptionId(payload: unknown): string | null {
    const root = this.asRecord(payload);
    if (!root) return null;

    const direct = this.asString(root.id) || this.asString(root.subscription_id) || this.asString(root.subscriptionId);
    if (direct) return direct;

    const data = this.asRecord(root.data);
    if (!data) return null;
    return this.asString(data.id) || this.asString(data.subscription_id) || this.asString(data.subscriptionId);
  }

  private parseConfig(config: unknown): Record<string, unknown> {
    if (config && typeof config === 'object' && !Array.isArray(config)) {
      return config as Record<string, unknown>;
    }
    return {};
  }

  private readConfigString(config: Record<string, unknown>, key: string): string | null {
    const value = config[key];
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private ensureTrailingSlash(value: string): string {
    const normalized = String(value || '').trim();
    if (!normalized) return '/';
    return normalized.endsWith('/') ? normalized : `${normalized}/`;
  }

  private normalizePath(value: string): string {
    const normalized = String(value || '').trim();
    if (!normalized) return '/';
    return normalized.startsWith('/') ? normalized : `/${normalized}`;
  }

  private asRecord(value: unknown): JsonRecord | null {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as JsonRecord;
    }
    return null;
  }

  private asString(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    return normalized.length > 0 ? normalized : null;
  }

  private clipMessage(message: string): string {
    const normalized = String(message || '').replace(/\s+/g, ' ').trim();
    if (normalized.length <= 240) return normalized;
    return `${normalized.slice(0, 237)}...`;
  }

  private slug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32);
  }
}

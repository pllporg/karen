import { Injectable } from '@nestjs/common';
import { ConnectorSyncParams, ConnectorSyncResult, ConnectorWebhookParams, IncrementalSyncConnector } from './connector.interface';
import {
  isLiveSyncEnabled,
  parseConnectorConfig,
  pullEntityRecords,
  readConfigString,
  resolveNextCursor,
} from './sync-pull.util';

@Injectable()
export class PracticePantherConnector implements IncrementalSyncConnector {
  provider = 'PRACTICEPANTHER' as const;
  supportsOAuth = false;

  async sync(params: ConnectorSyncParams): Promise<ConnectorSyncResult> {
    if (!isLiveSyncEnabled()) {
      return {
        nextCursor: params.cursor ?? new Date().toISOString(),
        importedCount: 0,
        warnings: [
          'PracticePanther sync is running in scaffold mode. Set INTEGRATION_SYNC_ENABLE_LIVE=true to enable provider pulls.',
        ],
      };
    }

    if (!params.accessToken) {
      throw new Error('PracticePanther sync requires an access token when INTEGRATION_SYNC_ENABLE_LIVE=true');
    }

    const config = parseConnectorConfig(params.config);
    const baseUrl =
      readConfigString(config, 'baseUrl') || process.env.PRACTICEPANTHER_API_BASE_URL || 'https://app.practicepanther.com/api/v2';
    const contactsPath = readConfigString(config, 'contactsPath') || '/contacts';
    const mattersPath = readConfigString(config, 'mattersPath') || '/matters';
    const cursorParam = readConfigString(config, 'cursorParam') || 'updated_since';

    const [contacts, matters] = await Promise.all([
      pullEntityRecords({
        providerLabel: 'PracticePanther',
        baseUrl,
        path: contactsPath,
        accessToken: params.accessToken,
        cursor: params.cursor,
        cursorParam,
      }),
      pullEntityRecords({
        providerLabel: 'PracticePanther',
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
      'PracticePanther sync currently maps contacts and matters only; additional entity pulls remain pending.',
    ];

    return {
      nextCursor: resolveNextCursor(records, params.cursor),
      importedCount: records.length,
      warnings,
    };
  }

  async subscribeWebhooks(params: ConnectorWebhookParams): Promise<{ subscriptionId: string }> {
    if (isLiveSyncEnabled() && !params.accessToken) {
      throw new Error('PracticePanther webhook subscription requires an access token when INTEGRATION_SYNC_ENABLE_LIVE=true');
    }

    if (!isLiveSyncEnabled()) {
      return this.fallbackSubscription(params);
    }

    const config = parseConnectorConfig(params.config);
    const registrationUrl =
      readConfigString(config, 'webhookRegistrationUrl') || process.env.PRACTICEPANTHER_WEBHOOK_REGISTER_URL || '';
    if (!registrationUrl) {
      return this.fallbackSubscription(params);
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
      throw new Error(`PracticePanther webhook registration failed (${response.status}): ${this.clipMessage(text)}`);
    }

    const payload = (await response.json()) as unknown;
    const externalId = this.extractSubscriptionId(payload);
    if (externalId) {
      return { subscriptionId: externalId };
    }

    return this.fallbackSubscription(params);
  }

  private slug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32);
  }

  private fallbackSubscription(params: ConnectorWebhookParams): { subscriptionId: string } {
    return {
      subscriptionId: `practicepanther-${params.connectionId}-${this.slug(params.event)}-${Date.now()}`,
    };
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

  private asRecord(value: unknown): Record<string, unknown> | null {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, unknown>;
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
}

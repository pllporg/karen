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
  provider: 'PRACTICEPANTHER' = 'PRACTICEPANTHER';
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

    return {
      subscriptionId: `practicepanther-${params.connectionId}-${this.slug(params.event)}-${Date.now()}`,
    };
  }

  private slug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32);
  }
}

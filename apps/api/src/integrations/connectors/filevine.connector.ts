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
export class FilevineConnector implements IncrementalSyncConnector {
  provider: 'FILEVINE' = 'FILEVINE';
  supportsOAuth = false;

  async sync(params: ConnectorSyncParams): Promise<ConnectorSyncResult> {
    if (!isLiveSyncEnabled()) {
      return {
        nextCursor: params.cursor ?? new Date().toISOString(),
        importedCount: 0,
        warnings: [
          'Filevine sync is running in scaffold mode. Set INTEGRATION_SYNC_ENABLE_LIVE=true to enable provider pulls.',
        ],
      };
    }

    if (!params.accessToken) {
      throw new Error('Filevine sync requires an access token when INTEGRATION_SYNC_ENABLE_LIVE=true');
    }

    const config = parseConnectorConfig(params.config);
    const baseUrl = readConfigString(config, 'baseUrl') || process.env.FILEVINE_API_BASE_URL || 'https://api.filevineapp.com';
    const contactsPath = readConfigString(config, 'contactsPath') || '/contacts';
    const mattersPath = readConfigString(config, 'mattersPath') || '/projects';
    const cursorParam = readConfigString(config, 'cursorParam') || 'updated_since';

    const [contacts, matters] = await Promise.all([
      pullEntityRecords({
        providerLabel: 'Filevine',
        baseUrl,
        path: contactsPath,
        accessToken: params.accessToken,
        cursor: params.cursor,
        cursorParam,
      }),
      pullEntityRecords({
        providerLabel: 'Filevine',
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
      'Filevine sync currently maps contacts and projects only; additional entity pulls remain pending.',
    ];

    return {
      nextCursor: resolveNextCursor(records, params.cursor),
      importedCount: records.length,
      warnings,
    };
  }

  async subscribeWebhooks(params: ConnectorWebhookParams): Promise<{ subscriptionId: string }> {
    if (isLiveSyncEnabled() && !params.accessToken) {
      throw new Error('Filevine webhook subscription requires an access token when INTEGRATION_SYNC_ENABLE_LIVE=true');
    }

    return {
      subscriptionId: `filevine-${params.connectionId}-${this.slug(params.event)}-${Date.now()}`,
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

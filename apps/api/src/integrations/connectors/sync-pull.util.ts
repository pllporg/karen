type JsonRecord = Record<string, unknown>;

const DEFAULT_CURSOR_PARAM = 'updated_since';
const DEFAULT_LIMIT = 100;
const TIMESTAMP_KEYS = [
  'updated_at',
  'updatedAt',
  'modified_at',
  'modifiedAt',
  'last_activity_at',
  'lastActivityAt',
];

export type PullEntityRecordsInput = {
  providerLabel: string;
  baseUrl: string;
  path: string;
  accessToken: string;
  cursor?: string | null;
  cursorParam?: string;
  limit?: number;
  extraQuery?: Record<string, string | number | boolean | null | undefined>;
};

export type PullEntityRecordsResult = {
  records: JsonRecord[];
  warnings: string[];
  requestUrl: string;
};

export async function pullEntityRecords(input: PullEntityRecordsInput): Promise<PullEntityRecordsResult> {
  const path = normalizePath(input.path);
  const url = new URL(path, ensureTrailingSlash(input.baseUrl));
  const cursorParam = input.cursorParam || DEFAULT_CURSOR_PARAM;
  const limit = Number.isFinite(input.limit) && (input.limit || 0) > 0 ? Math.floor(input.limit || 0) : DEFAULT_LIMIT;
  url.searchParams.set('limit', String(limit));
  if (input.cursor) {
    url.searchParams.set(cursorParam, input.cursor);
  }

  for (const [key, value] of Object.entries(input.extraQuery || {})) {
    if (value === undefined || value === null) continue;
    url.searchParams.set(key, String(value));
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
        warnings: [
          `${input.providerLabel} ${path} returned status ${response.status}. ${clipMessage(body) || 'No response body.'}`,
        ],
        requestUrl: url.toString(),
      };
    }

    const payload = (await response.json()) as unknown;
    const records = extractRecords(payload);
    if (records.length === 0) {
      return {
        records,
        warnings: [`${input.providerLabel} ${path} returned no parseable records in the response payload.`],
        requestUrl: url.toString(),
      };
    }

    return {
      records,
      warnings: [],
      requestUrl: url.toString(),
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      records: [],
      warnings: [`${input.providerLabel} ${path} request failed: ${clipMessage(message)}`],
      requestUrl: url.toString(),
    };
  }
}

export function resolveNextCursor(records: JsonRecord[], fallback?: string | null): string {
  let maxTimestamp = Number.NaN;

  for (const record of records) {
    for (const key of TIMESTAMP_KEYS) {
      const rawValue = record[key];
      if (rawValue === null || rawValue === undefined) continue;
      const parsed = Date.parse(String(rawValue));
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

export function parseConnectorConfig(config: unknown): Record<string, unknown> {
  if (config && typeof config === 'object' && !Array.isArray(config)) {
    return config as Record<string, unknown>;
  }
  return {};
}

export function readConfigString(config: Record<string, unknown>, key: string): string | null {
  const value = config[key];
  if (typeof value !== 'string') return null;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function isLiveSyncEnabled(): boolean {
  return envFlagEnabled('INTEGRATION_SYNC_ENABLE_LIVE');
}

export function envFlagEnabled(name: string): boolean {
  const value = String(process.env[name] || '').trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes' || value === 'on';
}

function normalizePath(pathValue: string): string {
  const trimmed = String(pathValue || '').trim();
  if (!trimmed) return '/';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function ensureTrailingSlash(baseUrl: string): string {
  const trimmed = String(baseUrl || '').trim();
  if (!trimmed) return '/';
  return trimmed.endsWith('/') ? trimmed : `${trimmed}/`;
}

function extractRecords(payload: unknown): JsonRecord[] {
  const fromValue = fromCandidateValue(payload);
  if (fromValue.length > 0) return fromValue;

  const root = asRecord(payload);
  if (!root) return [];

  const candidateKeys = ['data', 'results', 'items', 'records'];
  for (const key of candidateKeys) {
    const nestedRecords = fromCandidateValue(root[key]);
    if (nestedRecords.length > 0) return nestedRecords;
  }

  return [];
}

function fromCandidateValue(value: unknown): JsonRecord[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is JsonRecord => Boolean(asRecord(entry)));
  }

  const record = asRecord(value);
  if (!record) return [];

  const candidateKeys = ['data', 'results', 'items', 'records'];
  for (const key of candidateKeys) {
    const nestedValue = record[key];
    if (Array.isArray(nestedValue)) {
      return nestedValue.filter((entry): entry is JsonRecord => Boolean(asRecord(entry)));
    }
  }

  return [];
}

function asRecord(value: unknown): JsonRecord | null {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as JsonRecord;
  }
  return null;
}

function clipMessage(message: string): string {
  const normalized = String(message || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= 240) return normalized;
  return `${normalized.slice(0, 237)}...`;
}

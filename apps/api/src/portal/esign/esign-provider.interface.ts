import { createHmac, timingSafeEqual } from 'node:crypto';

export type EsignEnvelopeStatus =
  | 'DRAFT'
  | 'PENDING_SIGNATURE'
  | 'SENT'
  | 'VIEWED'
  | 'SIGNED'
  | 'DECLINED'
  | 'VOIDED'
  | 'ERROR';

export interface EsignCreateEnvelopeInput {
  envelopeId: string;
  organizationId: string;
  engagementLetterTemplateId: string;
  engagementLetterTemplateName: string;
  engagementLetterBody: string;
  matterId?: string;
  clientContactId?: string;
}

export interface EsignCreateEnvelopeResult {
  externalId: string;
  status: EsignEnvelopeStatus;
  signingUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface EsignStatusResult {
  status: EsignEnvelopeStatus;
  metadata?: Record<string, unknown>;
}

export interface EsignWebhookPayload {
  headers: Record<string, string>;
  payload: unknown;
}

export interface EsignWebhookResult {
  externalId: string;
  status: EsignEnvelopeStatus;
  eventId?: string;
  metadata?: Record<string, unknown>;
}

export interface EsignProviderEnvelopeContext {
  id: string;
  organizationId: string;
  externalId: string;
  status: string;
  payloadJson?: unknown;
}

export interface EsignProvider {
  readonly key: string;
  createEnvelope(input: EsignCreateEnvelopeInput): Promise<EsignCreateEnvelopeResult>;
  getEnvelopeStatus(envelope: EsignProviderEnvelopeContext): Promise<EsignStatusResult>;
  parseWebhook(input: EsignWebhookPayload): EsignWebhookResult;
}

export const ALL_ESIGN_STATUSES: readonly EsignEnvelopeStatus[] = [
  'DRAFT',
  'PENDING_SIGNATURE',
  'SENT',
  'VIEWED',
  'SIGNED',
  'DECLINED',
  'VOIDED',
  'ERROR',
] as const;

const ESIGN_STATUS_SET = new Set<string>(ALL_ESIGN_STATUSES);

export function normalizeEsignStatus(value: string | undefined, fallback: EsignEnvelopeStatus): EsignEnvelopeStatus {
  if (!value) {
    return fallback;
  }
  const normalized = value.trim().toUpperCase();
  if (ESIGN_STATUS_SET.has(normalized)) {
    return normalized as EsignEnvelopeStatus;
  }
  return fallback;
}

export function normalizeWebhookHeaders(
  headers: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const normalized: Record<string, string> = {};
  for (const [key, value] of Object.entries(headers)) {
    if (Array.isArray(value)) {
      normalized[key.toLowerCase()] = value[0] ?? '';
      continue;
    }
    normalized[key.toLowerCase()] = value ?? '';
  }
  return normalized;
}

export function verifyHmacSignature(input: {
  payload: unknown;
  signature: string;
  secret: string;
  algorithm?: string;
}): boolean {
  const body = JSON.stringify(input.payload ?? {});
  const expected = createHmac(input.algorithm ?? 'sha256', input.secret).update(body).digest('hex');
  const provided = input.signature.trim().toLowerCase();
  if (provided.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

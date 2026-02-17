import { randomUUID } from 'node:crypto';
import {
  EsignCreateEnvelopeInput,
  EsignCreateEnvelopeResult,
  EsignProvider,
  EsignProviderEnvelopeContext,
  EsignStatusResult,
  EsignWebhookPayload,
  EsignWebhookResult,
  normalizeEsignStatus,
  verifyHmacSignature,
} from './esign-provider.interface';

export class StubEsignProvider implements EsignProvider {
  readonly key = 'stub';

  async createEnvelope(input: EsignCreateEnvelopeInput): Promise<EsignCreateEnvelopeResult> {
    const baseUrl = process.env.WEB_BASE_URL || 'http://localhost:3000';
    return {
      externalId: `stub-${input.envelopeId}-${randomUUID().slice(0, 8)}`,
      status: 'PENDING_SIGNATURE',
      signingUrl: `${baseUrl}/portal?esign=${input.envelopeId}`,
      metadata: {
        mode: 'stub',
        note: 'Stub e-sign provider for local development fallback.',
      },
    };
  }

  async getEnvelopeStatus(envelope: EsignProviderEnvelopeContext): Promise<EsignStatusResult> {
    const statusOverride = this.extractStatusOverride(envelope.payloadJson);
    return {
      status: statusOverride || normalizeEsignStatus(envelope.status, 'PENDING_SIGNATURE'),
      metadata: {
        mode: 'stub',
      },
    };
  }

  parseWebhook(input: EsignWebhookPayload): EsignWebhookResult {
    const payload = this.requireObject(input.payload);
    const signature = input.headers['x-esign-signature'] || input.headers['x-karen-esign-signature'] || '';
    const secret = process.env.ESIGN_STUB_WEBHOOK_SECRET?.trim();
    if (secret) {
      const valid = verifyHmacSignature({
        payload,
        signature,
        secret,
      });
      if (!valid) {
        throw new Error('Invalid e-sign webhook signature');
      }
    }

    const externalId = this.requireString(payload.externalId, 'externalId');
    const status = normalizeEsignStatus(
      typeof payload.status === 'string' ? payload.status : undefined,
      'PENDING_SIGNATURE',
    );
    return {
      externalId,
      status,
      eventId: typeof payload.eventId === 'string' ? payload.eventId : `${externalId}:${status}`,
      metadata: {
        mode: 'stub',
        webhook: true,
      },
    };
  }

  private extractStatusOverride(payloadJson: unknown): ReturnType<typeof normalizeEsignStatus> | null {
    if (!payloadJson || typeof payloadJson !== 'object' || Array.isArray(payloadJson)) {
      return null;
    }
    const raw = (payloadJson as Record<string, unknown>).stubStatus;
    if (typeof raw !== 'string') {
      return null;
    }
    return normalizeEsignStatus(raw, 'PENDING_SIGNATURE');
  }

  private requireObject(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      throw new Error('Webhook payload must be an object');
    }
    return value as Record<string, unknown>;
  }

  private requireString(value: unknown, field: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new Error(`Webhook payload missing required field: ${field}`);
    }
    return value.trim();
  }
}

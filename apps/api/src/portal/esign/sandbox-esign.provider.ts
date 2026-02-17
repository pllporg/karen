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

export class SandboxEsignProvider implements EsignProvider {
  readonly key = 'sandbox';

  async createEnvelope(input: EsignCreateEnvelopeInput): Promise<EsignCreateEnvelopeResult> {
    const baseUrl = process.env.ESIGN_SANDBOX_SIGN_BASE_URL || `${process.env.WEB_BASE_URL || 'http://localhost:3000'}/portal/sign`;
    const externalId = `sandbox-${randomUUID()}`;
    return {
      externalId,
      status: 'SENT',
      signingUrl: `${baseUrl}/${externalId}`,
      metadata: {
        mode: 'sandbox',
        envelopeReference: input.envelopeId,
      },
    };
  }

  async getEnvelopeStatus(envelope: EsignProviderEnvelopeContext): Promise<EsignStatusResult> {
    const payload = this.readPayload(envelope.payloadJson);
    const remoteStatus = typeof payload.sandboxStatus === 'string' ? payload.sandboxStatus : undefined;
    return {
      status: normalizeEsignStatus(remoteStatus, normalizeEsignStatus(envelope.status, 'SENT')),
      metadata: {
        mode: 'sandbox',
      },
    };
  }

  parseWebhook(input: EsignWebhookPayload): EsignWebhookResult {
    const payload = this.requireObject(input.payload);
    const signature = input.headers['x-esign-signature'] || input.headers['x-karen-esign-signature'] || '';
    const secret = process.env.ESIGN_SANDBOX_WEBHOOK_SECRET?.trim();
    if (!secret) {
      throw new Error('Missing ESIGN_SANDBOX_WEBHOOK_SECRET');
    }
    const valid = verifyHmacSignature({
      payload,
      signature,
      secret,
    });
    if (!valid) {
      throw new Error('Invalid e-sign webhook signature');
    }

    const externalId = this.requireString(payload.externalId, 'externalId');
    const eventType = typeof payload.eventType === 'string' ? payload.eventType : 'unknown';
    const status = normalizeEsignStatus(
      typeof payload.status === 'string' ? payload.status : this.statusFromEventType(eventType),
      'SENT',
    );
    return {
      externalId,
      status,
      eventId: typeof payload.eventId === 'string' ? payload.eventId : `${externalId}:${eventType}:${status}`,
      metadata: {
        mode: 'sandbox',
        eventType,
      },
    };
  }

  private statusFromEventType(eventType: string): string {
    const normalized = eventType.trim().toLowerCase();
    if (normalized.includes('completed') || normalized.includes('signed')) {
      return 'SIGNED';
    }
    if (normalized.includes('declined')) {
      return 'DECLINED';
    }
    if (normalized.includes('voided') || normalized.includes('canceled')) {
      return 'VOIDED';
    }
    if (normalized.includes('viewed')) {
      return 'VIEWED';
    }
    return 'SENT';
  }

  private readPayload(payloadJson: unknown): Record<string, unknown> {
    if (!payloadJson || typeof payloadJson !== 'object' || Array.isArray(payloadJson)) {
      return {};
    }
    return payloadJson as Record<string, unknown>;
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

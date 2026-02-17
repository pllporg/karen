import { Injectable } from '@nestjs/common';
import { createHash, createHmac } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { toJsonValue } from '../common/utils/json.util';

@Injectable()
export class WebhooksService {
  private readonly maxAttempts = this.parsePositiveInt(process.env.WEBHOOK_DELIVERY_MAX_ATTEMPTS, 3);
  private readonly retryBaseDelayMs = this.parseNonNegativeInt(process.env.WEBHOOK_DELIVERY_RETRY_BASE_DELAY_MS, 100);

  constructor(private readonly prisma: PrismaService) {}

  async registerEndpoint(input: {
    organizationId: string;
    url: string;
    secret: string;
    events: string[];
  }) {
    return this.prisma.webhookEndpoint.create({
      data: {
        organizationId: input.organizationId,
        url: input.url,
        secret: input.secret,
        events: input.events,
      },
    });
  }

  async listEndpoints(organizationId: string) {
    return this.prisma.webhookEndpoint.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async emit(
    organizationId: string,
    eventType: string,
    payload: Record<string, unknown>,
    options?: { idempotencyKey?: string },
  ) {
    const endpoints = await this.prisma.webhookEndpoint.findMany({
      where: {
        organizationId,
        isActive: true,
        events: {
          has: eventType,
        },
      },
    });

    for (const endpoint of endpoints) {
      const idempotencySeed = options?.idempotencyKey?.trim() || this.computePayloadFingerprint(eventType, payload);
      const idempotencyKey = `${eventType}:${endpoint.id}:${idempotencySeed}`;
      const existing = await this.prisma.webhookDelivery.findFirst({
        where: {
          webhookEndpointId: endpoint.id,
          idempotencyKey,
        },
        select: {
          id: true,
          status: true,
        },
      });
      if (existing) {
        continue;
      }

      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          webhookEndpointId: endpoint.id,
          eventType,
          payloadJson: toJsonValue(payload),
          status: 'PENDING',
          idempotencyKey,
        },
      });

      await this.deliverWithRetries({
        deliveryId: delivery.id,
        endpoint: {
          id: endpoint.id,
          url: endpoint.url,
          secret: endpoint.secret,
        },
        eventType,
        idempotencyKey,
        payload,
      });
    }
  }

  private async deliverWithRetries(input: {
    deliveryId: string;
    endpoint: { id: string; url: string; secret: string };
    eventType: string;
    idempotencyKey: string;
    payload: Record<string, unknown>;
  }) {
    const body = JSON.stringify(input.payload);
    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      const timestamp = Date.now().toString();
      const signature = this.signPayload(input.endpoint.secret, timestamp, body);
      const isLastAttempt = attempt === this.maxAttempts;
      try {
        const response = await fetch(input.endpoint.url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-karen-signature-v1': signature,
            'x-karen-signature-timestamp': timestamp,
            'x-karen-delivery-id': input.deliveryId,
            'x-karen-idempotency-key': input.idempotencyKey,
            'x-karen-event-type': input.eventType,
          },
          body,
        });

        if (response.ok) {
          await this.prisma.webhookDelivery.update({
            where: { id: input.deliveryId },
            data: {
              status: 'DELIVERED',
              attemptCount: attempt,
              lastAttemptAt: new Date(),
              responseCode: response.status,
            },
          });
          return;
        }

        await this.prisma.webhookDelivery.update({
          where: { id: input.deliveryId },
          data: {
            status: isLastAttempt ? 'FAILED' : 'RETRYING',
            attemptCount: attempt,
            lastAttemptAt: new Date(),
            responseCode: response.status,
          },
        });
      } catch {
        await this.prisma.webhookDelivery.update({
          where: { id: input.deliveryId },
          data: {
            status: isLastAttempt ? 'FAILED' : 'RETRYING',
            attemptCount: attempt,
            lastAttemptAt: new Date(),
            responseCode: null,
          },
        });
      }

      if (!isLastAttempt) {
        const delay = this.retryBaseDelayMs * 2 ** (attempt - 1);
        if (delay > 0) {
          await this.sleep(delay);
        }
      }
    }
  }

  private computePayloadFingerprint(eventType: string, payload: Record<string, unknown>) {
    const serialized = JSON.stringify(payload);
    return createHash('sha256').update(`${eventType}:${serialized}`).digest('hex');
  }

  private signPayload(secret: string, timestamp: string, body: string) {
    return createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex');
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private parsePositiveInt(raw: string | undefined, fallback: number) {
    const value = Number.parseInt(String(raw ?? ''), 10);
    if (!Number.isFinite(value) || value <= 0) return fallback;
    return value;
  }

  private parseNonNegativeInt(raw: string | undefined, fallback: number) {
    const value = Number.parseInt(String(raw ?? ''), 10);
    if (!Number.isFinite(value) || value < 0) return fallback;
    return value;
  }
}

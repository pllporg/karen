import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { createHash, createHmac } from 'node:crypto';
import { Prisma } from '@prisma/client';
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

  async listDeliveries(
    organizationId: string,
    options?: {
      endpointId?: string;
      status?: string;
      limit?: number;
    },
  ) {
    const where: Prisma.WebhookDeliveryWhereInput = {
      webhookEndpoint: {
        organizationId,
      },
    };
    if (options?.endpointId) {
      where.webhookEndpointId = options.endpointId;
    }
    if (options?.status) {
      where.status = options.status;
    }

    return this.prisma.webhookDelivery.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      take: this.normalizeListLimit(options?.limit),
      include: {
        webhookEndpoint: {
          select: {
            id: true,
            url: true,
            isActive: true,
          },
        },
      },
    });
  }

  async retryDelivery(organizationId: string, deliveryId: string) {
    const delivery = await this.prisma.webhookDelivery.findFirst({
      where: {
        id: deliveryId,
        webhookEndpoint: {
          organizationId,
        },
      },
      include: {
        webhookEndpoint: {
          select: {
            id: true,
            url: true,
            secret: true,
            isActive: true,
          },
        },
      },
    });

    if (!delivery) {
      throw new NotFoundException('Webhook delivery not found');
    }
    if (!delivery.webhookEndpoint.isActive) {
      throw new BadRequestException('Webhook endpoint is inactive');
    }
    if (!this.isRetryableStatus(delivery.status)) {
      throw new BadRequestException('Only FAILED or RETRYING deliveries can be retried');
    }

    await this.prisma.webhookDelivery.update({
      where: { id: delivery.id },
      data: {
        status: 'PENDING',
        attemptCount: 0,
        responseCode: null,
        lastAttemptAt: null,
      },
    });

    await this.deliverWithRetries({
      deliveryId: delivery.id,
      endpoint: {
        id: delivery.webhookEndpoint.id,
        url: delivery.webhookEndpoint.url,
        secret: delivery.webhookEndpoint.secret,
      },
      eventType: delivery.eventType,
      idempotencyKey: delivery.idempotencyKey,
      payload: this.readPayload(delivery.payloadJson),
    });

    const refreshed = await this.prisma.webhookDelivery.findUnique({
      where: { id: delivery.id },
      include: {
        webhookEndpoint: {
          select: {
            id: true,
            url: true,
            isActive: true,
          },
        },
      },
    });

    if (!refreshed) {
      throw new NotFoundException('Webhook delivery not found');
    }

    return refreshed;
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
            'x-lic-signature-v1': signature,
            'x-lic-signature-timestamp': timestamp,
            'x-lic-delivery-id': input.deliveryId,
            'x-lic-idempotency-key': input.idempotencyKey,
            'x-lic-event-type': input.eventType,
            // Legacy compatibility for existing webhook consumers.
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

  private readPayload(payloadJson: unknown): Record<string, unknown> {
    if (!payloadJson || typeof payloadJson !== 'object' || Array.isArray(payloadJson)) {
      throw new BadRequestException('Webhook delivery payload is invalid');
    }
    return payloadJson as Record<string, unknown>;
  }

  private isRetryableStatus(status: string) {
    return status === 'FAILED' || status === 'RETRYING';
  }

  private normalizeListLimit(limit?: number) {
    if (!Number.isFinite(limit) || !limit || limit <= 0) {
      return 50;
    }
    return Math.min(limit, 200);
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

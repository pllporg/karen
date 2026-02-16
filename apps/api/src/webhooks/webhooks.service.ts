import { Injectable } from '@nestjs/common';
import { createHmac } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WebhooksService {
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

  async emit(organizationId: string, eventType: string, payload: object) {
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
      const body = JSON.stringify(payload);
      const signature = createHmac('sha256', endpoint.secret).update(body).digest('hex');
      const delivery = await this.prisma.webhookDelivery.create({
        data: {
          webhookEndpointId: endpoint.id,
          eventType,
          payloadJson: payload,
          status: 'PENDING',
          idempotencyKey: `${eventType}:${Date.now()}:${Math.random()}`,
        },
      });

      try {
        const response = await fetch(endpoint.url, {
          method: 'POST',
          headers: {
            'content-type': 'application/json',
            'x-karen-signature': signature,
          },
          body,
        });

        await this.prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: response.ok ? 'DELIVERED' : 'FAILED',
            attemptCount: { increment: 1 },
            lastAttemptAt: new Date(),
            responseCode: response.status,
          },
        });
      } catch {
        await this.prisma.webhookDelivery.update({
          where: { id: delivery.id },
          data: {
            status: 'FAILED',
            attemptCount: { increment: 1 },
            lastAttemptAt: new Date(),
          },
        });
      }
    }
  }
}

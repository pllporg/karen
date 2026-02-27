import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider, SendMessageInput, SendMessageResult } from './message-provider.interface';

export class MessageProviderRequestError extends Error {
  constructor(
    message: string,
    readonly details: { provider: string; statusCode?: number; retryable: boolean; raw?: Record<string, unknown> },
  ) {
    super(message);
  }
}

@Injectable()
export class ResendEmailProvider implements EmailProvider {
  private readonly logger = new Logger(ResendEmailProvider.name);
  private readonly endpoint = process.env.RESEND_API_BASE_URL || 'https://api.resend.com';

  async sendEmail(input: SendMessageInput): Promise<SendMessageResult> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL || process.env.MESSAGE_DEFAULT_FROM_EMAIL;
    if (!apiKey) {
      throw new MessageProviderRequestError('RESEND_API_KEY is not configured', {
        provider: 'resend',
        retryable: false,
      });
    }
    if (!from) {
      throw new MessageProviderRequestError('RESEND_FROM_EMAIL is not configured', {
        provider: 'resend',
        retryable: false,
      });
    }

    const response = await fetch(`${this.endpoint}/emails`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        ...(input.idempotencyKey ? { 'Idempotency-Key': input.idempotencyKey } : {}),
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject || 'Message from LIC Legal Suite',
        text: input.body,
      }),
    });

    const rawBodyText = await response.text();
    let rawBody: Record<string, unknown> = {};
    try {
      rawBody = rawBodyText ? (JSON.parse(rawBodyText) as Record<string, unknown>) : {};
    } catch {
      rawBody = { body: rawBodyText };
    }

    if (!response.ok) {
      throw new MessageProviderRequestError(
        `Resend email request failed with status ${response.status}`,
        {
          provider: 'resend',
          statusCode: response.status,
          retryable: response.status >= 500,
          raw: rawBody,
        },
      );
    }

    const providerMessageId = String(rawBody.id || `resend-${Date.now()}`);
    this.logger.log(JSON.stringify({ event: 'provider.resend.accepted', provider: 'resend', recipient: input.to, providerMessageId }));
    return {
      id: `resend-${providerMessageId}`,
      provider: 'resend',
      status: 'queued',
      externalMessageId: providerMessageId,
      raw: rawBody,
    };
  }
}

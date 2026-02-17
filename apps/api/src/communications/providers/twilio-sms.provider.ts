import { Injectable, Logger } from '@nestjs/common';
import { SendMessageInput, SendMessageResult, SmsProvider } from './message-provider.interface';
import { MessageProviderRequestError } from './resend-email.provider';

@Injectable()
export class TwilioSmsProvider implements SmsProvider {
  private readonly logger = new Logger(TwilioSmsProvider.name);
  private readonly endpointBase = process.env.TWILIO_API_BASE_URL || 'https://api.twilio.com';

  async sendSms(input: SendMessageInput): Promise<SendMessageResult> {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM_PHONE || process.env.MESSAGE_DEFAULT_FROM_PHONE;

    if (!accountSid || !authToken) {
      throw new MessageProviderRequestError('Twilio credentials are not configured', {
        provider: 'twilio',
        retryable: false,
      });
    }
    if (!from) {
      throw new MessageProviderRequestError('TWILIO_FROM_PHONE is not configured', {
        provider: 'twilio',
        retryable: false,
      });
    }

    const url = `${this.endpointBase}/2010-04-01/Accounts/${accountSid}/Messages.json`;
    const basic = Buffer.from(`${accountSid}:${authToken}`).toString('base64');

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        To: input.to,
        From: from,
        Body: input.body,
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
        `Twilio SMS request failed with status ${response.status}`,
        {
          provider: 'twilio',
          statusCode: response.status,
          retryable: response.status >= 500 || response.status === 429,
          raw: rawBody,
        },
      );
    }

    const providerMessageId = String(rawBody.sid || `twilio-${Date.now()}`);
    const providerStatus = String(rawBody.status || 'queued').toLowerCase();
    const status: SendMessageResult['status'] =
      providerStatus === 'failed' || providerStatus === 'undelivered' ? 'failed' : 'queued';

    this.logger.log(`Twilio accepted SMS for ${input.to} (${providerMessageId})`);
    return {
      id: `twilio-${providerMessageId}`,
      provider: 'twilio',
      status,
      externalMessageId: providerMessageId,
      raw: rawBody,
    };
  }
}

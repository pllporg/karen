import { Injectable, Logger } from '@nestjs/common';
import { ResendEmailProvider, MessageProviderRequestError } from './resend-email.provider';
import { StubMessageProvider } from './stub-message.provider';
import { SendMessageInput, SendMessageResult } from './message-provider.interface';
import { TwilioSmsProvider } from './twilio-sms.provider';

@Injectable()
export class MessageDispatchService {
  private readonly logger = new Logger(MessageDispatchService.name);

  constructor(
    private readonly stub: StubMessageProvider,
    private readonly resend: ResendEmailProvider,
    private readonly twilio: TwilioSmsProvider,
  ) {}

  async sendEmail(input: SendMessageInput): Promise<SendMessageResult> {
    const selected = this.selectEmailProvider();
    return this.dispatchWithRetry({
      providerName: selected,
      handler: () => this.getEmailProvider(selected).sendEmail(input),
      fallback: () => this.stub.sendEmail(input),
    });
  }

  async sendSms(input: SendMessageInput): Promise<SendMessageResult> {
    const selected = this.selectSmsProvider();
    return this.dispatchWithRetry({
      providerName: selected,
      handler: () => this.getSmsProvider(selected).sendSms(input),
      fallback: () => this.stub.sendSms(input),
    });
  }

  private selectEmailProvider(): 'stub' | 'resend' {
    const value = String(process.env.MESSAGE_EMAIL_PROVIDER || 'stub').toLowerCase();
    if (value === 'resend') return 'resend';
    return 'stub';
  }

  private selectSmsProvider(): 'stub' | 'twilio' {
    const value = String(process.env.MESSAGE_SMS_PROVIDER || 'stub').toLowerCase();
    if (value === 'twilio') return 'twilio';
    return 'stub';
  }

  private getEmailProvider(provider: 'stub' | 'resend') {
    return provider === 'resend' ? this.resend : this.stub;
  }

  private getSmsProvider(provider: 'stub' | 'twilio') {
    return provider === 'twilio' ? this.twilio : this.stub;
  }

  private async dispatchWithRetry(input: {
    providerName: string;
    handler: () => Promise<SendMessageResult>;
    fallback: () => Promise<SendMessageResult>;
  }): Promise<SendMessageResult> {
    const maxAttempts = Math.max(Number(process.env.MESSAGE_PROVIDER_MAX_RETRIES || 2), 1);
    const retryDelayMs = Math.max(Number(process.env.MESSAGE_PROVIDER_RETRY_DELAY_MS || 200), 0);
    const failOpen = String(process.env.MESSAGE_PROVIDER_FAIL_OPEN || 'false').toLowerCase() === 'true';

    let lastError: unknown = null;
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await input.handler();
      } catch (error) {
        lastError = error;
        const retryable = this.isRetryable(error);
        const statusCode = this.getStatusCode(error);
        this.logger.warn(
          `Message dispatch failed via ${input.providerName} (attempt ${attempt}/${maxAttempts})` +
            `${statusCode ? ` status=${statusCode}` : ''}` +
            `${retryable ? ' retryable=true' : ' retryable=false'}`,
        );
        if (!retryable || attempt >= maxAttempts) {
          break;
        }
        if (retryDelayMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
        }
      }
    }

    if (failOpen && input.providerName !== 'stub') {
      this.logger.warn(`Fail-open is enabled. Falling back to stub provider for ${input.providerName}.`);
      return input.fallback();
    }

    throw this.normalizeDispatchError(lastError, input.providerName);
  }

  private isRetryable(error: unknown) {
    if (error instanceof MessageProviderRequestError) return error.details.retryable;
    if (error instanceof Error) {
      return (
        error.message.includes('ECONNRESET') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('fetch failed')
      );
    }
    return false;
  }

  private getStatusCode(error: unknown): number | undefined {
    if (error instanceof MessageProviderRequestError) {
      return error.details.statusCode;
    }
    return undefined;
  }

  private normalizeDispatchError(error: unknown, providerName: string): MessageProviderRequestError {
    if (error instanceof MessageProviderRequestError) return error;
    if (error instanceof Error) {
      return new MessageProviderRequestError(error.message, {
        provider: providerName,
        retryable: this.isRetryable(error),
      });
    }
    return new MessageProviderRequestError('Unknown message dispatch error', {
      provider: providerName,
      retryable: false,
    });
  }
}

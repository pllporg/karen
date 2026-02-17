import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider, SendMessageInput, SendMessageResult, SmsProvider } from './message-provider.interface';

@Injectable()
export class StubMessageProvider implements EmailProvider, SmsProvider {
  private readonly logger = new Logger(StubMessageProvider.name);

  async sendEmail(input: SendMessageInput): Promise<SendMessageResult> {
    const id = `stub-email-${Date.now()}`;
    this.logger.log(`Stub email sent to ${input.to}. Subject: ${input.subject || '(none)'}`);
    return {
      id,
      provider: 'stub',
      status: 'sent',
      externalMessageId: id,
    };
  }

  async sendSms(input: SendMessageInput): Promise<SendMessageResult> {
    const id = `stub-sms-${Date.now()}`;
    this.logger.log(`Stub sms sent to ${input.to}.`);
    return {
      id,
      provider: 'stub',
      status: 'sent',
      externalMessageId: id,
    };
  }
}

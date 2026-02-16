import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider, SendMessageInput, SmsProvider } from './message-provider.interface';

@Injectable()
export class StubMessageProvider implements EmailProvider, SmsProvider {
  private readonly logger = new Logger(StubMessageProvider.name);

  async sendEmail(input: SendMessageInput): Promise<{ id: string }> {
    this.logger.log(`Stub email sent to ${input.to}. Subject: ${input.subject || '(none)'}`);
    return { id: `stub-email-${Date.now()}` };
  }

  async sendSms(input: SendMessageInput): Promise<{ id: string }> {
    this.logger.log(`Stub sms sent to ${input.to}.`);
    return { id: `stub-sms-${Date.now()}` };
  }
}

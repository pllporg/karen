export type SendMessageInput = {
  to: string;
  subject?: string;
  body: string;
  idempotencyKey?: string;
};

export type SendMessageResult = {
  id: string;
  provider: string;
  status: 'queued' | 'sent' | 'failed';
  externalMessageId?: string;
  raw?: Record<string, unknown>;
};

export interface EmailProvider {
  sendEmail(input: SendMessageInput): Promise<SendMessageResult>;
}

export interface SmsProvider {
  sendSms(input: SendMessageInput): Promise<SendMessageResult>;
}

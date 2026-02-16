export type SendMessageInput = {
  to: string;
  subject?: string;
  body: string;
};

export interface EmailProvider {
  sendEmail(input: SendMessageInput): Promise<{ id: string }>;
}

export interface SmsProvider {
  sendSms(input: SendMessageInput): Promise<{ id: string }>;
}

import { MessageDispatchService } from '../src/communications/providers/message-dispatch.service';
import { MessageProviderRequestError } from '../src/communications/providers/resend-email.provider';

describe('MessageDispatchService', () => {
  const envBackup = { ...process.env };

  afterEach(() => {
    process.env = { ...envBackup };
    jest.clearAllMocks();
  });

  it('uses stub provider when no production provider is selected', async () => {
    delete process.env.MESSAGE_EMAIL_PROVIDER;
    delete process.env.MESSAGE_SMS_PROVIDER;

    const stub = {
      sendEmail: jest.fn().mockResolvedValue({ id: 'stub-1', provider: 'stub', status: 'sent' }),
      sendSms: jest.fn().mockResolvedValue({ id: 'stub-2', provider: 'stub', status: 'sent' }),
    } as any;
    const service = new MessageDispatchService(stub, { sendEmail: jest.fn() } as any, { sendSms: jest.fn() } as any);

    const email = await service.sendEmail({ to: 'client@example.com', subject: 'Hi', body: 'Body' });
    const sms = await service.sendSms({ to: '+15555550123', body: 'Body' });

    expect(stub.sendEmail).toHaveBeenCalledTimes(1);
    expect(stub.sendSms).toHaveBeenCalledTimes(1);
    expect(email.provider).toBe('stub');
    expect(sms.provider).toBe('stub');
  });

  it('retries resend on retryable failures and succeeds', async () => {
    process.env.MESSAGE_EMAIL_PROVIDER = 'resend';
    process.env.MESSAGE_PROVIDER_MAX_RETRIES = '2';
    process.env.MESSAGE_PROVIDER_RETRY_DELAY_MS = '0';

    const resend = {
      sendEmail: jest
        .fn()
        .mockRejectedValueOnce(
          new MessageProviderRequestError('temporary provider outage', {
            provider: 'resend',
            statusCode: 503,
            retryable: true,
          }),
        )
        .mockResolvedValueOnce({
          id: 'resend-1',
          provider: 'resend',
          status: 'queued',
          externalMessageId: 'prov-1',
        }),
    } as any;

    const service = new MessageDispatchService(
      { sendEmail: jest.fn(), sendSms: jest.fn() } as any,
      resend,
      { sendSms: jest.fn() } as any,
    );

    const result = await service.sendEmail({
      to: 'client@example.com',
      subject: 'Status',
      body: 'Update',
    });

    expect(resend.sendEmail).toHaveBeenCalledTimes(2);
    expect(result.provider).toBe('resend');
    expect(result.status).toBe('queued');
  });

  it('falls back to stub when fail-open is enabled', async () => {
    process.env.MESSAGE_SMS_PROVIDER = 'twilio';
    process.env.MESSAGE_PROVIDER_MAX_RETRIES = '1';
    process.env.MESSAGE_PROVIDER_FAIL_OPEN = 'true';

    const twilio = {
      sendSms: jest.fn().mockRejectedValue(
        new MessageProviderRequestError('gateway timeout', {
          provider: 'twilio',
          statusCode: 504,
          retryable: true,
        }),
      ),
    } as any;
    const stub = {
      sendEmail: jest.fn(),
      sendSms: jest.fn().mockResolvedValue({ id: 'stub-fallback', provider: 'stub', status: 'sent' }),
    } as any;

    const service = new MessageDispatchService(stub, { sendEmail: jest.fn() } as any, twilio);
    const result = await service.sendSms({ to: '+15555550123', body: 'Fallback' });

    expect(twilio.sendSms).toHaveBeenCalledTimes(1);
    expect(stub.sendSms).toHaveBeenCalledTimes(1);
    expect(result.provider).toBe('stub');
  });

  it('does not retry non-retryable provider failures', async () => {
    process.env.MESSAGE_EMAIL_PROVIDER = 'resend';
    process.env.MESSAGE_PROVIDER_MAX_RETRIES = '5';
    process.env.MESSAGE_PROVIDER_RETRY_DELAY_MS = '0';

    const resend = {
      sendEmail: jest.fn().mockRejectedValue(
        new MessageProviderRequestError('invalid recipient', {
          provider: 'resend',
          statusCode: 400,
          retryable: false,
        }),
      ),
    } as any;

    const service = new MessageDispatchService(
      { sendEmail: jest.fn(), sendSms: jest.fn() } as any,
      resend,
      { sendSms: jest.fn() } as any,
    );

    await expect(
      service.sendEmail({
        to: 'bad@example.com',
        subject: 'Status',
        body: 'Update',
      }),
    ).rejects.toEqual(
      expect.objectContaining({
        details: expect.objectContaining({
          provider: 'resend',
          statusCode: 400,
          retryable: false,
        }),
      }),
    );

    expect(resend.sendEmail).toHaveBeenCalledTimes(1);
  });

  it('falls back to default retry settings when env values are invalid', async () => {
    process.env.MESSAGE_EMAIL_PROVIDER = 'resend';
    process.env.MESSAGE_PROVIDER_MAX_RETRIES = 'abc';
    process.env.MESSAGE_PROVIDER_RETRY_DELAY_MS = 'not-a-number';

    const resend = {
      sendEmail: jest
        .fn()
        .mockRejectedValueOnce(
          new MessageProviderRequestError('provider outage', {
            provider: 'resend',
            statusCode: 503,
            retryable: true,
          }),
        )
        .mockResolvedValueOnce({
          id: 'resend-2',
          provider: 'resend',
          status: 'queued',
          externalMessageId: 'prov-2',
        }),
    } as any;

    const service = new MessageDispatchService(
      { sendEmail: jest.fn(), sendSms: jest.fn() } as any,
      resend,
      { sendSms: jest.fn() } as any,
    );

    const result = await service.sendEmail({
      to: 'client@example.com',
      subject: 'Status',
      body: 'Update',
    });

    expect(resend.sendEmail).toHaveBeenCalledTimes(2);
    expect(result.provider).toBe('resend');
    expect(result.status).toBe('queued');
  });
});

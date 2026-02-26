import { OpsService } from '../src/ops/ops.service';

describe('OpsService provider status', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('marks critical stub providers unhealthy in production profile', () => {
    process.env.NODE_ENV = 'production';
    process.env.MESSAGE_EMAIL_PROVIDER = 'stub';
    process.env.MESSAGE_SMS_PROVIDER = 'stub';
    process.env.MALWARE_SCANNER_PROVIDER = 'stub';
    process.env.ESIGN_PROVIDER = 'stub';
    process.env.CLIO_LIVE_OAUTH = 'false';
    process.env.MYCASE_LIVE_OAUTH = 'false';
    delete process.env.STRIPE_SECRET_KEY;

    const service = new OpsService();
    const status = service.providerStatus();

    expect(status.healthy).toBe(false);
    expect(status.providers.every((row) => typeof row.checkedAt === 'string')).toBe(true);
    expect(status.providers.some((row) => row.key === 'stripe' && row.healthy === false)).toBe(true);
    expect(status.providers.some((row) => row.key === 'email' && (row.issues || []).length > 0)).toBe(true);
  });

  it('marks providers healthy when live mode is configured', () => {
    process.env.NODE_ENV = 'production';
    process.env.STRIPE_SECRET_KEY = 'sk_test_x';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    process.env.MESSAGE_EMAIL_PROVIDER = 'resend';
    process.env.RESEND_API_KEY = 're_test';
    process.env.RESEND_FROM_EMAIL = 'noreply@example.test';
    process.env.MESSAGE_SMS_PROVIDER = 'twilio';
    process.env.TWILIO_ACCOUNT_SID = 'AC123';
    process.env.TWILIO_AUTH_TOKEN = 'token123';
    process.env.TWILIO_FROM_PHONE = '+15555550123';
    process.env.MALWARE_SCANNER_PROVIDER = 'clamav';
    process.env.CLAMAV_HOST = 'clamav.internal';
    process.env.MALWARE_SCANNER_FAIL_OPEN = 'false';
    process.env.ESIGN_PROVIDER = 'sandbox';
    process.env.ESIGN_SANDBOX_WEBHOOK_SECRET = 'esign_whsec';
    process.env.CLIO_LIVE_OAUTH = 'true';
    process.env.CLIO_CLIENT_ID = 'clio_client';
    process.env.CLIO_CLIENT_SECRET = 'clio_secret';
    process.env.CLIO_WEBHOOK_REGISTER_URL = 'https://clio.example/webhooks';
    process.env.MYCASE_LIVE_OAUTH = 'true';
    process.env.MYCASE_CLIENT_ID = 'mycase_client';
    process.env.MYCASE_CLIENT_SECRET = 'mycase_secret';
    process.env.MYCASE_WEBHOOK_REGISTER_URL = 'https://mycase.example/webhooks';
    process.env.INTEGRATION_SYNC_ENABLE_LIVE = 'true';

    const service = new OpsService();
    const status = service.providerStatus();

    expect(status.healthy).toBe(true);
    expect(status.providers.every((row) => row.healthy)).toBe(true);
  });

  it('uses global oauth live toggle when provider-specific flags are not set', () => {
    process.env.NODE_ENV = 'production';
    process.env.INTEGRATION_OAUTH_ENABLE_LIVE = 'true';
    process.env.CLIO_CLIENT_ID = 'clio_client';
    process.env.CLIO_CLIENT_SECRET = 'clio_secret';
    process.env.MYCASE_CLIENT_ID = 'mycase_client';
    process.env.MYCASE_CLIENT_SECRET = 'mycase_secret';
    process.env.STRIPE_SECRET_KEY = 'sk_test_x';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';
    process.env.MESSAGE_EMAIL_PROVIDER = 'resend';
    process.env.RESEND_API_KEY = 're_test';
    process.env.RESEND_FROM_EMAIL = 'noreply@example.test';
    process.env.MESSAGE_SMS_PROVIDER = 'twilio';
    process.env.TWILIO_ACCOUNT_SID = 'AC123';
    process.env.TWILIO_AUTH_TOKEN = 'token123';
    process.env.TWILIO_FROM_PHONE = '+15555550123';
    process.env.MALWARE_SCANNER_PROVIDER = 'clamav';
    process.env.MALWARE_SCANNER_FAIL_OPEN = 'false';
    process.env.CLAMAV_HOST = 'clamav.internal';
    process.env.ESIGN_PROVIDER = 'sandbox';
    process.env.ESIGN_SANDBOX_WEBHOOK_SECRET = 'esign_whsec';

    const service = new OpsService();
    const status = service.providerStatus();
    const clio = status.providers.find((row) => row.key === 'clio');
    const mycase = status.providers.find((row) => row.key === 'mycase');

    expect(clio?.mode).toBe('live');
    expect(mycase?.mode).toBe('live');
  });
});

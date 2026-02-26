import { OpsService } from '../src/ops/ops.service';
import { assertProviderReadiness } from '../src/ops/provider-readiness.util';

describe('provider live validation matrix', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  function configureLiveBaseline() {
    process.env.RUNTIME_PROFILE = 'staging';
    process.env.NODE_ENV = 'production';

    process.env.STRIPE_SECRET_KEY = 'sk_live_test';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_live_test';

    process.env.MESSAGE_EMAIL_PROVIDER = 'resend';
    process.env.RESEND_API_KEY = 're_live_test';
    process.env.RESEND_FROM_EMAIL = 'noreply@lic.local';

    process.env.MESSAGE_SMS_PROVIDER = 'twilio';
    process.env.TWILIO_ACCOUNT_SID = 'AC12345';
    process.env.TWILIO_AUTH_TOKEN = 'token12345';
    process.env.TWILIO_FROM_PHONE = '+15555550123';

    process.env.MALWARE_SCANNER_PROVIDER = 'clamav';
    process.env.MALWARE_SCANNER_FAIL_OPEN = 'false';
    process.env.CLAMAV_HOST = 'clamav.internal';

    process.env.ESIGN_PROVIDER = 'sandbox';
    process.env.ESIGN_SANDBOX_WEBHOOK_SECRET = 'esign_sandbox_secret';

    process.env.CLIO_LIVE_OAUTH = 'true';
    process.env.CLIO_CLIENT_ID = 'clio_live_client';
    process.env.CLIO_CLIENT_SECRET = 'clio_live_secret';
    process.env.CLIO_WEBHOOK_REGISTER_URL = 'https://clio.example/webhooks';

    process.env.MYCASE_LIVE_OAUTH = 'true';
    process.env.MYCASE_CLIENT_ID = 'mycase_live_client';
    process.env.MYCASE_CLIENT_SECRET = 'mycase_live_secret';
    process.env.MYCASE_WEBHOOK_REGISTER_URL = 'https://mycase.example/webhooks';

    process.env.INTEGRATION_SYNC_ENABLE_LIVE = 'true';
  }

  it('passes readiness for fully configured staging profile', () => {
    configureLiveBaseline();

    const status = new OpsService().providerStatus();
    expect(status.profile).toBe('staging');
    expect(status.healthy).toBe(true);
    expect(status.diagnostics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: 'stripe', status: 'pass' }),
        expect.objectContaining({ key: 'email', status: 'pass' }),
        expect.objectContaining({ key: 'sms', status: 'pass' }),
        expect.objectContaining({ key: 'malware_scanner', status: 'pass' }),
        expect.objectContaining({ key: 'esign', status: 'pass' }),
      ]),
    );
    expect(() => assertProviderReadiness(status.profile, status.providers)).not.toThrow();
  });

  it('fails readiness with actionable missing credential hints', () => {
    configureLiveBaseline();
    delete process.env.RESEND_API_KEY;
    delete process.env.CLIO_CLIENT_SECRET;

    const status = new OpsService().providerStatus();
    expect(status.healthy).toBe(false);

    const emailDiagnostic = status.diagnostics.find((row) => row.key === 'email');
    const email = status.providers.find((row) => row.key === 'email');
    const clio = status.providers.find((row) => row.key === 'clio');
    expect(emailDiagnostic?.status).toBe('fail');
    expect(email?.missingEnv).toContain('RESEND_API_KEY');
    expect(clio?.missingEnv).toContain('CLIO_CLIENT_SECRET');
    expect(() => assertProviderReadiness(status.profile, status.providers)).toThrow('RESEND_API_KEY');
    expect(() => assertProviderReadiness(status.profile, status.providers)).toThrow('CLIO_CLIENT_SECRET');
  });

  it('fails readiness for unsupported provider modes', () => {
    configureLiveBaseline();
    process.env.MESSAGE_EMAIL_PROVIDER = 'ses';

    const status = new OpsService().providerStatus();
    const email = status.providers.find((row) => row.key === 'email');

    expect(status.healthy).toBe(false);
    expect(email?.healthy).toBe(false);
    expect(email?.detail).toContain('Unsupported mode');
    expect(() => assertProviderReadiness(status.profile, status.providers)).toThrow('email');
  });

  it('fails readiness when malware scanner fail-open is enabled in live mode', () => {
    configureLiveBaseline();
    process.env.MALWARE_SCANNER_FAIL_OPEN = 'true';

    const status = new OpsService().providerStatus();
    const malware = status.providers.find((row) => row.key === 'malware_scanner');

    expect(status.healthy).toBe(false);
    expect(malware?.missingEnv).toContain('MALWARE_SCANNER_FAIL_OPEN=false');
    expect(() => assertProviderReadiness(status.profile, status.providers)).toThrow(
      'MALWARE_SCANNER_FAIL_OPEN=false',
    );
  });

  it('rejects stub oauth credentials even when live oauth toggles are enabled', () => {
    configureLiveBaseline();
    process.env.CLIO_CLIENT_ID = 'stub-clio-client-id';
    process.env.CLIO_CLIENT_SECRET = 'stub-clio-client-secret';

    const status = new OpsService().providerStatus();
    const clio = status.providers.find((row) => row.key === 'clio');

    expect(status.healthy).toBe(false);
    expect(clio?.missingEnv).toContain('CLIO_CLIENT_ID');
    expect(clio?.missingEnv).toContain('CLIO_CLIENT_SECRET');
  });

  it('requires complete staging validation path for clio/mycase oauth + sync + webhooks', () => {
    configureLiveBaseline();
    delete process.env.INTEGRATION_SYNC_ENABLE_LIVE;

    const status = new OpsService().providerStatus();
    const clioValidation = status.providers.find((row) => row.key === 'connectors_clio_staging_validation');
    const mycaseValidation = status.providers.find((row) => row.key === 'connectors_mycase_staging_validation');

    expect(status.healthy).toBe(false);
    expect(clioValidation?.missingEnv).toContain('INTEGRATION_SYNC_ENABLE_LIVE');
    expect(mycaseValidation?.missingEnv).toContain('INTEGRATION_SYNC_ENABLE_LIVE');
    expect(() => assertProviderReadiness(status.profile, status.providers)).toThrow('INTEGRATION_SYNC_ENABLE_LIVE');
  });

  it('fails readiness when live sync mode is enabled without webhook registration urls', () => {
    configureLiveBaseline();
    delete process.env.CLIO_WEBHOOK_REGISTER_URL;
    delete process.env.MYCASE_WEBHOOK_REGISTER_URL;

    const status = new OpsService().providerStatus();
    const clioWebhook = status.providers.find((row) => row.key === 'connectors_clio_webhooks');
    const mycaseWebhook = status.providers.find((row) => row.key === 'connectors_mycase_webhooks');

    expect(status.healthy).toBe(false);
    expect(clioWebhook?.missingEnv).toContain('CLIO_WEBHOOK_REGISTER_URL');
    expect(mycaseWebhook?.missingEnv).toContain('MYCASE_WEBHOOK_REGISTER_URL');
    expect(() => assertProviderReadiness(status.profile, status.providers)).toThrow('CLIO_WEBHOOK_REGISTER_URL');
  });
});

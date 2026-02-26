import { OpsService } from '../src/ops/ops.service';

describe('OpsService launch blockers', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('aggregates unresolved launch blockers with severity and runbooks', async () => {
    process.env.NODE_ENV = 'production';
    process.env.MESSAGE_EMAIL_PROVIDER = 'stub';
    process.env.MESSAGE_SMS_PROVIDER = 'twilio';
    process.env.TWILIO_ACCOUNT_SID = 'AC123';
    process.env.TWILIO_AUTH_TOKEN = 'token';
    process.env.TWILIO_FROM_PHONE = '+15555550123';
    process.env.MALWARE_SCANNER_PROVIDER = 'clamav';
    process.env.CLAMAV_HOST = 'clamav.internal';
    process.env.MALWARE_SCANNER_FAIL_OPEN = 'false';
    process.env.ESIGN_PROVIDER = 'sandbox';
    process.env.ESIGN_SANDBOX_WEBHOOK_SECRET = 'esign_whsec';
    process.env.CLIO_LIVE_OAUTH = 'true';
    process.env.CLIO_CLIENT_ID = 'clio_client';
    process.env.CLIO_CLIENT_SECRET = 'clio_secret';
    process.env.MYCASE_LIVE_OAUTH = 'true';
    process.env.MYCASE_CLIENT_ID = 'mycase_client';
    process.env.MYCASE_CLIENT_SECRET = 'mycase_secret';
    process.env.STRIPE_SECRET_KEY = 'sk_live';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_live';

    const prisma = {
      webhookDelivery: {
        count: jest.fn().mockResolvedValue(9),
      },
      aiJob: {
        count: jest.fn().mockResolvedValue(31),
        findFirst: jest.fn().mockResolvedValue({ createdAt: new Date('2026-02-20T10:00:00.000Z') }),
      },
      exportJob: {
        findFirst: jest.fn().mockResolvedValue({
          createdAt: new Date('2026-02-18T09:00:00.000Z'),
          finishedAt: new Date('2026-02-18T09:10:00.000Z'),
        }),
      },
    };

    const service = new OpsService(prisma as never);
    const snapshot = await service.launchBlockers();

    expect(snapshot.healthy).toBe(false);
    expect(snapshot.blockers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          key: 'provider_readiness',
          severity: 'critical',
          status: 'blocked',
          runbookUrl: '/docs/DEPLOYMENT_RUNBOOK.md#4-startup-readiness-checks',
        }),
        expect.objectContaining({
          key: 'webhook_retries',
          severity: 'warning',
          status: 'warning',
          runbookUrl: '/docs/DEPLOYMENT_RUNBOOK.md#6-incident-response',
        }),
        expect.objectContaining({
          key: 'queue_backlog',
          severity: 'warning',
          status: 'warning',
          runbookUrl: '/docs/DEPLOYMENT_RUNBOOK.md#7-baseline-slos-and-metrics',
        }),
        expect.objectContaining({
          key: 'backup_restore_freshness',
          severity: 'critical',
          status: 'blocked',
          runbookUrl: '/docs/DEPLOYMENT_RUNBOOK.md#5-rollback-procedure',
        }),
      ]),
    );
  });

  it('reports healthy when no blocker thresholds are exceeded', async () => {
    process.env.NODE_ENV = 'development';

    const now = new Date();
    const prisma = {
      webhookDelivery: {
        count: jest.fn().mockResolvedValue(0),
      },
      aiJob: {
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn().mockResolvedValue(null),
      },
      exportJob: {
        findFirst: jest.fn().mockResolvedValue({ createdAt: now, finishedAt: now }),
      },
    };

    const service = new OpsService(prisma as never);
    const snapshot = await service.launchBlockers();

    expect(snapshot.healthy).toBe(true);
    expect(snapshot.blockers).toEqual([]);
  });
});

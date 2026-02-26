import { evaluateAlertBaseline } from '../src/ops/alert-baseline.util';

describe('ops alert baseline evaluation', () => {
  const thresholds = {
    apiErrorRate: 0.05,
    queueFailureCount: 5,
    webhookFailureCount: 3,
    webhookRetryingCount: 5,
    providerUnhealthyCount: 1,
  };

  it('triggers each baseline alert when failure thresholds are exceeded', () => {
    const alerts = evaluateAlertBaseline({
      api: { totalRequests: 100, errorRequests: 9 },
      queue: { totalJobs: 40, failedJobs: 7 },
      webhooks: { totalDeliveries: 20, failedDeliveries: 4, retryingDeliveries: 2 },
      providers: { criticalUnhealthyCount: 2 },
      thresholds,
    });

    expect(alerts.find((alert) => alert.key === 'api_error_rate_spike')?.triggered).toBe(true);
    expect(alerts.find((alert) => alert.key === 'queue_job_failures')?.triggered).toBe(true);
    expect(alerts.find((alert) => alert.key === 'webhook_delivery_failures')?.triggered).toBe(true);
    expect(alerts.find((alert) => alert.key === 'provider_health_failures')?.triggered).toBe(true);
  });

  it('stays clear when observed signals are under baseline thresholds', () => {
    const alerts = evaluateAlertBaseline({
      api: { totalRequests: 250, errorRequests: 5 },
      queue: { totalJobs: 200, failedJobs: 1 },
      webhooks: { totalDeliveries: 50, failedDeliveries: 0, retryingDeliveries: 1 },
      providers: { criticalUnhealthyCount: 0 },
      thresholds,
    });

    expect(alerts.every((alert) => !alert.triggered)).toBe(true);
  });
});

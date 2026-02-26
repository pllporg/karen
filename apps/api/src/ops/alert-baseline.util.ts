export type AlertSeverity = 'info' | 'warning' | 'critical';

export type AlertDefinition = {
  key: 'api_error_rate_spike' | 'queue_job_failures' | 'webhook_delivery_failures' | 'provider_health_failures';
  severity: AlertSeverity;
  threshold: string;
  description: string;
  escalation: string;
};

export type AlertEvaluationInput = {
  api: { totalRequests: number; errorRequests: number };
  queue: { failedJobs: number; totalJobs: number };
  webhooks: { failedDeliveries: number; retryingDeliveries: number; totalDeliveries: number };
  providers: { criticalUnhealthyCount: number };
  thresholds: {
    apiErrorRate: number;
    queueFailureCount: number;
    webhookFailureCount: number;
    webhookRetryingCount: number;
    providerUnhealthyCount: number;
  };
};

export type AlertEvaluationRow = AlertDefinition & {
  triggered: boolean;
  observed: string;
};

export function evaluateAlertBaseline(input: AlertEvaluationInput): AlertEvaluationRow[] {
  const apiErrorRate = input.api.totalRequests > 0 ? input.api.errorRequests / input.api.totalRequests : 0;
  const queueFailureRate = input.queue.totalJobs > 0 ? input.queue.failedJobs / input.queue.totalJobs : 0;

  return [
    {
      key: 'api_error_rate_spike',
      severity: 'critical',
      threshold: `>= ${(input.thresholds.apiErrorRate * 100).toFixed(1)}% 5xx responses over lookback`,
      description: 'API 5xx rate indicates a systemic service reliability regression.',
      escalation: 'Page on-call API owner and start incident triage in #ops-incidents.',
      triggered: apiErrorRate >= input.thresholds.apiErrorRate,
      observed: `${input.api.errorRequests}/${input.api.totalRequests} (${(apiErrorRate * 100).toFixed(1)}%)`,
    },
    {
      key: 'queue_job_failures',
      severity: 'warning',
      threshold: `>= ${input.thresholds.queueFailureCount} failed jobs over lookback`,
      description: 'Background queue failures can silently block async workflows.',
      escalation: 'Assign worker owner to inspect failures/dead letters and retry policy.',
      triggered: input.queue.failedJobs >= input.thresholds.queueFailureCount,
      observed: `${input.queue.failedJobs}/${input.queue.totalJobs} failed (${(queueFailureRate * 100).toFixed(1)}%)`,
    },
    {
      key: 'webhook_delivery_failures',
      severity: 'warning',
      threshold: `>= ${input.thresholds.webhookFailureCount} failed OR >= ${input.thresholds.webhookRetryingCount} retrying deliveries over lookback`,
      description: 'Persistent webhook failures indicate external integration disruption.',
      escalation: 'Notify integration owner and evaluate endpoint health/credentials.',
      triggered:
        input.webhooks.failedDeliveries >= input.thresholds.webhookFailureCount ||
        input.webhooks.retryingDeliveries >= input.thresholds.webhookRetryingCount,
      observed: `failed=${input.webhooks.failedDeliveries}, retrying=${input.webhooks.retryingDeliveries}, total=${input.webhooks.totalDeliveries}`,
    },
    {
      key: 'provider_health_failures',
      severity: 'critical',
      threshold: `>= ${input.thresholds.providerUnhealthyCount} unhealthy critical providers`,
      description: 'Provider readiness failures block production traffic safety checks.',
      escalation: 'Block deploys/traffic shifts until provider readiness is healthy.',
      triggered: input.providers.criticalUnhealthyCount >= input.thresholds.providerUnhealthyCount,
      observed: `${input.providers.criticalUnhealthyCount} unhealthy critical providers`,
    },
  ];
}

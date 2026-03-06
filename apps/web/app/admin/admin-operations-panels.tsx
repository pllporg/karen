'use client';

import type { LaunchBlockersSnapshot, ProviderStatusSnapshot, WebhookDeliverySummary, WebhookEndpointSummary } from './use-admin-page';

type WebhookStatusFilter = 'ALL' | 'PENDING' | 'RETRYING' | 'FAILED' | 'DELIVERED';

type AdminOperationsPanelsProps = {
  providerStatus: ProviderStatusSnapshot | null;
  providerStatusError: string | null;
  launchBlockers: LaunchBlockersSnapshot | null;
  launchBlockersError: string | null;
  webhookStatusFilter: WebhookStatusFilter;
  updateWebhookFilter: (nextFilter: WebhookStatusFilter) => Promise<void>;
  webhookEndpoints: WebhookEndpointSummary[];
  webhookError: string | null;
  webhookDeliveries: WebhookDeliverySummary[];
  retryingDeliveryId: string | null;
  retryWebhookDelivery: (deliveryId: string) => Promise<void>;
};

export function AdminOperationsPanels({
  providerStatus,
  providerStatusError,
  launchBlockers,
  launchBlockersError,
  webhookStatusFilter,
  updateWebhookFilter,
  webhookEndpoints,
  webhookError,
  webhookDeliveries,
  retryingDeliveryId,
  retryWebhookDelivery,
}: AdminOperationsPanelsProps) {
  return (
    <>
      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h3 style={{ marginTop: 0 }}>Provider Readiness</h3>
        {providerStatus ? (
          <>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <span className="badge">{providerStatus.healthy ? 'HEALTHY' : 'UNHEALTHY'}</span>
              <span style={{ color: 'var(--lic-text-muted)' }}>Profile: {providerStatus.profile.toUpperCase()}</span>
              <span style={{ color: 'var(--lic-text-muted)' }}>
                Checked: {new Date(providerStatus.evaluatedAt).toLocaleString()}
              </span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Provider</th>
                  <th>Mode</th>
                  <th>Critical</th>
                  <th>Status</th>
                  <th>Issues</th>
                  <th>Checked</th>
                </tr>
              </thead>
              <tbody>
                {providerStatus.providers.map((provider) => (
                  <tr key={provider.key}>
                    <td>{provider.key}</td>
                    <td>{provider.provider || provider.mode}</td>
                    <td>{provider.critical ? 'Yes' : 'No'}</td>
                    <td>{provider.healthy ? 'HEALTHY' : 'UNHEALTHY'}</td>
                    <td>{provider.issues && provider.issues.length > 0 ? provider.issues.join('; ') : '-'}</td>
                    <td>{provider.checkedAt ? new Date(provider.checkedAt).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p style={{ color: 'var(--lic-text-muted)', marginTop: 0 }}>{providerStatusError || 'Loading provider diagnostics...'}</p>
        )}
      </div>

      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h3 style={{ marginTop: 0 }}>Production Launch Blockers</h3>
        {launchBlockers ? (
          <>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <span className="badge">{launchBlockers.healthy ? 'CLEAR' : 'ACTION REQUIRED'}</span>
              <span style={{ color: 'var(--lic-text-muted)' }}>
                Evaluated: {new Date(launchBlockers.evaluatedAt).toLocaleString()}
              </span>
            </div>
            <table className="table">
              <thead>
                <tr>
                  <th>Blocker</th>
                  <th>Severity</th>
                  <th>Status</th>
                  <th>Observed</th>
                  <th>Summary</th>
                  <th>Runbook</th>
                </tr>
              </thead>
              <tbody>
                {launchBlockers.blockers.map((blocker) => (
                  <tr key={blocker.key}>
                    <td>{blocker.title}</td>
                    <td>{blocker.severity.toUpperCase()}</td>
                    <td>{blocker.status.toUpperCase()}</td>
                    <td>{new Date(blocker.observedAt).toLocaleString()}</td>
                    <td>{blocker.summary}</td>
                    <td>
                      <a href={blocker.runbookUrl} target="_blank" rel="noreferrer">
                        Open runbook
                      </a>
                    </td>
                  </tr>
                ))}
                {launchBlockers.blockers.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ color: 'var(--lic-text-muted)' }}>
                      No unresolved launch blockers.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </>
        ) : (
          <p style={{ color: 'var(--lic-text-muted)', marginTop: 0 }}>{launchBlockersError || 'Loading launch blockers...'}</p>
        )}
      </div>

      <div className="card" style={{ gridColumn: '1 / -1' }}>
        <h3 style={{ marginTop: 0 }}>Webhook Delivery Monitor</h3>
        <p style={{ color: 'var(--lic-text-muted)', marginTop: 0 }}>
          Track endpoint health and retry failed deliveries with full server-side organization scoping.
        </p>

        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '220px 1fr', marginBottom: 12 }}>
          <select
            className="select"
            value={webhookStatusFilter}
            onChange={(event) => updateWebhookFilter(event.target.value as WebhookStatusFilter).catch(() => undefined)}
          >
            <option value="ALL">ALL</option>
            <option value="PENDING">PENDING</option>
            <option value="RETRYING">RETRYING</option>
            <option value="FAILED">FAILED</option>
            <option value="DELIVERED">DELIVERED</option>
          </select>
          <span style={{ alignSelf: 'center', color: 'var(--lic-text-muted)' }}>
            Active endpoints: {webhookEndpoints.filter((endpoint) => endpoint.isActive).length} / {webhookEndpoints.length}
          </span>
        </div>

        {webhookError ? <p style={{ color: 'var(--lic-red)', marginTop: 0 }}>{webhookError}</p> : null}

        <table className="table">
          <thead>
            <tr>
              <th>Endpoint</th>
              <th>Event</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>Response</th>
              <th>Last Attempt</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {webhookDeliveries.map((delivery) => {
              const retryable = delivery.status === 'FAILED' || delivery.status === 'RETRYING';
              return (
                <tr key={delivery.id}>
                  <td>{delivery.webhookEndpoint.url}</td>
                  <td>{delivery.eventType}</td>
                  <td>{delivery.status}</td>
                  <td>{delivery.attemptCount}</td>
                  <td>{delivery.responseCode ?? '-'}</td>
                  <td>{delivery.lastAttemptAt ? new Date(delivery.lastAttemptAt).toLocaleString() : '-'}</td>
                  <td>
                    <button
                      className="button ghost"
                      type="button"
                      disabled={!retryable || retryingDeliveryId === delivery.id}
                      onClick={() => retryWebhookDelivery(delivery.id).catch(() => undefined)}
                    >
                      {retryingDeliveryId === delivery.id ? 'Retrying...' : 'Retry'}
                    </button>
                  </td>
                </tr>
              );
            })}
            {webhookDeliveries.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ color: 'var(--lic-text-muted)' }}>
                  No deliveries for current filter.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}

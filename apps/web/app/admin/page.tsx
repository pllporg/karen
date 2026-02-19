'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { apiFetch } from '../../lib/api';

type WebhookEndpointSummary = {
  id: string;
  url: string;
  isActive: boolean;
  events: string[];
};

type WebhookDeliverySummary = {
  id: string;
  eventType: string;
  status: string;
  attemptCount: number;
  responseCode?: number | null;
  createdAt: string;
  lastAttemptAt?: string | null;
  webhookEndpoint: {
    id: string;
    url: string;
    isActive: boolean;
  };
};

export default function AdminPage() {
  const [org, setOrg] = useState<{ name: string; slug: string } | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; user: { email: string }; role?: { name: string } }>>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [stages, setStages] = useState<Array<{ id: string; practiceArea: string; name: string }>>([]);
  const [participantRoles, setParticipantRoles] = useState<
    Array<{ id: string; key: string; label: string; sideDefault?: 'CLIENT_SIDE' | 'OPPOSING_SIDE' | 'NEUTRAL' | 'COURT' }>
  >([]);
  const [auditEvents, setAuditEvents] = useState<Array<{ id: string; action: string; createdAt: string }>>([]);
  const [customFields, setCustomFields] = useState<Array<{ id: string; key: string; entityType: string; label: string }>>([]);
  const [sections, setSections] = useState<Array<{ id: string; name: string }>>([]);
  const [conflictProfiles, setConflictProfiles] = useState<
    Array<{ id: string; name: string; isDefault: boolean; thresholds: { warn: number; block: number } }>
  >([]);
  const [conflictChecks, setConflictChecks] = useState<
    Array<{
      id: string;
      queryText: string;
      createdAt: string;
      resultJson?: {
        recommendation?: 'CLEAR' | 'WARN' | 'BLOCK';
        score?: number;
        resolution?: { status?: string; decision?: string; rationale?: string };
      };
    }>
  >([]);
  const [webhookEndpoints, setWebhookEndpoints] = useState<WebhookEndpointSummary[]>([]);
  const [webhookDeliveries, setWebhookDeliveries] = useState<WebhookDeliverySummary[]>([]);
  const [customFieldKey, setCustomFieldKey] = useState('project_address');
  const [customFieldLabel, setCustomFieldLabel] = useState('Project Address');
  const [sectionName, setSectionName] = useState('Defect Summary');
  const [participantRoleKey, setParticipantRoleKey] = useState('opposing_party');
  const [participantRoleLabel, setParticipantRoleLabel] = useState('Opposing Party');
  const [participantRoleSide, setParticipantRoleSide] = useState<'CLIENT_SIDE' | 'OPPOSING_SIDE' | 'NEUTRAL' | 'COURT'>('OPPOSING_SIDE');
  const [conflictProfileName, setConflictProfileName] = useState('Construction Litigation Default');
  const [conflictWarnThreshold, setConflictWarnThreshold] = useState('45');
  const [conflictBlockThreshold, setConflictBlockThreshold] = useState('70');
  const [conflictQuery, setConflictQuery] = useState('Jane Doe');
  const [selectedConflictProfileId, setSelectedConflictProfileId] = useState('');
  const [resolutionDecision, setResolutionDecision] = useState<'CLEAR' | 'WAIVE' | 'BLOCK'>('WAIVE');
  const [resolutionRationale, setResolutionRationale] = useState('Attorney override after review of unrelated prior engagement.');
  const [webhookStatusFilter, setWebhookStatusFilter] = useState<'ALL' | 'PENDING' | 'RETRYING' | 'FAILED' | 'DELIVERED'>('FAILED');
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [retryingDeliveryId, setRetryingDeliveryId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      apiFetch<{ name: string; slug: string }>('/admin/organization'),
      apiFetch<Array<{ id: string; user: { email: string }; role?: { name: string } }>>('/admin/users'),
      apiFetch<Array<{ id: string; name: string }>>('/admin/roles'),
      apiFetch<Array<{ id: string; practiceArea: string; name: string }>>('/admin/stages'),
      apiFetch<Array<{ id: string; key: string; label: string; sideDefault?: 'CLIENT_SIDE' | 'OPPOSING_SIDE' | 'NEUTRAL' | 'COURT' }>>(
        '/admin/participant-roles',
      ),
      apiFetch<Array<{ id: string; action: string; createdAt: string }>>('/audit?limit=25'),
      apiFetch<Array<{ id: string; key: string; entityType: string; label: string }>>('/config/custom-fields'),
      apiFetch<Array<{ id: string; name: string }>>('/config/sections'),
      apiFetch<Array<{ id: string; name: string; isDefault: boolean; thresholds: { warn: number; block: number } }>>(
        '/admin/conflict-rule-profiles',
      ),
      apiFetch<
        Array<{
          id: string;
          queryText: string;
          createdAt: string;
          resultJson?: {
            recommendation?: 'CLEAR' | 'WARN' | 'BLOCK';
            score?: number;
            resolution?: { status?: string; decision?: string; rationale?: string };
          };
        }>
      >('/admin/conflict-checks?limit=15'),
      apiFetch<WebhookEndpointSummary[]>('/webhooks/endpoints'),
      apiFetch<WebhookDeliverySummary[]>('/webhooks/deliveries?status=FAILED&limit=25'),
    ])
      .then(([o, u, r, s, pr, a, cf, sec, cProfiles, cChecks, wEndpoints, wDeliveries]) => {
        setOrg(o);
        setUsers(u);
        setRoles(r);
        setStages(s);
        setParticipantRoles(pr);
        setAuditEvents(a);
        setCustomFields(cf);
        setSections(sec);
        setConflictProfiles(cProfiles);
        setConflictChecks(cChecks);
        setWebhookEndpoints(wEndpoints);
        setWebhookDeliveries(wDeliveries);
        if (cProfiles.length > 0) {
          setSelectedConflictProfileId(cProfiles[0].id);
        }
      })
      .catch(() => undefined);
  }, []);

  async function createCustomField() {
    await apiFetch('/config/custom-fields', {
      method: 'POST',
      body: JSON.stringify({
        entityType: 'matter',
        key: customFieldKey,
        label: customFieldLabel,
        fieldType: 'text',
      }),
    });
    setCustomFieldKey('');
    setCustomFieldLabel('');
    setCustomFields(await apiFetch<Array<{ id: string; key: string; entityType: string; label: string }>>('/config/custom-fields'));
  }

  async function createSection() {
    await apiFetch('/config/sections', {
      method: 'POST',
      body: JSON.stringify({
        name: sectionName,
        schemaJson: { type: 'object', properties: { summary: { type: 'string' } } },
      }),
    });
    setSectionName('');
    setSections(await apiFetch<Array<{ id: string; name: string }>>('/config/sections'));
  }

  async function createParticipantRole() {
    await apiFetch('/admin/participant-roles', {
      method: 'POST',
      body: JSON.stringify({
        key: participantRoleKey,
        label: participantRoleLabel,
        sideDefault: participantRoleSide,
      }),
    });
    setParticipantRoleKey('');
    setParticipantRoleLabel('');
    setParticipantRoles(
      await apiFetch<Array<{ id: string; key: string; label: string; sideDefault?: 'CLIENT_SIDE' | 'OPPOSING_SIDE' | 'NEUTRAL' | 'COURT' }>>(
        '/admin/participant-roles',
      ),
    );
  }

  async function createConflictProfile() {
    await apiFetch('/admin/conflict-rule-profiles', {
      method: 'POST',
      body: JSON.stringify({
        name: conflictProfileName,
        isDefault: true,
        thresholds: {
          warn: Number(conflictWarnThreshold) || 45,
          block: Number(conflictBlockThreshold) || 70,
        },
      }),
    });
    const profiles = await apiFetch<Array<{ id: string; name: string; isDefault: boolean; thresholds: { warn: number; block: number } }>>(
      '/admin/conflict-rule-profiles',
    );
    setConflictProfiles(profiles);
    if (profiles.length > 0) {
      setSelectedConflictProfileId(profiles[0].id);
    }
  }

  async function runConflictCheck() {
    await apiFetch('/admin/conflict-checks', {
      method: 'POST',
      body: JSON.stringify({
        queryText: conflictQuery,
        profileId: selectedConflictProfileId || undefined,
      }),
    });
    setConflictChecks(
      await apiFetch<
        Array<{
          id: string;
          queryText: string;
          createdAt: string;
          resultJson?: {
            recommendation?: 'CLEAR' | 'WARN' | 'BLOCK';
            score?: number;
            resolution?: { status?: string; decision?: string; rationale?: string };
          };
        }>
      >('/admin/conflict-checks?limit=15'),
    );
  }

  async function resolveConflictCheck(checkId: string) {
    await apiFetch(`/admin/conflict-checks/${checkId}/resolve`, {
      method: 'POST',
      body: JSON.stringify({
        decision: resolutionDecision,
        rationale: resolutionRationale,
      }),
    });
    setConflictChecks(
      await apiFetch<
        Array<{
          id: string;
          queryText: string;
          createdAt: string;
          resultJson?: {
            recommendation?: 'CLEAR' | 'WARN' | 'BLOCK';
            score?: number;
            resolution?: { status?: string; decision?: string; rationale?: string };
          };
        }>
      >('/admin/conflict-checks?limit=15'),
    );
  }

  async function refreshWebhookDeliveries(nextFilter = webhookStatusFilter) {
    const params = new URLSearchParams({ limit: '25' });
    if (nextFilter !== 'ALL') {
      params.set('status', nextFilter);
    }
    setWebhookDeliveries(await apiFetch<WebhookDeliverySummary[]>(`/webhooks/deliveries?${params.toString()}`));
  }

  async function updateWebhookFilter(nextFilter: 'ALL' | 'PENDING' | 'RETRYING' | 'FAILED' | 'DELIVERED') {
    setWebhookStatusFilter(nextFilter);
    setWebhookError(null);
    await refreshWebhookDeliveries(nextFilter);
  }

  async function retryWebhookDelivery(deliveryId: string) {
    setWebhookError(null);
    setRetryingDeliveryId(deliveryId);
    try {
      await apiFetch(`/webhooks/deliveries/${deliveryId}/retry`, {
        method: 'POST',
        body: JSON.stringify({}),
      });
      const endpoints = await apiFetch<WebhookEndpointSummary[]>('/webhooks/endpoints');
      setWebhookEndpoints(endpoints);
      await refreshWebhookDeliveries();
    } catch (error) {
      setWebhookError(error instanceof Error ? error.message : 'Failed to retry webhook delivery');
    } finally {
      setRetryingDeliveryId(null);
    }
  }

  return (
    <AppShell>
      <PageHeader title="Admin & Configuration" subtitle="Firm settings, roles, permissions, and matter pipeline controls." />
      <div className="card-grid">
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Firm</h3>
          <p>{org ? `${org.name} (${org.slug})` : 'Loading...'}</p>
        </div>
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Roles</h3>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {roles.map((role) => (
              <li key={role.id}>{role.name}</li>
            ))}
          </ul>
        </div>
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginTop: 0 }}>Members</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((member) => (
                <tr key={member.id}>
                  <td>{member.user.email}</td>
                  <td>{member.role?.name || 'Unassigned'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginTop: 0 }}>Stages</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Practice Area</th>
                <th>Name</th>
              </tr>
            </thead>
            <tbody>
              {stages.map((stage) => (
                <tr key={stage.id}>
                  <td>{stage.practiceArea}</td>
                  <td>{stage.name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginTop: 0 }}>Participant Roles</h3>
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 220px auto', marginBottom: 12 }}>
            <input
              className="input"
              value={participantRoleKey}
              onChange={(e) => setParticipantRoleKey(e.target.value)}
              placeholder="Role key (e.g. opposing_counsel)"
            />
            <input
              className="input"
              value={participantRoleLabel}
              onChange={(e) => setParticipantRoleLabel(e.target.value)}
              placeholder="Role label"
            />
            <select
              className="input"
              value={participantRoleSide}
              onChange={(e) => setParticipantRoleSide(e.target.value as 'CLIENT_SIDE' | 'OPPOSING_SIDE' | 'NEUTRAL' | 'COURT')}
            >
              <option value="CLIENT_SIDE">CLIENT_SIDE</option>
              <option value="OPPOSING_SIDE">OPPOSING_SIDE</option>
              <option value="NEUTRAL">NEUTRAL</option>
              <option value="COURT">COURT</option>
            </select>
            <button className="button secondary" onClick={createParticipantRole}>Save Role</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Key</th>
                <th>Label</th>
                <th>Default Side</th>
              </tr>
            </thead>
            <tbody>
              {participantRoles.map((role) => (
                <tr key={role.id}>
                  <td>{role.key}</td>
                  <td>{role.label}</td>
                  <td>{role.sideDefault || 'None'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginTop: 0 }}>Audit Log</h3>
          <table className="table">
            <thead>
              <tr>
                <th>Action</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {auditEvents.map((event) => (
                <tr key={event.id}>
                  <td>{event.action}</td>
                  <td>{new Date(event.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Custom Field Builder</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            <input className="input" value={customFieldKey} onChange={(e) => setCustomFieldKey(e.target.value)} placeholder="Field key" />
            <input className="input" value={customFieldLabel} onChange={(e) => setCustomFieldLabel(e.target.value)} placeholder="Field label" />
            <button className="button" onClick={createCustomField}>Create Custom Field</button>
          </div>
          <ul style={{ marginTop: 10, paddingLeft: 18 }}>
            {customFields.slice(0, 8).map((field) => (
              <li key={field.id}>{field.entityType}.{field.key} - {field.label}</li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Section Builder</h3>
          <div style={{ display: 'grid', gap: 8 }}>
            <input className="input" value={sectionName} onChange={(e) => setSectionName(e.target.value)} placeholder="Section name" />
            <button className="button secondary" onClick={createSection}>Create Section</button>
          </div>
          <ul style={{ marginTop: 10, paddingLeft: 18 }}>
            {sections.slice(0, 8).map((section) => (
              <li key={section.id}>{section.name}</li>
            ))}
          </ul>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginTop: 0 }}>Conflict Rule Profiles</h3>
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 140px 140px auto', marginBottom: 12 }}>
            <input
              className="input"
              value={conflictProfileName}
              onChange={(e) => setConflictProfileName(e.target.value)}
              placeholder="Profile name"
            />
            <input
              className="input"
              value={conflictWarnThreshold}
              onChange={(e) => setConflictWarnThreshold(e.target.value)}
              placeholder="Warn threshold"
            />
            <input
              className="input"
              value={conflictBlockThreshold}
              onChange={(e) => setConflictBlockThreshold(e.target.value)}
              placeholder="Block threshold"
            />
            <button className="button secondary" onClick={createConflictProfile}>Save Profile</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Default</th>
                <th>Warn</th>
                <th>Block</th>
              </tr>
            </thead>
            <tbody>
              {conflictProfiles.map((profile) => (
                <tr key={profile.id}>
                  <td>{profile.name}</td>
                  <td>{profile.isDefault ? 'Yes' : 'No'}</td>
                  <td>{profile.thresholds?.warn ?? '-'}</td>
                  <td>{profile.thresholds?.block ?? '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginTop: 0 }}>Conflict Checks</h3>
          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 260px auto', marginBottom: 12 }}>
            <input
              className="input"
              value={conflictQuery}
              onChange={(e) => setConflictQuery(e.target.value)}
              placeholder="Conflict query text"
            />
            <select
              className="select"
              value={selectedConflictProfileId}
              onChange={(e) => setSelectedConflictProfileId(e.target.value)}
            >
              <option value="">Auto-select profile</option>
              {conflictProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
            <button className="button" onClick={runConflictCheck}>Run Check</button>
          </div>

          <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '160px 1fr auto', marginBottom: 12 }}>
            <select
              className="select"
              value={resolutionDecision}
              onChange={(e) => setResolutionDecision(e.target.value as 'CLEAR' | 'WAIVE' | 'BLOCK')}
            >
              <option value="CLEAR">CLEAR</option>
              <option value="WAIVE">WAIVE</option>
              <option value="BLOCK">BLOCK</option>
            </select>
            <input
              className="input"
              value={resolutionRationale}
              onChange={(e) => setResolutionRationale(e.target.value)}
              placeholder="Resolution rationale"
            />
            <span style={{ color: 'var(--lic-text-muted)', alignSelf: 'center' }}>Use Resolve on a row below</span>
          </div>

          <table className="table">
            <thead>
              <tr>
                <th>Query</th>
                <th>Recommendation</th>
                <th>Score</th>
                <th>Resolution</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {conflictChecks.map((check) => (
                <tr key={check.id}>
                  <td>{check.queryText}</td>
                  <td>{check.resultJson?.recommendation || 'CLEAR'}</td>
                  <td>{check.resultJson?.score ?? 0}</td>
                  <td>{check.resultJson?.resolution?.decision || check.resultJson?.resolution?.status || 'UNRESOLVED'}</td>
                  <td>
                    <button
                      className="button ghost"
                      type="button"
                      onClick={() => resolveConflictCheck(check.id)}
                    >
                      Resolve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
              onChange={(e) => updateWebhookFilter(e.target.value as 'ALL' | 'PENDING' | 'RETRYING' | 'FAILED' | 'DELIVERED')}
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
                        onClick={() => retryWebhookDelivery(delivery.id)}
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
      </div>
    </AppShell>
  );
}

'use client';

import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { AdminOperationsPanels } from './admin-operations-panels';
import { useAdminPage } from './use-admin-page';

export default function AdminPage() {
  const {
    org,
    users,
    roles,
    stages,
    participantRoles,
    auditEvents,
    customFields,
    sections,
    conflictProfiles,
    conflictChecks,
    webhookEndpoints,
    webhookDeliveries,
    customFieldKey,
    customFieldLabel,
    sectionName,
    participantRoleKey,
    participantRoleLabel,
    participantRoleSide,
    conflictProfileName,
    conflictWarnThreshold,
    conflictBlockThreshold,
    conflictQuery,
    selectedConflictProfileId,
    resolutionDecision,
    resolutionRationale,
    webhookStatusFilter,
    webhookError,
    retryingDeliveryId,
    providerStatus,
    providerStatusError,
    launchBlockers,
    launchBlockersError,
    setCustomFieldKey,
    setCustomFieldLabel,
    setSectionName,
    setParticipantRoleKey,
    setParticipantRoleLabel,
    setParticipantRoleSide,
    setConflictProfileName,
    setConflictWarnThreshold,
    setConflictBlockThreshold,
    setConflictQuery,
    setSelectedConflictProfileId,
    setResolutionDecision,
    setResolutionRationale,
    createCustomField,
    createSection,
    createParticipantRole,
    createConflictProfile,
    runConflictCheck,
    resolveConflictCheck,
    updateWebhookFilter,
    retryWebhookDelivery,
  } = useAdminPage();

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

        <AdminOperationsPanels
          providerStatus={providerStatus}
          providerStatusError={providerStatusError}
          launchBlockers={launchBlockers}
          launchBlockersError={launchBlockersError}
          webhookStatusFilter={webhookStatusFilter}
          updateWebhookFilter={updateWebhookFilter}
          webhookEndpoints={webhookEndpoints}
          webhookError={webhookError}
          webhookDeliveries={webhookDeliveries}
          retryingDeliveryId={retryingDeliveryId}
          retryWebhookDelivery={retryWebhookDelivery}
        />
      </div>
    </AppShell>
  );
}

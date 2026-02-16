'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { apiFetch } from '../../lib/api';

export default function AdminPage() {
  const [org, setOrg] = useState<{ name: string; slug: string } | null>(null);
  const [users, setUsers] = useState<Array<{ id: string; user: { email: string }; role?: { name: string } }>>([]);
  const [roles, setRoles] = useState<Array<{ id: string; name: string }>>([]);
  const [stages, setStages] = useState<Array<{ id: string; practiceArea: string; name: string }>>([]);
  const [auditEvents, setAuditEvents] = useState<Array<{ id: string; action: string; createdAt: string }>>([]);
  const [customFields, setCustomFields] = useState<Array<{ id: string; key: string; entityType: string; label: string }>>([]);
  const [sections, setSections] = useState<Array<{ id: string; name: string }>>([]);
  const [customFieldKey, setCustomFieldKey] = useState('project_address');
  const [customFieldLabel, setCustomFieldLabel] = useState('Project Address');
  const [sectionName, setSectionName] = useState('Defect Summary');

  useEffect(() => {
    Promise.all([
      apiFetch<{ name: string; slug: string }>('/admin/organization'),
      apiFetch<Array<{ id: string; user: { email: string }; role?: { name: string } }>>('/admin/users'),
      apiFetch<Array<{ id: string; name: string }>>('/admin/roles'),
      apiFetch<Array<{ id: string; practiceArea: string; name: string }>>('/admin/stages'),
      apiFetch<Array<{ id: string; action: string; createdAt: string }>>('/audit?limit=25'),
      apiFetch<Array<{ id: string; key: string; entityType: string; label: string }>>('/config/custom-fields'),
      apiFetch<Array<{ id: string; name: string }>>('/config/sections'),
    ])
      .then(([o, u, r, s, a, cf, sec]) => {
        setOrg(o);
        setUsers(u);
        setRoles(r);
        setStages(s);
        setAuditEvents(a);
        setCustomFields(cf);
        setSections(sec);
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
      </div>
    </AppShell>
  );
}

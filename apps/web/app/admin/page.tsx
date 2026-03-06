'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { Button } from '../../components/ui/button';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import {
  adminConflictCheckSchema,
  adminConflictResolutionSchema,
  conflictProfileConfigSchema,
  customFieldConfigSchema,
  participantRoleConfigSchema,
  sectionConfigSchema,
  type AdminConflictCheckFormData,
  type AdminConflictResolutionFormData,
  type ConflictProfileConfigFormData,
  type CustomFieldConfigFormData,
  type ParticipantRoleConfigFormData,
  type SectionConfigFormData,
} from '../../lib/schemas/admin-config';
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
    webhookStatusFilter,
    webhookError,
    retryingDeliveryId,
    providerStatus,
    providerStatusError,
    launchBlockers,
    launchBlockersError,
    createCustomField,
    createSection,
    createParticipantRole,
    createConflictProfile,
    runConflictCheck,
    resolveConflictCheck,
    updateWebhookFilter,
    retryWebhookDelivery,
  } = useAdminPage();

  const customFieldForm = useForm<CustomFieldConfigFormData>({
    resolver: zodResolver(customFieldConfigSchema),
    mode: 'onBlur',
    defaultValues: {
      key: 'project_address',
      label: 'Project Address',
    },
  });
  const sectionForm = useForm<SectionConfigFormData>({
    resolver: zodResolver(sectionConfigSchema),
    mode: 'onBlur',
    defaultValues: {
      name: 'Defect Summary',
    },
  });
  const participantRoleForm = useForm<ParticipantRoleConfigFormData>({
    resolver: zodResolver(participantRoleConfigSchema),
    mode: 'onBlur',
    defaultValues: {
      key: 'opposing_party',
      label: 'Opposing Party',
      sideDefault: 'OPPOSING_SIDE',
    },
  });
  const conflictProfileForm = useForm<ConflictProfileConfigFormData>({
    resolver: zodResolver(conflictProfileConfigSchema),
    mode: 'onBlur',
    defaultValues: {
      name: 'Construction Litigation Default',
      warnThreshold: '45',
      blockThreshold: '70',
    },
  });
  const conflictCheckForm = useForm<AdminConflictCheckFormData>({
    resolver: zodResolver(adminConflictCheckSchema),
    mode: 'onBlur',
    defaultValues: {
      queryText: 'Jane Doe',
      profileId: '',
    },
  });
  const conflictResolutionForm = useForm<AdminConflictResolutionFormData>({
    resolver: zodResolver(adminConflictResolutionSchema),
    mode: 'onBlur',
    defaultValues: {
      decision: 'WAIVE',
      rationale: 'Attorney override after review of unrelated prior engagement.',
    },
  });

  useEffect(() => {
    const currentProfileId = conflictCheckForm.getValues('profileId');
    if (!currentProfileId && conflictProfiles[0]?.id) {
      conflictCheckForm.setValue('profileId', conflictProfiles[0].id, { shouldDirty: false });
    }
  }, [conflictProfiles, conflictCheckForm]);

  const submitCustomField = customFieldForm.handleSubmit(async (values) => {
    await createCustomField(values);
    customFieldForm.reset({
      key: '',
      label: '',
    });
  });

  const submitSection = sectionForm.handleSubmit(async (values) => {
    await createSection(values);
    sectionForm.reset({
      name: '',
    });
  });

  const submitParticipantRole = participantRoleForm.handleSubmit(async (values) => {
    await createParticipantRole(values);
    participantRoleForm.reset({
      key: '',
      label: '',
      sideDefault: values.sideDefault,
    });
  });

  const submitConflictProfile = conflictProfileForm.handleSubmit(async (values) => {
    await createConflictProfile(values);
  });

  const submitConflictCheck = conflictCheckForm.handleSubmit(async (values) => {
    await runConflictCheck(values);
  });

  const resolveConflict = (checkId: string) =>
    conflictResolutionForm.handleSubmit(async (values) => {
      await resolveConflictCheck(checkId, values);
    });

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
          <form
            style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr 220px auto', marginBottom: 12 }}
            onSubmit={submitParticipantRole}
          >
            <FormField label="Role Key" name="participant-role-key" error={participantRoleForm.formState.errors.key?.message} required>
              <Input
                placeholder="Role key (e.g. opposing_counsel)"
                {...participantRoleForm.register('key')}
                invalid={!!participantRoleForm.formState.errors.key}
              />
            </FormField>
            <FormField label="Role Label" name="participant-role-label" error={participantRoleForm.formState.errors.label?.message} required>
              <Input
                placeholder="Role label"
                {...participantRoleForm.register('label')}
                invalid={!!participantRoleForm.formState.errors.label}
              />
            </FormField>
            <FormField
              label="Default Side"
              name="participant-role-side"
              error={participantRoleForm.formState.errors.sideDefault?.message}
              required
            >
              <Select
                {...participantRoleForm.register('sideDefault')}
                invalid={!!participantRoleForm.formState.errors.sideDefault}
              >
                <option value="CLIENT_SIDE">CLIENT_SIDE</option>
                <option value="OPPOSING_SIDE">OPPOSING_SIDE</option>
                <option value="NEUTRAL">NEUTRAL</option>
                <option value="COURT">COURT</option>
              </Select>
            </FormField>
            <div className="stack-2">
              <p className="type-label">Save</p>
              <Button tone="secondary" type="submit" disabled={participantRoleForm.formState.isSubmitting}>
                {participantRoleForm.formState.isSubmitting ? 'Working...' : 'Save Role'}
              </Button>
            </div>
          </form>
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
          <form style={{ display: 'grid', gap: 8 }} onSubmit={submitCustomField}>
            <FormField label="Field Key" name="custom-field-key" error={customFieldForm.formState.errors.key?.message} required>
              <Input
                placeholder="Field key"
                {...customFieldForm.register('key')}
                invalid={!!customFieldForm.formState.errors.key}
              />
            </FormField>
            <FormField label="Field Label" name="custom-field-label" error={customFieldForm.formState.errors.label?.message} required>
              <Input
                placeholder="Field label"
                {...customFieldForm.register('label')}
                invalid={!!customFieldForm.formState.errors.label}
              />
            </FormField>
            <Button type="submit" disabled={customFieldForm.formState.isSubmitting}>
              {customFieldForm.formState.isSubmitting ? 'Working...' : 'Create Custom Field'}
            </Button>
          </form>
          <ul style={{ marginTop: 10, paddingLeft: 18 }}>
            {customFields.slice(0, 8).map((field) => (
              <li key={field.id}>{field.entityType}.{field.key} - {field.label}</li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Section Builder</h3>
          <form style={{ display: 'grid', gap: 8 }} onSubmit={submitSection}>
            <FormField label="Section Name" name="section-name" error={sectionForm.formState.errors.name?.message} required>
              <Input
                placeholder="Section name"
                {...sectionForm.register('name')}
                invalid={!!sectionForm.formState.errors.name}
              />
            </FormField>
            <Button tone="secondary" type="submit" disabled={sectionForm.formState.isSubmitting}>
              {sectionForm.formState.isSubmitting ? 'Working...' : 'Create Section'}
            </Button>
          </form>
          <ul style={{ marginTop: 10, paddingLeft: 18 }}>
            {sections.slice(0, 8).map((section) => (
              <li key={section.id}>{section.name}</li>
            ))}
          </ul>
        </div>

        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <h3 style={{ marginTop: 0 }}>Conflict Rule Profiles</h3>
          <form
            style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 140px 140px auto', marginBottom: 12 }}
            onSubmit={submitConflictProfile}
          >
            <FormField label="Profile Name" name="conflict-profile-name" error={conflictProfileForm.formState.errors.name?.message} required>
              <Input
                placeholder="Profile name"
                {...conflictProfileForm.register('name')}
                invalid={!!conflictProfileForm.formState.errors.name}
              />
            </FormField>
            <FormField
              label="Warn Threshold"
              name="conflict-warn-threshold"
              error={conflictProfileForm.formState.errors.warnThreshold?.message}
              required
            >
              <Input
                placeholder="Warn threshold"
                {...conflictProfileForm.register('warnThreshold')}
                invalid={!!conflictProfileForm.formState.errors.warnThreshold}
              />
            </FormField>
            <FormField
              label="Block Threshold"
              name="conflict-block-threshold"
              error={conflictProfileForm.formState.errors.blockThreshold?.message}
              required
            >
              <Input
                placeholder="Block threshold"
                {...conflictProfileForm.register('blockThreshold')}
                invalid={!!conflictProfileForm.formState.errors.blockThreshold}
              />
            </FormField>
            <div className="stack-2">
              <p className="type-label">Save</p>
              <Button tone="secondary" type="submit" disabled={conflictProfileForm.formState.isSubmitting}>
                {conflictProfileForm.formState.isSubmitting ? 'Working...' : 'Save Profile'}
              </Button>
            </div>
          </form>
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
          <form
            style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 260px auto', marginBottom: 12 }}
            onSubmit={submitConflictCheck}
          >
            <FormField
              label="Conflict Query"
              name="admin-conflict-query"
              error={conflictCheckForm.formState.errors.queryText?.message}
              required
            >
              <Input
                placeholder="Conflict query text"
                {...conflictCheckForm.register('queryText')}
                invalid={!!conflictCheckForm.formState.errors.queryText}
              />
            </FormField>
            <FormField label="Conflict Profile" name="admin-conflict-profile">
              <Select {...conflictCheckForm.register('profileId')}>
                <option value="">Auto-select profile</option>
                {conflictProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </Select>
            </FormField>
            <div className="stack-2">
              <p className="type-label">Run</p>
              <Button type="submit" disabled={conflictCheckForm.formState.isSubmitting}>
                {conflictCheckForm.formState.isSubmitting ? 'Working...' : 'Run Check'}
              </Button>
            </div>
          </form>

          <form style={{ display: 'grid', gap: 8, gridTemplateColumns: '160px 1fr auto', marginBottom: 12 }}>
            <FormField
              label="Resolution Decision"
              name="admin-resolution-decision"
              error={conflictResolutionForm.formState.errors.decision?.message}
              required
            >
              <Select {...conflictResolutionForm.register('decision')}>
                <option value="CLEAR">CLEAR</option>
                <option value="WAIVE">WAIVE</option>
                <option value="BLOCK">BLOCK</option>
              </Select>
            </FormField>
            <FormField
              label="Resolution Rationale"
              name="admin-resolution-rationale"
              error={conflictResolutionForm.formState.errors.rationale?.message}
              required
            >
              <Input
                placeholder="Resolution rationale"
                {...conflictResolutionForm.register('rationale')}
                invalid={!!conflictResolutionForm.formState.errors.rationale}
              />
            </FormField>
            <span style={{ color: 'var(--lic-text-muted)', alignSelf: 'center' }}>Use Resolve on a row below</span>
          </form>

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
                      onClick={() => void resolveConflict(check.id)()}
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

import { Button } from '../../components/ui/button';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import type { AdminConfigurationForms } from './use-admin-configuration-forms';
import type { useAdminPage } from './use-admin-page';

type AdminPageState = ReturnType<typeof useAdminPage>;

type AdminConflictPanelsProps = {
  admin: Pick<AdminPageState, 'participantRoles' | 'conflictProfiles' | 'conflictChecks'>;
  forms: Pick<
    AdminConfigurationForms,
    | 'participantRoleForm'
    | 'conflictProfileForm'
    | 'conflictCheckForm'
    | 'conflictResolutionForm'
    | 'submitParticipantRole'
    | 'submitConflictProfile'
    | 'submitConflictCheck'
    | 'resolveConflict'
  >;
};

export function AdminConflictPanels({ admin, forms }: AdminConflictPanelsProps) {
  const { participantRoles, conflictProfiles, conflictChecks } = admin;
  const {
    participantRoleForm,
    conflictProfileForm,
    conflictCheckForm,
    conflictResolutionForm,
    submitParticipantRole,
    submitConflictProfile,
    submitConflictCheck,
    resolveConflict,
  } = forms;

  return (
    <>
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
          <FormField label="Conflict Query" name="admin-conflict-query" error={conflictCheckForm.formState.errors.queryText?.message} required>
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
                  <button className="button ghost" type="button" onClick={() => void resolveConflict(check.id)()}>
                    Resolve
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

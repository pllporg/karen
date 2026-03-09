import { Button } from '../../components/ui/button';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import type { AdminConfigurationForms } from './use-admin-configuration-forms';
import type { useAdminPage } from './use-admin-page';

type AdminPageState = ReturnType<typeof useAdminPage>;

type AdminReferencePanelsProps = {
  admin: Pick<AdminPageState, 'org' | 'roles' | 'users' | 'stages' | 'auditEvents' | 'customFields' | 'sections'>;
  forms: Pick<AdminConfigurationForms, 'customFieldForm' | 'sectionForm' | 'submitCustomField' | 'submitSection'>;
};

export function AdminReferencePanels({ admin, forms }: AdminReferencePanelsProps) {
  const { org, roles, users, stages, auditEvents, customFields, sections } = admin;
  const { customFieldForm, sectionForm, submitCustomField, submitSection } = forms;

  return (
    <>
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
            <li key={field.id}>
              {field.entityType}.{field.key} - {field.label}
            </li>
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
    </>
  );
}

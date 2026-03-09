import { Badge } from '../../../../components/ui/badge';
import { Checkbox } from '../../../../components/ui/checkbox';
import { FormField } from '../../../../components/ui/form-field';
import { Textarea } from '../../../../components/ui/textarea';
import { type LeadConvertPageState } from './use-lead-convert-page';

type ConvertEthicalWallSectionProps = {
  page: LeadConvertPageState;
};

export function ConvertEthicalWallSection({ page }: ConvertEthicalWallSectionProps) {
  const { form, ethicalWallEnabled, deniedUserIds, orgUsers, toggleDeniedUser } = page;
  const { register, setValue, formState } = form;
  const { errors } = formState;

  return (
    <section className="card stack-4">
      <div className="card-header">
        <div>
          <p className="card-module">Access Policy</p>
          <h2 className="type-section-title">Ethical Wall</h2>
        </div>
        <Badge tone={ethicalWallEnabled ? 'in-review' : 'default'}>
          {ethicalWallEnabled ? 'ENABLED' : 'STANDARD TEAM ACCESS'}
        </Badge>
      </div>

      <Checkbox
        checked={ethicalWallEnabled}
        onChange={(checked) =>
          setValue('ethicalWallEnabled', checked, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }
        label="Enable ethical wall review on matter creation"
      />

      <FormField label="Wall Notes" name="ethical-wall-notes" error={errors.ethicalWallNotes?.message}>
        <Textarea
          rows={3}
          {...register('ethicalWallNotes')}
          invalid={Boolean(errors.ethicalWallNotes)}
          placeholder="Reason, review notes, or staffing constraint."
        />
      </FormField>

      {ethicalWallEnabled ? (
        <div className="stack-3">
          <p className="type-label">Deny List</p>
          <p className="type-caption muted">
            The converting user remains on the matter team. Any selected user below will be denied by default.
          </p>
          <div className="convert-deny-grid">
            {orgUsers.map((membership) => (
              <Checkbox
                key={membership.id}
                checked={deniedUserIds.includes(membership.user.id)}
                onChange={(checked) => toggleDeniedUser(membership.user.id, checked)}
                label={`${membership.user.fullName || membership.user.email} · ${membership.role?.name || 'User'}`}
              />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

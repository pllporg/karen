import { Button } from '../../../../components/ui/button';
import { Checkbox } from '../../../../components/ui/checkbox';
import { FormField } from '../../../../components/ui/form-field';
import { Input } from '../../../../components/ui/input';
import { Select } from '../../../../components/ui/select';
import { Textarea } from '../../../../components/ui/textarea';
import { type LeadConvertPageState } from './use-lead-convert-page';

type ConvertParticipantsSectionProps = {
  page: LeadConvertPageState;
};

export function ConvertParticipantsSection({ page }: ConvertParticipantsSectionProps) {
  const {
    fields,
    form,
    participantRoles,
    participants,
    appendParticipant,
    removeParticipant,
  } = page;
  const { register, setValue, formState } = form;
  const { errors } = formState;

  return (
    <section className="card stack-4">
      <div className="card-header">
        <div>
          <p className="card-module">Participant Graph</p>
          <h2 className="type-section-title">Participants and Representation</h2>
        </div>
        <Button type="button" tone="secondary" onClick={appendParticipant}>
          Add Participant
        </Button>
      </div>

      {errors.participants?.message ? (
        <p className="error" role="alert">
          {errors.participants.message}
        </p>
      ) : null}

      <table className="table">
        <thead>
          <tr>
            <th>Participant</th>
            <th>Role</th>
            <th>Side</th>
            <th>Representation</th>
            <th>Primary</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field, index) => {
            const roleKey = participants?.[index]?.roleKey ?? '';
            const counselRole = /(counsel|attorney|lawyer)/i.test(roleKey);

            return (
              <tr key={field.id}>
                <td>
                  <div className="stack-2">
                    <FormField label="Name" name={`participant-${index}-name`} error={errors.participants?.[index]?.name?.message} required>
                      <Input
                        {...register(`participants.${index}.name` as const)}
                        invalid={Boolean(errors.participants?.[index]?.name)}
                      />
                    </FormField>
                    <FormField label="Notes" name={`participant-${index}-notes`} error={errors.participants?.[index]?.notes?.message}>
                      <Textarea
                        rows={2}
                        {...register(`participants.${index}.notes` as const)}
                        invalid={Boolean(errors.participants?.[index]?.notes)}
                      />
                    </FormField>
                  </div>
                </td>
                <td>
                  <FormField label="Role" name={`participant-${index}-role`} error={errors.participants?.[index]?.roleKey?.message} required>
                    <Select
                      {...register(`participants.${index}.roleKey` as const)}
                      invalid={Boolean(errors.participants?.[index]?.roleKey)}
                      onChange={(event) => {
                        const nextRoleKey = event.target.value;
                        const nextRole = participantRoles.find((role) => role.key === nextRoleKey);
                        setValue(`participants.${index}.roleKey`, nextRoleKey, {
                          shouldDirty: true,
                          shouldValidate: true,
                        });
                        if (nextRole?.sideDefault) {
                          setValue(`participants.${index}.side`, nextRole.sideDefault, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }
                        if (/(counsel|attorney|lawyer)/i.test(nextRoleKey)) {
                          setValue(`participants.${index}.representedByName`, '', {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        } else {
                          setValue(`participants.${index}.lawFirmName`, '', {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }
                      }}
                    >
                      {participantRoles.map((role) => (
                        <option key={role.id} value={role.key}>
                          {role.label}
                        </option>
                      ))}
                    </Select>
                  </FormField>
                </td>
                <td>
                  <FormField label="Side" name={`participant-${index}-side`} error={errors.participants?.[index]?.side?.message} required>
                    <Select
                      {...register(`participants.${index}.side` as const)}
                      invalid={Boolean(errors.participants?.[index]?.side)}
                    >
                      <option value="CLIENT_SIDE">Client Side</option>
                      <option value="OPPOSING_SIDE">Opposing Side</option>
                      <option value="NEUTRAL">Neutral</option>
                      <option value="COURT">Court</option>
                    </Select>
                  </FormField>
                </td>
                <td>
                  {counselRole ? (
                    <FormField
                      label="Law Firm"
                      name={`participant-${index}-law-firm`}
                      error={errors.participants?.[index]?.lawFirmName?.message}
                    >
                      <Input
                        {...register(`participants.${index}.lawFirmName` as const)}
                        invalid={Boolean(errors.participants?.[index]?.lawFirmName)}
                        placeholder="Firm or carrier counsel group"
                      />
                    </FormField>
                  ) : (
                    <FormField
                      label="Represented By"
                      name={`participant-${index}-represented-by`}
                      error={errors.participants?.[index]?.representedByName?.message}
                    >
                      <Input
                        {...register(`participants.${index}.representedByName` as const)}
                        invalid={Boolean(errors.participants?.[index]?.representedByName)}
                        placeholder="Counsel or representative name"
                      />
                    </FormField>
                  )}
                </td>
                <td>
                  <Checkbox
                    checked={Boolean(participants?.[index]?.isPrimary)}
                    onChange={(checked) =>
                      setValue(`participants.${index}.isPrimary`, checked, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    label="Primary"
                  />
                </td>
                <td>
                  <Button type="button" tone="ghost" disabled={fields.length === 1} onClick={() => removeParticipant(index)}>
                    Remove
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

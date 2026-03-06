'use client';

import { useFieldArray, useFormContext } from 'react-hook-form';
import { type IntakeWizardFormState } from '../../lib/intake/intake-wizard-adapter';
import { Button } from '../ui/button';
import { FormField } from '../ui/form-field';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import { Textarea } from '../ui/textarea';

export function WizardStepDispute() {
  const {
    control,
    register,
    formState: { errors },
  } = useFormContext<IntakeWizardFormState>();

  const defects = useFieldArray({
    control,
    name: 'dispute.defects',
  });

  const damages = useFieldArray({
    control,
    name: 'dispute.damages',
  });

  return (
    <div className="stack-5">
      <div className="form-grid-2">
        <FormField label="Contract Date" name="dispute.contractDate" error={errors.dispute?.contractDate?.message} required>
          <Input type="date" {...register('dispute.contractDate')} invalid={Boolean(errors.dispute?.contractDate)} />
        </FormField>
        <FormField label="Contract Price" name="dispute.contractPrice" error={errors.dispute?.contractPrice?.message} required>
          <Input {...register('dispute.contractPrice')} invalid={Boolean(errors.dispute?.contractPrice)} />
        </FormField>
      </div>

      <div className="stack-3">
        <div className="intake-step-section-header">
          <h2>Defects</h2>
          <Button
            type="button"
            tone="secondary"
            size="sm"
            onClick={() => defects.append({ category: '', severity: '', description: '' })}
          >
            Add Defect
          </Button>
        </div>
        {defects.fields.map((field, index) => (
          <div key={field.id} className="intake-repeatable-card stack-3">
            <div className="form-grid-2">
              <FormField
                label="Category"
                name={`dispute.defects.${index}.category`}
                error={errors.dispute?.defects?.[index]?.category?.message}
                required
              >
                <Input {...register(`dispute.defects.${index}.category`)} invalid={Boolean(errors.dispute?.defects?.[index]?.category)} />
              </FormField>
              <FormField
                label="Severity"
                name={`dispute.defects.${index}.severity`}
                error={errors.dispute?.defects?.[index]?.severity?.message}
                required
              >
                <Select
                  {...register(`dispute.defects.${index}.severity`)}
                  invalid={Boolean(errors.dispute?.defects?.[index]?.severity)}
                >
                  <option value="">Select severity</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </Select>
              </FormField>
            </div>
            <FormField
              label="Description"
              name={`dispute.defects.${index}.description`}
              error={errors.dispute?.defects?.[index]?.description?.message}
              required
            >
              <Textarea
                {...register(`dispute.defects.${index}.description`)}
                invalid={Boolean(errors.dispute?.defects?.[index]?.description)}
              />
            </FormField>
            {defects.fields.length > 1 ? (
              <div>
                <Button type="button" tone="ghost" size="sm" onClick={() => defects.remove(index)}>
                  Remove Defect
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>

      <div className="stack-3">
        <div className="intake-step-section-header">
          <h2>Damages</h2>
          <Button
            type="button"
            tone="secondary"
            size="sm"
            onClick={() => damages.append({ category: '', amount: '', description: '' })}
          >
            Add Damage
          </Button>
        </div>
        {damages.fields.map((field, index) => (
          <div key={field.id} className="intake-repeatable-card stack-3">
            <div className="form-grid-2">
              <FormField
                label="Category"
                name={`dispute.damages.${index}.category`}
                error={errors.dispute?.damages?.[index]?.category?.message}
                required
              >
                <Input {...register(`dispute.damages.${index}.category`)} invalid={Boolean(errors.dispute?.damages?.[index]?.category)} />
              </FormField>
              <FormField
                label="Amount"
                name={`dispute.damages.${index}.amount`}
                error={errors.dispute?.damages?.[index]?.amount?.message}
                required
              >
                <Input {...register(`dispute.damages.${index}.amount`)} invalid={Boolean(errors.dispute?.damages?.[index]?.amount)} />
              </FormField>
            </div>
            <FormField
              label="Description"
              name={`dispute.damages.${index}.description`}
              error={errors.dispute?.damages?.[index]?.description?.message}
            >
              <Textarea
                {...register(`dispute.damages.${index}.description`)}
                invalid={Boolean(errors.dispute?.damages?.[index]?.description)}
              />
            </FormField>
            {damages.fields.length > 1 ? (
              <div>
                <Button type="button" tone="ghost" size="sm" onClick={() => damages.remove(index)}>
                  Remove Damage
                </Button>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

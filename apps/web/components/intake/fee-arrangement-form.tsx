'use client';

import { useFormContext } from 'react-hook-form';
import { FormField } from '../ui/form-field';
import { Input } from '../ui/input';
import { Select } from '../ui/select';
import type { GenerateEngagementFormData } from '../../lib/schemas/engagement';

export function FeeArrangementForm() {
  const {
    register,
    formState: { errors },
  } = useFormContext<GenerateEngagementFormData>();

  return (
    <div className="stack-4">
      <div className="form-grid-3">
        <FormField label="Fee Type" name="engagement-fee-type" error={errors.feeType?.message} required>
          <Select {...register('feeType')} invalid={Boolean(errors.feeType)}>
            <option value="">Select fee type</option>
            <option value="HOURLY">Hourly</option>
            <option value="CONTINGENCY">Contingency</option>
            <option value="FLAT">Flat Fee</option>
          </Select>
        </FormField>
        <FormField label="Rate" name="engagement-rate" error={errors.rate?.message}>
          <Input {...register('rate', { valueAsNumber: true })} type="number" min="0" step="0.01" />
        </FormField>
        <FormField label="Retainer" name="engagement-retainer" error={errors.retainerAmount?.message}>
          <Input {...register('retainerAmount', { valueAsNumber: true })} type="number" min="0" step="0.01" />
        </FormField>
      </div>
    </div>
  );
}

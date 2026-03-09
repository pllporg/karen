'use client';

import { useFormContext } from 'react-hook-form';
import { type IntakeWizardFormState } from '../../lib/intake/intake-wizard-adapter';
import { FormField } from '../ui/form-field';
import { Input } from '../ui/input';
import { Select } from '../ui/select';

export function WizardStepProperty() {
  const {
    register,
    formState: { errors },
  } = useFormContext<IntakeWizardFormState>();

  return (
    <div className="stack-4">
      <FormField label="Address Line 1" name="property.addressLine1" error={errors.property?.addressLine1?.message} required>
        <Input {...register('property.addressLine1')} invalid={Boolean(errors.property?.addressLine1)} />
      </FormField>

      <div className="form-grid-3">
        <FormField label="City" name="property.city" error={errors.property?.city?.message} required>
          <Input {...register('property.city')} invalid={Boolean(errors.property?.city)} />
        </FormField>
        <FormField label="State" name="property.state" error={errors.property?.state?.message} required>
          <Input {...register('property.state')} invalid={Boolean(errors.property?.state)} maxLength={2} />
        </FormField>
        <FormField label="ZIP" name="property.zip" error={errors.property?.zip?.message} required>
          <Input {...register('property.zip')} invalid={Boolean(errors.property?.zip)} />
        </FormField>
      </div>

      <div className="form-grid-3">
        <FormField label="Parcel Number" name="property.parcelNumber" error={errors.property?.parcelNumber?.message}>
          <Input {...register('property.parcelNumber')} invalid={Boolean(errors.property?.parcelNumber)} />
        </FormField>
        <FormField label="Property Type" name="property.propertyType" error={errors.property?.propertyType?.message}>
          <Select {...register('property.propertyType')} invalid={Boolean(errors.property?.propertyType)}>
            <option value="">Select type</option>
            <option value="Single Family">Single Family</option>
            <option value="Townhome">Townhome</option>
            <option value="Condominium">Condominium</option>
            <option value="Multi-Family">Multi-Family</option>
          </Select>
        </FormField>
        <FormField label="Year Built" name="property.yearBuilt" error={errors.property?.yearBuilt?.message}>
          <Input {...register('property.yearBuilt')} invalid={Boolean(errors.property?.yearBuilt)} />
        </FormField>
      </div>
    </div>
  );
}

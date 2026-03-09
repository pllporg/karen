'use client';

import { useFormContext } from 'react-hook-form';
import { type IntakeWizardFormState } from '../../lib/intake/intake-wizard-adapter';
import { DuplicateAlert, type DuplicateContactMatch } from './duplicate-alert';
import { FormField } from '../ui/form-field';
import { Input } from '../ui/input';

export function WizardStepClient({
  duplicateMatches,
  onDuplicateCheck,
  onLinkExisting,
  onCreateNew,
}: {
  duplicateMatches: DuplicateContactMatch[];
  onDuplicateCheck: () => void;
  onLinkExisting: (contactId: string) => void;
  onCreateNew: () => void;
}) {
  const {
    register,
    formState: { errors },
    watch,
  } = useFormContext<IntakeWizardFormState>();

  const linkedContactId = watch('client.linkedContactId');

  return (
    <div className="stack-4">
      <div className="form-grid-2">
        <FormField label="First Name" name="client.firstName" error={errors.client?.firstName?.message} required>
          <Input {...register('client.firstName', { onBlur: onDuplicateCheck })} invalid={Boolean(errors.client?.firstName)} />
        </FormField>
        <FormField label="Last Name" name="client.lastName" error={errors.client?.lastName?.message} required>
          <Input {...register('client.lastName', { onBlur: onDuplicateCheck })} invalid={Boolean(errors.client?.lastName)} />
        </FormField>
      </div>

      <FormField label="Email" name="client.email" error={errors.client?.email?.message} required>
        <Input type="email" {...register('client.email', { onBlur: onDuplicateCheck })} invalid={Boolean(errors.client?.email)} />
      </FormField>

      <div className="form-grid-2">
        <FormField label="Phone" name="client.phone" error={errors.client?.phone?.message}>
          <Input {...register('client.phone')} invalid={Boolean(errors.client?.phone)} />
        </FormField>
        <FormField label="Company" name="client.company" error={errors.client?.company?.message}>
          <Input {...register('client.company')} invalid={Boolean(errors.client?.company)} />
        </FormField>
      </div>

      <FormField label="Role" name="client.role" error={errors.client?.role?.message}>
        <Input {...register('client.role')} invalid={Boolean(errors.client?.role)} />
      </FormField>

      <DuplicateAlert
        matches={duplicateMatches}
        linkedContactId={linkedContactId || undefined}
        onLinkExisting={onLinkExisting}
        onCreateNew={onCreateNew}
      />
    </div>
  );
}

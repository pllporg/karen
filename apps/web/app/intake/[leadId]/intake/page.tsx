'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AppShell } from '../../../../components/app-shell';
import { PageHeader } from '../../../../components/page-header';
import { StageNav } from '../../../../components/intake/stage-nav';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { createIntakeDraft } from '../../../../lib/intake/leads-api';
import { defaultIntakeWizardForm, type IntakeWizardFormState } from '../../../../lib/intake/intake-wizard-adapter';
import { intakeDraftAdapterSchema } from '../../../../lib/schemas/intake';

export default function LeadIntakeDraftPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params.leadId;
  const [status, setStatus] = useState('');
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<IntakeWizardFormState>({
    resolver: zodResolver(intakeDraftAdapterSchema),
    mode: 'onBlur',
    defaultValues: defaultIntakeWizardForm,
  });
  const fields = Object.keys(defaultIntakeWizardForm) as Array<keyof IntakeWizardFormState>;

  const submitDraft = handleSubmit(async (data) => {
    const result = await createIntakeDraft(leadId, data);
    setStatus(`Intake draft ${result.id} recorded at ${new Date().toLocaleString()}.`);
  });

  return (
    <AppShell>
      <PageHeader title="Lead Intake Draft" subtitle="Record intake payload. Stage transitions are managed by Leads API." />
      <StageNav leadId={leadId} active="intake" />
      <form className="card stack-4" onSubmit={submitDraft}>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Field</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody>
            {fields.map((field) => (
              <tr key={field}>
                <td className="mono-meta">{field}</td>
                <td className="stack-1">
                  <Input {...register(field)} invalid={Boolean(errors[field])} />
                  {errors[field]?.message ? <p className="form-field-error">{errors[field]?.message as string}</p> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="form-actions">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Working...' : 'Submit Intake Draft'}
          </Button>
        </div>
        {status ? <p className="mono-meta">{status}</p> : null}
      </form>
    </AppShell>
  );
}

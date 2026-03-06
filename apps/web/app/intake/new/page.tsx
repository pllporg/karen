'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AppShell } from '../../../components/app-shell';
import { PageHeader } from '../../../components/page-header';
import { Button } from '../../../components/ui/button';
import { FormField } from '../../../components/ui/form-field';
import { Input } from '../../../components/ui/input';
import { Textarea } from '../../../components/ui/textarea';
import { useCreateLead } from '../../../lib/hooks/use-leads';
import { createLeadSchema, type CreateLeadFormData } from '../../../lib/schemas/lead';

export default function IntakeNewLeadPage() {
  const router = useRouter();
  const [status, setStatus] = useState('');
  const { mutate, loading } = useCreateLead();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateLeadFormData>({
    resolver: zodResolver(createLeadSchema),
    mode: 'onBlur',
    defaultValues: {
      source: 'Website Form',
      notes: 'Initial queue intake created.',
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    const lead = await mutate({ source: data.source, notes: data.notes || undefined });
    setStatus(`Lead ${lead.id} created at ${new Date(lead.createdAt).toLocaleString()}.`);
    await router.push(`/intake/${lead.id}/intake`);
  });

  return (
    <AppShell>
      <PageHeader title="Create Intake Lead" subtitle="Register lead metadata before staged routing." />
      <form className="card stack-4" onSubmit={onSubmit}>
        <FormField label="Lead Source" name="source" error={errors.source?.message} required>
          <Input {...register('source')} invalid={!!errors.source} />
        </FormField>
        <FormField label="Processing Notes" name="notes" error={errors.notes?.message}>
          <Textarea {...register('notes')} invalid={!!errors.notes} />
        </FormField>
        <div className="form-actions">
          <Button type="submit" disabled={loading}>
            {loading ? 'Working...' : 'Create Lead and Open Intake'}
          </Button>
        </div>
        {status ? <p className="mono-meta">{status}</p> : null}
      </form>
    </AppShell>
  );
}

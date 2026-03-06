'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { AppShell } from '../../../../components/app-shell';
import { PageHeader } from '../../../../components/page-header';
import { StageNav } from '../../../../components/intake/stage-nav';
import { Button } from '../../../../components/ui/button';
import { FormField } from '../../../../components/ui/form-field';
import { Input } from '../../../../components/ui/input';
import { Checklist, convertLead, getSetupChecklist } from '../../../../lib/intake/leads-api';
import { convertLeadSchema, type ConvertLeadFormData } from '../../../../lib/schemas/matter';

export default function LeadConvertPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params.leadId;
  const [checklist, setChecklist] = useState<Checklist | null>(null);
  const [status, setStatus] = useState('');
  const [converting, setConverting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ConvertLeadFormData>({
    resolver: zodResolver(convertLeadSchema),
    mode: 'onBlur',
    defaultValues: {
      name: 'Kitchen Remodel Defect - Intake Conversion',
      matterNumber: 'M-2026-INT-001',
      practiceArea: 'Construction Litigation',
      caseType: '',
    },
  });

  useEffect(() => {
    getSetupChecklist(leadId).then(setChecklist).catch(() => undefined);
  }, [leadId]);

  const onConvert = handleSubmit(async (data) => {
    setConverting(true);
    try {
      const matter = await convertLead(leadId, {
        name: data.name,
        matterNumber: data.matterNumber,
        practiceArea: data.practiceArea,
      });
      setStatus(`Matter ${matter.id} created. Conversion logged at ${new Date().toLocaleString()}.`);
    } finally {
      setConverting(false);
    }
  });

  return (
    <AppShell>
      <PageHeader title="Lead Conversion" subtitle="Confirm setup checklist and convert lead to matter." />
      <StageNav leadId={leadId} active="convert" />
      <div className="card stack-4">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Checkpoint</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>Intake Draft</td><td>{checklist?.intakeDraft ? 'Complete' : 'Pending'}</td></tr>
            <tr><td>Conflict Resolved</td><td>{checklist?.conflictResolved ? 'Complete' : 'Pending'}</td></tr>
            <tr><td>Engagement Signed</td><td>{checklist?.engagementSigned ? 'Complete' : 'Pending'}</td></tr>
            <tr><td>Ready To Convert</td><td>{checklist?.readyToConvert ? 'Yes' : 'No'}</td></tr>
          </tbody>
        </table>
        <form className="stack-4" onSubmit={onConvert}>
          <div className="form-grid-3">
            <FormField label="Matter Name" name="name" error={errors.name?.message} required>
              <Input {...register('name')} invalid={!!errors.name} />
            </FormField>
            <FormField label="Matter Number" name="matterNumber" error={errors.matterNumber?.message} required>
              <Input {...register('matterNumber')} invalid={!!errors.matterNumber} />
            </FormField>
            <FormField label="Practice Area" name="practiceArea" error={errors.practiceArea?.message} required>
              <Input {...register('practiceArea')} invalid={!!errors.practiceArea} />
            </FormField>
          </div>
          <div className="form-actions">
            <Button type="submit" disabled={converting}>
              {converting ? 'Working...' : 'Convert Lead'}
            </Button>
          </div>
        </form>
        {status ? <p className="mono-meta">{status}</p> : null}
      </div>
    </AppShell>
  );
}

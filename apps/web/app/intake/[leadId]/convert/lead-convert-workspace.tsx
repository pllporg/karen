'use client';

import Link from 'next/link';
import { AppShell } from '../../../../components/app-shell';
import { StageNav } from '../../../../components/intake/stage-nav';
import { PageHeader } from '../../../../components/page-header';
import { Button } from '../../../../components/ui/button';
import { FormField } from '../../../../components/ui/form-field';
import { Input } from '../../../../components/ui/input';
import { ConvertEthicalWallSection } from './convert-ethical-wall-section';
import { ConvertGateSection } from './convert-gate-section';
import { ConvertParticipantsSection } from './convert-participants-section';
import { useLeadConvertPage } from './use-lead-convert-page';

export function LeadConvertWorkspace() {
  const page = useLeadConvertPage();
  const { checklist, leadId, loadError, loading, feedback, form } = page;
  const { register, formState } = form;
  const { errors, isSubmitting } = formState;

  return (
    <AppShell>
      <PageHeader title="Lead Conversion" subtitle="Review gate, participant seeding, and ethical wall before matter creation." />
      <StageNav leadId={leadId} active="convert" />

      {loading ? (
        <section className="card stack-3">
          <h2 className="type-section-title">Loading Conversion Workspace</h2>
          <p className="type-caption muted">Fetching checklist, participant roles, and organization users.</p>
        </section>
      ) : loadError ? (
        <section className="card stack-3">
          <h2 className="type-section-title">Conversion Workspace Unavailable</h2>
          <p className="error" role="alert">
            {loadError}
          </p>
        </section>
      ) : (
        <form className="stack-6" onSubmit={page.onConvert}>
          <ConvertGateSection page={page} />

          <section className="card stack-4">
            <div className="card-header">
              <div>
                <p className="card-module">Matter Record</p>
                <h2 className="type-section-title">Matter Details</h2>
              </div>
            </div>

            <div className="form-grid-2">
              <FormField label="Matter Name" name="matter-name" error={errors.name?.message} required>
                <Input {...register('name')} invalid={Boolean(errors.name)} />
              </FormField>
              <FormField label="Matter Number" name="matter-number" error={errors.matterNumber?.message} required>
                <Input {...register('matterNumber')} invalid={Boolean(errors.matterNumber)} />
              </FormField>
            </div>

            <div className="form-grid-3">
              <FormField label="Practice Area" name="practice-area" error={errors.practiceArea?.message} required>
                <Input {...register('practiceArea')} invalid={Boolean(errors.practiceArea)} />
              </FormField>
              <FormField label="Jurisdiction" name="jurisdiction" error={errors.jurisdiction?.message}>
                <Input {...register('jurisdiction')} invalid={Boolean(errors.jurisdiction)} />
              </FormField>
              <FormField label="Venue" name="venue" error={errors.venue?.message}>
                <Input {...register('venue')} invalid={Boolean(errors.venue)} />
              </FormField>
            </div>
          </section>

          <ConvertParticipantsSection page={page} />
          <ConvertEthicalWallSection page={page} />

          {feedback ? (
            <section className="card stack-3">
              <p className={feedback.tone === 'error' ? 'error' : 'notice'} role={feedback.tone === 'error' ? 'alert' : 'status'}>
                {feedback.message}
              </p>
              {feedback.matterId ? (
                <div className="form-actions">
                  <Link href={`/matters/${feedback.matterId}`} className="button">
                    Open Matter Dashboard
                  </Link>
                </div>
              ) : null}
            </section>
          ) : null}

          <div className="form-actions">
            <Button type="submit" disabled={!checklist?.readyToConvert || isSubmitting}>
              {isSubmitting ? 'Converting...' : 'Convert Lead to Matter'}
            </Button>
          </div>
        </form>
      )}
    </AppShell>
  );
}

'use client';

import Link from 'next/link';
import { FormProvider } from 'react-hook-form';
import { AppShell } from '../../../../components/app-shell';
import { EmptyState } from '../../../../components/empty-state';
import { EngagementPreview } from '../../../../components/intake/engagement-preview';
import { EsignStatusTracker } from '../../../../components/intake/esign-status-tracker';
import { FeeArrangementForm } from '../../../../components/intake/fee-arrangement-form';
import { StageNav } from '../../../../components/intake/stage-nav';
import { TemplatePicker } from '../../../../components/intake/template-picker';
import { LoadingState } from '../../../../components/loading-state';
import { PageHeader } from '../../../../components/page-header';
import { Button } from '../../../../components/ui/button';
import { EngagementRecipientSection } from './engagement-recipient-section';
import { templateOptions, useLeadEngagementPage } from './use-lead-engagement-page';

export function LeadEngagementWorkspace() {
  const page = useLeadEngagementPage();
  const {
    canProceed,
    envelope,
    feedback,
    feeType,
    generateForm,
    leadId,
    loadingEnvelope,
    normalizedStatus,
    onGenerate,
    rate,
    recipientEmail,
    recipientName,
    retainerAmount,
    secondaryRecipients,
    selectedTemplate,
    selectedTemplateId,
  } = page;

  return (
    <AppShell>
      <PageHeader title="Engagement Letter" subtitle="Generate, review, and send engagement documents after cleared conflicts." />
      <StageNav leadId={leadId} active="engagement" />
      <div className="card stack-5">
        <section className="stack-3">
          <div className="stack-1">
            <h2>Template</h2>
            <p className="form-field-hint">Select the approved engagement form for this intake profile.</p>
          </div>
          <TemplatePicker
            options={templateOptions}
            selectedId={selectedTemplateId}
            onSelect={(templateId) => generateForm.setValue('templateId', templateId, { shouldDirty: true, shouldValidate: true })}
          />
        </section>

        <FormProvider {...generateForm}>
          <form className="stack-4" onSubmit={onGenerate}>
            <section className="stack-3">
              <div className="stack-1">
                <h2>Fee Arrangement</h2>
                <p className="form-field-hint">Review fee structure before generating the engagement packet.</p>
              </div>
              <FeeArrangementForm />
            </section>
            <div className="form-actions">
              <Button type="submit" disabled={generateForm.formState.isSubmitting}>
                {generateForm.formState.isSubmitting ? 'Generating...' : 'Generate Engagement Letter'}
              </Button>
            </div>
          </form>
        </FormProvider>

        <EngagementRecipientSection page={page} />

        <section className="stack-3">
          <div className="row-between">
            <div className="stack-1">
              <h2>Envelope Status</h2>
              <p className="form-field-hint">Engagement must be signed before conversion can proceed.</p>
            </div>
            {envelope ? <span className="mono-meta">Envelope {envelope.id}</span> : null}
          </div>

          {loadingEnvelope ? <LoadingState label="Loading engagement status..." /> : null}
          {!loadingEnvelope && !envelope ? (
            <EmptyState message="No envelope generated yet. Generate an engagement packet to begin the e-sign lifecycle." />
          ) : null}
          {envelope ? (
            <>
              <EsignStatusTracker status={normalizedStatus} />
              <EngagementPreview
                envelope={envelope}
                templateName={selectedTemplate.name}
                feeType={feeType}
                rate={typeof rate === 'number' ? rate : undefined}
                retainerAmount={typeof retainerAmount === 'number' ? retainerAmount : undefined}
                recipientName={recipientName}
                recipientEmail={recipientEmail}
                secondaryRecipients={secondaryRecipients}
              />
            </>
          ) : null}
        </section>

        <div className="conflict-gate">
          <div className="stack-1">
            <h3>Gate</h3>
            <p className="form-field-hint">Proceed to conversion only when the latest envelope is signed.</p>
            <p className="mono-meta">
              {canProceed
                ? 'Signed engagement on file.'
                : envelope
                  ? `Current status: ${normalizedStatus}. Conversion remains locked.`
                  : 'Generate and send an envelope before conversion.'}
            </p>
          </div>
          {canProceed ? (
            <Link className="button" href={`/intake/${leadId}/convert`}>
              Proceed to Convert
            </Link>
          ) : (
            <Button type="button" disabled>
              Proceed to Convert
            </Button>
          )}
        </div>

        {feedback ? (
          <p className={feedback.tone === 'error' ? 'error' : 'notice'} role={feedback.tone === 'error' ? 'alert' : 'status'}>
            {feedback.message}
          </p>
        ) : null}
      </div>
    </AppShell>
  );
}

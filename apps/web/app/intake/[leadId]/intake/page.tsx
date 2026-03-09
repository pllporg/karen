'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormProvider, useForm, type FieldPath } from 'react-hook-form';
import { AppShell } from '../../../../components/app-shell';
import { PageHeader } from '../../../../components/page-header';
import { WizardStepClient } from '../../../../components/intake/wizard-step-client';
import { Button } from '../../../../components/ui/button';
import { Stepper, type StepperStep } from '../../../../components/ui/stepper';
import { apiFetch } from '../../../../lib/api';
import { createIntakeDraft } from '../../../../lib/intake/leads-api';
import { defaultIntakeWizardForm, suggestUploadCategory, type IntakeWizardFormState } from '../../../../lib/intake/intake-wizard-adapter';
import { intakeWizardSchema, type IntakeWizardStepKey } from '../../../../lib/schemas/intake';
import { type Contact } from '../../../../lib/types/contact';
import { type DuplicateContactMatch } from '../../../../components/intake/duplicate-alert';

type FeedbackState = {
  tone: 'notice' | 'error';
  message: string;
};

const WizardStepProperty = dynamic(
  () => import('../../../../components/intake/wizard-step-property').then((module) => module.WizardStepProperty),
  {
    loading: () => <DeferredStepPanel stepLabel="PROPERTY" />,
  },
);

const WizardStepDispute = dynamic(
  () => import('../../../../components/intake/wizard-step-dispute').then((module) => module.WizardStepDispute),
  {
    loading: () => <DeferredStepPanel stepLabel="DISPUTE" />,
  },
);

const WizardStepUploads = dynamic(
  () => import('../../../../components/intake/wizard-step-uploads').then((module) => module.WizardStepUploads),
  {
    loading: () => <DeferredStepPanel stepLabel="UPLOADS" />,
  },
);

const WizardStepReview = dynamic(
  () => import('../../../../components/intake/wizard-step-review').then((module) => module.WizardStepReview),
  {
    loading: () => <DeferredStepPanel stepLabel="REVIEW" />,
  },
);

const MAX_UPLOAD_SIZE_BYTES = 50 * 1024 * 1024;

const steps: Array<{ key: IntakeWizardStepKey; label: string }> = [
  { key: 'client', label: 'CLIENT' },
  { key: 'property', label: 'PROPERTY' },
  { key: 'dispute', label: 'DISPUTE' },
  { key: 'uploads', label: 'UPLOADS' },
  { key: 'review', label: 'REVIEW' },
];

function makeLocalId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `upload-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function formatSavedAt(value: string | null) {
  if (!value) return 'Draft not yet saved';
  return `Draft saved ${new Date(value).toLocaleTimeString()}`;
}

function DeferredStepPanel({ stepLabel }: { stepLabel: string }) {
  return (
    <div className="card stack-2" role="status" aria-live="polite">
      <p className="meta-note">Step Load</p>
      <h3 style={{ marginTop: 0 }}>{stepLabel}</h3>
      <p style={{ color: 'var(--lic-text-muted)' }}>Loading staged intake controls.</p>
    </div>
  );
}

function buildDuplicateMatch(contact: Contact, values: IntakeWizardFormState['client']): DuplicateContactMatch {
  const emailMatch = values.email && contact.email && values.email.toLowerCase() === contact.email.toLowerCase();
  const nameMatch =
    values.firstName &&
    values.lastName &&
    contact.firstName.toLowerCase() === values.firstName.toLowerCase() &&
    contact.lastName.toLowerCase() === values.lastName.toLowerCase();

  const confidence = emailMatch ? 97 : nameMatch ? 87 : 72;
  const rationale = emailMatch
    ? 'Exact email match found in contacts.'
    : nameMatch
      ? 'Exact first and last name match found in contacts.'
      : 'Potential contact match based on search query.';

  return {
    id: contact.id,
    label: [contact.firstName, contact.lastName].filter(Boolean).join(' '),
    rationale,
    confidence,
  };
}

function getStepFieldPaths(values: IntakeWizardFormState, step: IntakeWizardStepKey): FieldPath<IntakeWizardFormState>[] {
  switch (step) {
    case 'client':
      return ['client.firstName', 'client.lastName', 'client.email'];
    case 'property':
      return ['property.addressLine1', 'property.city', 'property.state', 'property.zip'];
    case 'dispute':
      return [
        'dispute.contractDate',
        'dispute.contractPrice',
        ...values.dispute.defects.flatMap((_, index) => [
          `dispute.defects.${index}.category`,
          `dispute.defects.${index}.severity`,
          `dispute.defects.${index}.description`,
        ]),
        ...values.dispute.damages.flatMap((_, index) => [
          `dispute.damages.${index}.category`,
          `dispute.damages.${index}.amount`,
        ]),
      ] as FieldPath<IntakeWizardFormState>[];
    case 'uploads':
    case 'review':
      return [];
    default:
      return [];
  }
}

export default function LeadIntakeDraftPage() {
  const params = useParams<{ leadId: string }>();
  const leadId = params.leadId;
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [duplicateMatches, setDuplicateMatches] = useState<DuplicateContactMatch[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<IntakeWizardFormState>({
    resolver: zodResolver(intakeWizardSchema),
    defaultValues: defaultIntakeWizardForm,
    mode: 'onBlur',
  });

  const {
    getValues,
    handleSubmit,
    setValue,
    trigger,
    watch,
    formState: { isSubmitting },
  } = form;

  const currentStep = steps[activeStepIndex];
  const values = watch();

  const stepStates = useMemo<StepperStep[]>(
    () =>
      steps.map((step, index) => ({
        label: step.label,
        status:
          index < activeStepIndex ? 'complete' : index === activeStepIndex ? 'active' : submitted && step.key === 'review' ? 'complete' : 'pending',
      })),
    [activeStepIndex, submitted],
  );

  const persistDraft = async (message: string) => {
    const response = await createIntakeDraft(leadId, getValues());
    const timestamp = new Date().toISOString();
    setLastSavedAt(timestamp);
    setFeedback({
      tone: 'notice',
      message: `${message} ${response.id} recorded at ${new Date(timestamp).toLocaleString()}.`,
    });
  };

  const handleDuplicateCheck = async () => {
    const client = getValues('client');
    const query = client.email || `${client.firstName} ${client.lastName}`.trim();

    if (query.trim().length < 3) {
      setDuplicateMatches([]);
      return;
    }

    try {
      const contacts = await apiFetch<Contact[]>(`/contacts?search=${encodeURIComponent(query)}`);
      setDuplicateMatches(contacts.slice(0, 3).map((contact) => buildDuplicateMatch(contact, client)));
    } catch {
      setDuplicateMatches([]);
    }
  };

  const handleFilesSelected = (files: File[]) => {
    setUploadError(null);

    const oversized = files.find((file) => file.size > MAX_UPLOAD_SIZE_BYTES);
    if (oversized) {
      setUploadError(`"${oversized.name}" exceeds the 50MB draft upload limit.`);
      return;
    }

    const nextUploads = files.map((file) => ({
      id: makeLocalId(),
      name: file.name,
      sizeBytes: file.size,
      category: suggestUploadCategory(file.name),
      status: 'COMPLETE' as const,
    }));

    setValue('uploads', [...getValues('uploads'), ...nextUploads], { shouldDirty: true });
  };

  const handleSaveDraft = async () => {
    setFeedback(null);
    try {
      await persistDraft('Draft');
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to save draft.',
      });
    }
  };

  const handleBack = async () => {
    if (activeStepIndex === 0) return;

    await handleSaveDraft();
    setActiveStepIndex((value) => Math.max(0, value - 1));
  };

  const handleContinue = async () => {
    const fieldPaths = getStepFieldPaths(getValues(), currentStep.key);
    const valid = fieldPaths.length ? await trigger(fieldPaths) : true;
    if (!valid) return;

    try {
      await persistDraft('Draft');
      setActiveStepIndex((value) => Math.min(steps.length - 1, value + 1));
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to advance intake draft.',
      });
    }
  };

  const submitWizard = handleSubmit(async () => {
    setFeedback(null);

    try {
      await persistDraft('Intake draft');
      setSubmitted(true);
      setActiveStepIndex(steps.length - 1);
      setFeedback({
        tone: 'notice',
        message: `Intake draft submitted for lead ${leadId}. Proceed to conflict review when ready.`,
      });
    } catch (error) {
      setFeedback({
        tone: 'error',
        message: error instanceof Error ? error.message : 'Unable to submit intake draft.',
      });
    }
  });

  return (
    <AppShell>
      <PageHeader
        title="Lead Intake"
        subtitle="Capture client, property, dispute, and staged file metadata before conflict review."
        right={<span className="mono-meta">{formatSavedAt(lastSavedAt)}</span>}
      />

      <div className="card stack-5">
        <Stepper
          steps={stepStates}
          onStepClick={(index) => {
            if (index <= activeStepIndex) setActiveStepIndex(index);
          }}
        />

        <div className="intake-wizard-panel stack-4">
          <div className="stack-2">
            <h2>{currentStep.label}</h2>
            <p className="form-field-hint">Step {activeStepIndex + 1} of {steps.length}</p>
          </div>

          <FormProvider {...form}>
            {currentStep.key === 'client' ? (
              <WizardStepClient
                duplicateMatches={duplicateMatches}
                onDuplicateCheck={handleDuplicateCheck}
                onLinkExisting={(contactId) => setValue('client.linkedContactId', contactId, { shouldDirty: true })}
                onCreateNew={() => setValue('client.linkedContactId', '', { shouldDirty: true })}
              />
            ) : null}

            {currentStep.key === 'property' ? <WizardStepProperty /> : null}
            {currentStep.key === 'dispute' ? <WizardStepDispute /> : null}
            {currentStep.key === 'uploads' ? (
              <WizardStepUploads
                uploadError={uploadError}
                onFilesSelected={handleFilesSelected}
                onRemoveUpload={(uploadId) =>
                  setValue(
                    'uploads',
                    getValues('uploads').filter((upload) => upload.id !== uploadId),
                    { shouldDirty: true },
                  )
                }
              />
            ) : null}
            {currentStep.key === 'review' ? (
              <WizardStepReview
                values={values}
                onEditStep={(stepKey: IntakeWizardStepKey) => {
                  const nextIndex = steps.findIndex((step) => step.key === stepKey);
                  if (nextIndex >= 0) setActiveStepIndex(nextIndex);
                }}
              />
            ) : null}
          </FormProvider>
        </div>

        {feedback ? (
          <p className={feedback.tone === 'error' ? 'error' : 'notice'} role={feedback.tone === 'error' ? 'alert' : 'status'}>
            {feedback.message}
          </p>
        ) : null}

        <div className="intake-wizard-footer">
          <div className="inline-stack">
            <Button type="button" tone="ghost" onClick={handleBack} disabled={activeStepIndex === 0 || isSubmitting}>
              Back
            </Button>
            <Button type="button" tone="secondary" onClick={handleSaveDraft} disabled={isSubmitting}>
              Save Draft
            </Button>
          </div>

          <div className="inline-stack">
            {currentStep.key === 'review' ? (
              <>
                {submitted ? (
                  <Link className="button ghost" href={`/intake/${leadId}/conflict`}>
                    Proceed to Conflict Check
                  </Link>
                ) : null}
                <Button type="button" onClick={submitWizard} disabled={isSubmitting}>
                  {isSubmitting ? 'Submitting...' : 'Submit Intake'}
                </Button>
              </>
            ) : (
              <Button type="button" onClick={handleContinue} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Continue'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}

import { Button } from '../../../../components/ui/button';
import { FormField } from '../../../../components/ui/form-field';
import { Input } from '../../../../components/ui/input';
import { type LeadEngagementPageState } from './use-lead-engagement-page';

type EngagementRecipientSectionProps = {
  page: LeadEngagementPageState;
};

export function EngagementRecipientSection({ page }: EngagementRecipientSectionProps) {
  const { fields, sendForm, onSend, envelope, refreshEnvelope, addSecondaryRecipient, removeSecondaryRecipient } = page;

  return (
    <form className="stack-4" onSubmit={onSend}>
      <section className="stack-3">
        <div className="stack-1">
          <h2>Recipients</h2>
          <p className="form-field-hint">These recipients are stored in the envelope payload for attorney review.</p>
        </div>
        <div className="form-grid-2">
          <FormField label="Recipient Name" name="engagement-recipient-name" error={sendForm.formState.errors.recipientName?.message} required>
            <Input {...sendForm.register('recipientName')} invalid={Boolean(sendForm.formState.errors.recipientName)} />
          </FormField>
          <FormField label="Recipient Email" name="engagement-recipient-email" error={sendForm.formState.errors.recipientEmail?.message} required>
            <Input {...sendForm.register('recipientEmail')} type="email" invalid={Boolean(sendForm.formState.errors.recipientEmail)} />
          </FormField>
        </div>

        <div className="stack-3">
          <div className="row-between">
            <div className="stack-1">
              <h3>Secondary Recipients</h3>
              <p className="form-field-hint">Add co-clients or copied recipients before dispatch.</p>
            </div>
            <Button type="button" tone="ghost" onClick={addSecondaryRecipient}>
              Add Secondary Recipient
            </Button>
          </div>

          {fields.length ? (
            <div className="stack-2">
              {fields.map((field, index) => (
                <div key={field.id} className="engagement-secondary-row">
                  <FormField
                    label={`Secondary Recipient ${index + 1} Name`}
                    name={`engagement-secondary-name-${index}`}
                    error={sendForm.formState.errors.secondaryRecipients?.[index]?.name?.message}
                    required
                  >
                    <Input
                      {...sendForm.register(`secondaryRecipients.${index}.name`)}
                      invalid={Boolean(sendForm.formState.errors.secondaryRecipients?.[index]?.name)}
                    />
                  </FormField>
                  <FormField
                    label={`Secondary Recipient ${index + 1} Email`}
                    name={`engagement-secondary-email-${index}`}
                    error={sendForm.formState.errors.secondaryRecipients?.[index]?.email?.message}
                    required
                  >
                    <Input
                      {...sendForm.register(`secondaryRecipients.${index}.email`)}
                      type="email"
                      invalid={Boolean(sendForm.formState.errors.secondaryRecipients?.[index]?.email)}
                    />
                  </FormField>
                  <Button type="button" tone="danger" onClick={() => removeSecondaryRecipient(index)}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="form-actions">
          <Button type="submit" tone="secondary" disabled={sendForm.formState.isSubmitting || !envelope}>
            {sendForm.formState.isSubmitting ? 'Sending...' : 'Send Envelope'}
          </Button>
          <Button type="button" tone="ghost" onClick={() => void refreshEnvelope()}>
            Refresh Status
          </Button>
        </div>
      </section>
    </form>
  );
}

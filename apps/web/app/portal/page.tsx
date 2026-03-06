'use client';

import { AppShell } from '../../components/app-shell';
import { ConfirmDialog } from '../../components/confirm-dialog';
import { PageHeader } from '../../components/page-header';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { usePortalPage } from './use-portal-page';

export default function PortalPage() {
  const {
    snapshot,
    matterOptions,
    intakeFormOptions,
    engagementTemplateOptions,
    error,
    confirmAction,
    confirmBusy,
    registerMessage,
    registerWorkflow,
    messageMatterId,
    intakeFormDefinitionId,
    engagementLetterTemplateId,
    eSignProvider,
    syncSelectedMatter,
    sendPortalMessage,
    downloadPortalAttachment,
    submitIntake,
    createEsignEnvelope,
    confirmClientAction,
    refreshEsignEnvelope,
    setConfirmAction,
    formatMatterLabel,
    formatDocumentMetadata,
  } = usePortalPage();

  const messageMatterRegistration = registerMessage('matterId');

  return (
    <AppShell>
      <PageHeader title="Client Portal" subtitle="Portal-only experience: matter status, dates, invoices/payments, secure messages, shared docs." />
      <div className="card-grid">
        <div className="card">
          <h3>Matters</h3>
          <p>{snapshot?.matters?.length || 0} visible matters</p>
        </div>
        <div className="card">
          <h3>Key Dates</h3>
          <p>{snapshot?.keyDates?.length || 0} upcoming dates</p>
        </div>
        <div className="card">
          <h3>Invoices</h3>
          <p>{snapshot?.invoices?.length || 0} invoices</p>
        </div>
        <div className="card">
          <h3>Shared Documents</h3>
          <p>{snapshot?.documents?.length || 0} shared docs</p>
        </div>
        <div className="card">
          <h3>E-Sign Envelopes</h3>
          <p>{snapshot?.eSignEnvelopes?.length || 0} envelopes</p>
        </div>

        <div className="card col-full">
          <h3>Secure Message</h3>
          <form onSubmit={sendPortalMessage} className="grid-4">
            <Select
              aria-label="Portal Matter"
              {...messageMatterRegistration}
              value={messageMatterId}
              onChange={(event) => {
                messageMatterRegistration.onChange(event);
                syncSelectedMatter(event.target.value);
              }}
            >
              <option value="">Select matter</option>
              {matterOptions.map((matter) => (
                <option key={matter.id} value={matter.id}>
                  {formatMatterLabel(matter)}
                </option>
              ))}
            </Select>
            <Input placeholder="Message" {...registerMessage('message')} />
            <Input placeholder="Attachment Title (optional)" {...registerMessage('attachmentTitle')} />
            <Input aria-label="Attachment File" type="file" {...registerMessage('attachmentFile')} />
            <Button type="submit" disabled={confirmBusy}>
              Send
            </Button>
          </form>
          {error ? <p className="error mt-2">{error}</p> : null}
          <p className="mono-meta mt-2">External client sends require explicit approval and are logged in audit history.</p>
        </div>

        <div className="card col-full">
          <h3>Shared Documents</h3>
          {(snapshot?.documents || []).length === 0 ? <p>No shared documents yet.</p> : null}
          {(snapshot?.documents || []).map((doc) => (
            <div key={doc.id} className="row-between mb-2">
              <div>
                <strong>{doc.title}</strong>
                <div className="type-caption">{formatDocumentMetadata(doc)}</div>
              </div>
              {doc.latestVersion?.id ? (
                <Button tone="ghost" type="button" onClick={() => downloadPortalAttachment(doc.latestVersion?.id || '')}>
                  Download
                </Button>
              ) : null}
            </div>
          ))}
        </div>

        <div className="card col-full">
          <h3>Portal Messages</h3>
          {(snapshot?.messages || []).length === 0 ? <p>No portal messages yet.</p> : null}
          {(snapshot?.messages || []).map((entry) => (
            <div key={entry.id} className="mb-3">
              <div className="type-body">{entry.subject || 'Portal message'}</div>
              <div className="mt-1">{entry.body}</div>
              {(entry.attachments || []).map((attachment) => (
                <Button
                  key={attachment.documentVersionId}
                  tone="ghost"
                  type="button"
                  className="mt-2"
                  onClick={() => downloadPortalAttachment(attachment.documentVersionId)}
                >
                  Download {attachment.title}
                </Button>
              ))}
            </div>
          ))}
        </div>

        <div className="card col-full">
          <h3>Intake + E-Sign</h3>
          <div className="grid-2">
            <Select aria-label="Portal Intake Form" {...registerWorkflow('intakeFormDefinitionId')} value={intakeFormDefinitionId}>
              <option value="">Select intake form</option>
              {intakeFormOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>
            <Button tone="ghost" type="button" onClick={submitIntake}>
              Submit Intake
            </Button>
            <Select
              aria-label="Portal Engagement Template"
              {...registerWorkflow('engagementLetterTemplateId')}
              value={engagementLetterTemplateId}
            >
              <option value="">Select engagement template</option>
              {engagementTemplateOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </Select>
            <Select aria-label="E-Sign Provider" {...registerWorkflow('eSignProvider')} value={eSignProvider}>
              <option value="stub">Stub Provider</option>
              <option value="sandbox">Sandbox Provider</option>
            </Select>
            <Button tone="ghost" type="button" onClick={createEsignEnvelope} disabled={confirmBusy}>
              Create E-Sign Envelope
            </Button>
          </div>
          <div className="mt-3">
            {(snapshot?.eSignEnvelopes || []).length === 0 ? <p>No e-sign envelopes yet.</p> : null}
            {(snapshot?.eSignEnvelopes || []).map((envelope) => (
              <div key={envelope.id} className="row-between mb-2">
                <div>
                  <strong>{envelope.engagementLetterTemplate?.name || 'Engagement Letter'}</strong>
                  <div className="type-caption">
                    Status: {envelope.status} | Provider: {envelope.provider}
                  </div>
                </div>
                <Button tone="ghost" type="button" onClick={() => refreshEsignEnvelope(envelope.id)}>
                  Refresh Status
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmAction !== null}
        title={confirmAction === 'create-esign' ? 'Confirm E-Sign Envelope Dispatch' : 'Confirm Client Message Send'}
        description={
          confirmAction === 'create-esign'
            ? 'Approving this action dispatches an external envelope workflow to the selected provider and cannot be silently undone.'
            : 'Approving this action sends the portal message to the client for matter review. Verify content and attachments before proceeding.'
        }
        confirmLabel="Approve Send"
        cancelLabel="Return to Review"
        busy={confirmBusy}
        onCancel={() => {
          if (!confirmBusy) setConfirmAction(null);
        }}
        onConfirm={confirmClientAction}
      />
    </AppShell>
  );
}

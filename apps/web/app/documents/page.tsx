'use client';

import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { Button } from '../../components/ui/button';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { useDocumentsPage } from './use-documents-page';

export default function DocumentsPage() {
  const {
    documents,
    matterOptions,
    retentionPolicies,
    dispositionRuns,
    retentionStatus,
    registerUpload,
    registerPdf,
    registerRetention,
    uploadErrors,
    retentionErrors,
    uploading,
    generatingPdf,
    creatingPolicy,
    upload,
    generatePdf,
    createRetentionPolicy,
    assignRetentionPolicy,
    placeLegalHold,
    releaseLegalHold,
    loadRetentionData,
    createDispositionRun,
    approveDispositionRun,
    executeDispositionRun,
    resolveMatterLabel,
  } = useDocumentsPage();

  return (
    <AppShell>
      <PageHeader title="Documents" subtitle="Secure upload/versioning, malware-scan hook, signed links, and share links." />

      <div className="card mb-3 stack-3">
        <form onSubmit={upload} className="grid-4">
          <FormField label="Upload Matter" name="upload-matter" error={uploadErrors.matterId?.message}>
            <Select aria-label="Upload Matter" {...registerUpload('matterId')} invalid={!!uploadErrors.matterId}>
              <option value="">Select matter</option>
              {matterOptions.map((matter) => (
                <option key={matter.id} value={matter.id}>
                  {matter.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Title" name="upload-title" error={uploadErrors.title?.message} required>
            <Input placeholder="Title" {...registerUpload('title')} invalid={!!uploadErrors.title} />
          </FormField>
          <FormField label="File" name="upload-file" error={uploadErrors.file?.message as string | undefined} required>
            <Input type="file" {...registerUpload('file')} />
          </FormField>
          <div className="stack-2">
            <p className="type-label">Upload</p>
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Working...' : 'Upload'}
            </Button>
          </div>
        </form>

        <form onSubmit={generatePdf} className="grid-2">
          <FormField label="PDF Matter" name="pdf-matter">
            <Select aria-label="PDF Matter" {...registerPdf('matterId')}>
              <option value="">Select matter for generated PDF</option>
              {matterOptions.map((matter) => (
                <option key={matter.id} value={matter.id}>
                  {matter.label}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="stack-2">
            <p className="type-label">PDF Draft</p>
            <Button tone="secondary" type="submit" disabled={generatingPdf}>
              {generatingPdf ? 'Working...' : 'Generate PDF Draft'}
            </Button>
          </div>
        </form>
      </div>

      <div className="card mb-3 stack-3">
        <h3>Retention + Legal Hold</h3>

        <form onSubmit={createRetentionPolicy} className="grid-4">
          <FormField label="Retention Policy Name" name="retention-policy-name" error={retentionErrors.policyName?.message} required>
            <Input
              placeholder="Retention policy name"
              {...registerRetention('policyName')}
              invalid={!!retentionErrors.policyName}
            />
          </FormField>
          <FormField label="Retention Scope" name="retention-policy-scope" error={retentionErrors.policyScope?.message} required>
            <Select aria-label="Retention Scope" {...registerRetention('policyScope')} invalid={!!retentionErrors.policyScope}>
              <option value="ALL_DOCUMENTS">All Documents</option>
              <option value="MATTER">Matter</option>
              <option value="CATEGORY">Category</option>
            </Select>
          </FormField>
          <FormField label="Retention Trigger" name="retention-policy-trigger" error={retentionErrors.policyTrigger?.message} required>
            <Select aria-label="Retention Trigger" {...registerRetention('policyTrigger')} invalid={!!retentionErrors.policyTrigger}>
              <option value="DOCUMENT_UPLOADED">Document Uploaded</option>
              <option value="MATTER_CLOSED">Matter Closed</option>
            </Select>
          </FormField>
          <FormField label="Retention Days" name="retention-policy-days" error={retentionErrors.policyRetentionDays?.message} required>
            <Input
              aria-label="Retention Days"
              placeholder="Days"
              {...registerRetention('policyRetentionDays')}
              invalid={!!retentionErrors.policyRetentionDays}
            />
          </FormField>
          <div className="stack-2">
            <p className="type-label">Create</p>
            <Button type="submit" disabled={creatingPolicy}>
              {creatingPolicy ? 'Working...' : 'Create Policy'}
            </Button>
          </div>
        </form>

        <div className="grid-3">
          <FormField label="Retention Policy Select" name="retention-policy-select">
            <Select aria-label="Retention Policy Select" {...registerRetention('selectedPolicyId')}>
              <option value="">Select retention policy</option>
              {retentionPolicies.map((policy) => (
                <option key={policy.id} value={policy.id}>
                  {policy.name} ({policy.scope}, {policy.retentionDays}d)
                </option>
              ))}
            </Select>
          </FormField>
          <div className="stack-2">
            <p className="type-label">Load</p>
            <Button tone="secondary" type="button" onClick={loadRetentionData}>
              Load Retention Data
            </Button>
          </div>
          <div className="stack-2">
            <p className="type-label">Disposition</p>
            <Button tone="secondary" type="button" onClick={createDispositionRun}>
              Create Disposition Run
            </Button>
          </div>
        </div>

        {retentionStatus ? <p className="type-caption muted">{retentionStatus}</p> : null}
      </div>

      <div className="card mb-3">
        <table aria-label="Data table" className="table">
          <thead>
            <tr>
              <th scope="col">Title</th>
              <th scope="col">Matter</th>
              <th scope="col">Versions</th>
              <th scope="col">Shared</th>
              <th scope="col">Retention</th>
              <th scope="col">Legal Hold</th>
              <th scope="col">Disposition</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.map((doc) => (
              <tr key={doc.id}>
                <td>{doc.title}</td>
                <td>{doc.matter?.name || resolveMatterLabel(doc.matterId)}</td>
                <td>{doc.versions?.length || 0}</td>
                <td>{doc.sharedWithClient ? 'Yes' : 'No'}</td>
                <td>{doc.retentionPolicy?.name || 'Unassigned'}</td>
                <td>{doc.legalHoldActive ? 'Active' : 'None'}</td>
                <td>{doc.dispositionStatus || 'ACTIVE'}</td>
                <td>
                  <div className="row-1">
                    <Button tone="secondary" type="button" onClick={() => assignRetentionPolicy(doc.id)}>
                      Assign Policy
                    </Button>
                    {doc.legalHoldActive ? (
                      <Button tone="secondary" type="button" onClick={() => releaseLegalHold(doc.id)}>
                        Release Hold
                      </Button>
                    ) : (
                      <Button tone="secondary" type="button" onClick={() => placeLegalHold(doc.id)}>
                        Place Hold
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Disposition Runs</h3>
        <table aria-label="Data table" className="table">
          <thead>
            <tr>
              <th scope="col">Run</th>
              <th scope="col">Status</th>
              <th scope="col">Cutoff</th>
              <th scope="col">Items</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {dispositionRuns.map((run, index) => (
              <tr key={run.id}>
                <td>{`Run ${index + 1}`}</td>
                <td>{run.status}</td>
                <td>{new Date(run.cutoffAt).toLocaleString()}</td>
                <td>{run.items?.length || 0}</td>
                <td>
                  <div className="row-1">
                    {run.status === 'DRAFT' || run.status === 'PENDING_APPROVAL' ? (
                      <Button tone="secondary" type="button" onClick={() => approveDispositionRun(run.id)}>
                        Approve
                      </Button>
                    ) : null}
                    {run.status === 'APPROVED' ? (
                      <Button tone="secondary" type="button" onClick={() => executeDispositionRun(run.id)}>
                        Execute
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

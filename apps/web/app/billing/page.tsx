'use client';

import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { Button } from '../../components/ui/button';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { useBillingPage } from './use-billing-page';

export default function BillingPage() {
  const {
    invoices,
    trustRows,
    reconciliationRuns,
    ledesProfiles,
    ledesJobs,
    matterOptions,
    trustAccountOptions,
    invoiceOptions,
    invoiceStatus,
    reconciliationStatus,
    selectedLedesInvoiceIds,
    ledesStatus,
    registerInvoice,
    registerReconciliation,
    registerLedesProfile,
    registerLedesJob,
    getInvoiceValues,
    invoiceErrors,
    reconciliationErrors,
    ledesProfileErrors,
    ledesJobErrors,
    creatingInvoice,
    creatingReconciliation,
    creatingLedesProfile,
    creatingLedesJob,
    createInvoice,
    createReconciliationRun,
    submitRun,
    resolveDiscrepancy,
    completeRun,
    createLedesProfile,
    createLedesJob,
    addSelectedLedesInvoice,
    removeSelectedLedesInvoice,
    downloadLedesJob,
    resolveMatterLabel,
    setInvoiceStatus,
  } = useBillingPage();

  return (
    <AppShell>
      <PageHeader title="Billing & Trust" subtitle="Time/expense capture, invoice PDF, Stripe checkout links, trust ledger, and AR visibility." />

      <div className="notice mb-3">
        Jurisdiction compliance disclaimer is stored on invoices. Attorney remains responsible for trust/billing compliance.
      </div>

      <div className="card mb-3">
        <form onSubmit={createInvoice} className="grid-2">
          <FormField label="Invoice Matter" name="invoice-matter" error={invoiceErrors.matterId?.message} required>
            <Select aria-label="Invoice Matter" {...registerInvoice('matterId')} invalid={!!invoiceErrors.matterId}>
              <option value="">Select matter</option>
              {matterOptions.map((matter) => (
                <option key={matter.id} value={matter.id}>
                  {matter.label}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="stack-2">
            <p className="type-label">Create Invoice</p>
            <Button
              type="submit"
              disabled={creatingInvoice}
              onClick={() => {
                if (!getInvoiceValues('matterId')) {
                  setInvoiceStatus('Select a matter before creating an invoice.');
                }
              }}
            >
              {creatingInvoice ? 'Working...' : 'Create Invoice'}
            </Button>
          </div>
        </form>
        {invoiceStatus ? <p className="type-caption muted mt-2">{invoiceStatus}</p> : null}
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">#</th>
              <th scope="col">Matter</th>
              <th scope="col">Status</th>
              <th scope="col">Total</th>
              <th scope="col">Balance</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id}>
                <td>{invoice.invoiceNumber}</td>
                <td>{invoice.matter?.name || resolveMatterLabel(invoice.matterId)}</td>
                <td>{invoice.status}</td>
                <td>${invoice.total}</td>
                <td>${invoice.balanceDue}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card mt-3 stack-3">
        <h3>Trust Ledger</h3>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Trust Account</th>
              <th scope="col">Matter</th>
              <th scope="col">Balance</th>
            </tr>
          </thead>
          <tbody>
            {trustRows.map((row) => (
              <tr key={row.id}>
                <td>{row.trustAccount?.name || row.trustAccountId}</td>
                <td>{row.matter?.name || row.matterId}</td>
                <td>${row.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card mt-3 stack-3">
        <h3>Trust Reconciliation Runs</h3>
        <form onSubmit={createReconciliationRun} className="grid-4">
          <FormField label="Reconciliation Trust Account" name="reconciliation-trust-account">
            <Select aria-label="Reconciliation Trust Account" {...registerReconciliation('trustAccountId')}>
              <option value="">All trust accounts</option>
              {trustAccountOptions.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.label}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Statement Start" name="statement-start" error={reconciliationErrors.statementStartAt?.message}>
            <Input type="date" aria-label="Statement Start" {...registerReconciliation('statementStartAt')} />
          </FormField>
          <FormField label="Statement End" name="statement-end" error={reconciliationErrors.statementEndAt?.message}>
            <Input type="date" aria-label="Statement End" {...registerReconciliation('statementEndAt')} />
          </FormField>
          <div className="stack-2">
            <p className="type-label">Run</p>
            <Button tone="secondary" type="submit" disabled={creatingReconciliation}>
              {creatingReconciliation ? 'Working...' : 'Create Reconciliation Run'}
            </Button>
          </div>
        </form>

        {reconciliationStatus ? <p className="type-caption muted">{reconciliationStatus}</p> : null}

        <table className="table">
          <thead>
            <tr>
              <th scope="col">Run</th>
              <th scope="col">Status</th>
              <th scope="col">Period</th>
              <th scope="col">Discrepancies</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reconciliationRuns.map((run) => (
              <tr key={run.id}>
                <td>{run.id}</td>
                <td>{run.status}</td>
                <td>
                  {new Date(run.statementStartAt).toLocaleDateString()} - {new Date(run.statementEndAt).toLocaleDateString()}
                </td>
                <td>{run.discrepancies?.length || 0}</td>
                <td>
                  <div className="row-1">
                    {run.status === 'DRAFT' ? (
                      <Button tone="secondary" type="button" onClick={() => submitRun(run.id)}>
                        Submit
                      </Button>
                    ) : null}
                    {run.status === 'IN_REVIEW'
                      ? run.discrepancies
                          ?.filter((discrepancy) => discrepancy.status === 'OPEN')
                          .slice(0, 1)
                          .map((discrepancy) => (
                            <Button
                              key={discrepancy.id}
                              tone="secondary"
                              type="button"
                              onClick={() => resolveDiscrepancy(discrepancy.id)}
                            >
                              Resolve {discrepancy.id}
                            </Button>
                          ))
                      : null}
                    {run.status === 'IN_REVIEW' ? (
                      <Button tone="secondary" type="button" onClick={() => completeRun(run.id)}>
                        Complete
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card mt-3 stack-3">
        <h3>LEDES / UTBMS Export</h3>

        <form onSubmit={createLedesProfile} className="grid-2">
          <FormField label="New LEDES Profile Name" name="new-ledes-profile-name" error={ledesProfileErrors.name?.message} required>
            <Input placeholder="New LEDES profile name" {...registerLedesProfile('name')} invalid={!!ledesProfileErrors.name} />
          </FormField>
          <div className="stack-2">
            <p className="type-label">Create Profile</p>
            <Button tone="secondary" type="submit" disabled={creatingLedesProfile}>
              {creatingLedesProfile ? 'Working...' : 'Create Profile'}
            </Button>
          </div>
        </form>

        <form onSubmit={createLedesJob} className="grid-4">
          <FormField label="LEDES Profile" name="ledes-profile" error={ledesJobErrors.profileId?.message} required>
            <Select aria-label="LEDES Profile" {...registerLedesJob('profileId')} invalid={!!ledesJobErrors.profileId}>
              <option value="">Select LEDES profile</option>
              {ledesProfiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name} ({profile.format}){profile.isDefault ? ' - default' : ''}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="LEDES Invoice Select" name="ledes-invoice-select">
            <Select aria-label="LEDES Invoice Select" {...registerLedesJob('invoiceId')}>
              <option value="">Select invoice (optional)</option>
              {invoiceOptions.map((invoice) => (
                <option key={invoice.id} value={invoice.id}>
                  {invoice.label}
                </option>
              ))}
            </Select>
          </FormField>

          <div className="stack-2">
            <p className="type-label">Select Invoice</p>
            <Button tone="secondary" type="button" onClick={addSelectedLedesInvoice}>
              Add Invoice
            </Button>
          </div>

          <div className="stack-2">
            <p className="type-label">Run Export</p>
            <Button tone="secondary" type="submit" disabled={creatingLedesJob}>
              {creatingLedesJob ? 'Working...' : 'Run LEDES Export'}
            </Button>
          </div>
        </form>

        {selectedLedesInvoiceIds.length > 0 ? (
          <div className="row-1">
            {selectedLedesInvoiceIds.map((invoiceId) => (
              <Button key={invoiceId} tone="secondary" type="button" onClick={() => removeSelectedLedesInvoice(invoiceId)}>
                Remove {invoiceOptions.find((invoice) => invoice.id === invoiceId)?.invoiceNumber || invoiceId}
              </Button>
            ))}
          </div>
        ) : null}

        {ledesStatus ? <p className="type-caption muted">{ledesStatus}</p> : null}

        <table className="table">
          <thead>
            <tr>
              <th scope="col">Job</th>
              <th scope="col">Profile</th>
              <th scope="col">Status</th>
              <th scope="col">Validation</th>
              <th scope="col">Lines</th>
              <th scope="col">Total</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ledesJobs.map((job) => (
              <tr key={job.id}>
                <td>{job.id}</td>
                <td>{job.profile?.name || job.profileId}</td>
                <td>{job.status}</td>
                <td>{job.validationStatus || '-'}</td>
                <td>{job.lineCount ?? '-'}</td>
                <td>{job.totalAmount !== undefined && job.totalAmount !== null ? `$${job.totalAmount}` : '-'}</td>
                <td>
                  {job.status === 'COMPLETED' ? (
                    <Button tone="secondary" type="button" onClick={() => downloadLedesJob(job.id)}>
                      Download
                    </Button>
                  ) : (
                    <span className="muted">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

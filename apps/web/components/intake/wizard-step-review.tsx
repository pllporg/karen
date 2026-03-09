'use client';

import { KVStack } from '../ui/kv-display';
import { Button } from '../ui/button';
import { Table } from '../ui/table';
import { type IntakeWizardFormState, formatFileSize } from '../../lib/intake/intake-wizard-adapter';
import { type IntakeWizardStepKey } from '../../lib/schemas/intake';

export function WizardStepReview({
  values,
  onEditStep,
}: {
  values: IntakeWizardFormState;
  onEditStep: (step: IntakeWizardStepKey) => void;
}) {
  return (
    <div className="stack-5">
      <section className="stack-3">
        <div className="intake-step-section-header">
          <h2>Client</h2>
          <Button type="button" tone="ghost" size="sm" onClick={() => onEditStep('client')}>
            Edit
          </Button>
        </div>
        <KVStack
          columns={2}
          pairs={[
            { label: 'First Name', value: values.client.firstName || '—' },
            { label: 'Last Name', value: values.client.lastName || '—' },
            { label: 'Email', value: values.client.email || '—' },
            { label: 'Phone', value: values.client.phone || '—' },
            { label: 'Company', value: values.client.company || '—' },
            { label: 'Role', value: values.client.role || '—' },
          ]}
        />
      </section>

      <section className="stack-3">
        <div className="intake-step-section-header">
          <h2>Property</h2>
          <Button type="button" tone="ghost" size="sm" onClick={() => onEditStep('property')}>
            Edit
          </Button>
        </div>
        <KVStack
          columns={2}
          pairs={[
            { label: 'Address', value: values.property.addressLine1 || '—' },
            { label: 'City', value: values.property.city || '—' },
            { label: 'State', value: values.property.state || '—' },
            { label: 'ZIP', value: values.property.zip || '—' },
            { label: 'Parcel Number', value: values.property.parcelNumber || '—' },
            { label: 'Property Type', value: values.property.propertyType || '—' },
          ]}
        />
      </section>

      <section className="stack-3">
        <div className="intake-step-section-header">
          <h2>Dispute</h2>
          <Button type="button" tone="ghost" size="sm" onClick={() => onEditStep('dispute')}>
            Edit
          </Button>
        </div>
        <KVStack
          columns={2}
          pairs={[
            { label: 'Contract Date', value: values.dispute.contractDate || '—' },
            { label: 'Contract Price', value: values.dispute.contractPrice || '—' },
            { label: 'Defect Count', value: values.dispute.defects.length },
            { label: 'Damage Count', value: values.dispute.damages.length },
          ]}
        />
      </section>

      <section className="stack-3">
        <div className="intake-step-section-header">
          <h2>Uploads</h2>
          <Button type="button" tone="ghost" size="sm" onClick={() => onEditStep('uploads')}>
            Edit
          </Button>
        </div>
        {values.uploads.length ? (
          <Table>
            <thead>
              <tr>
                <th scope="col">File</th>
                <th scope="col">Category</th>
                <th scope="col">Size</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {values.uploads.map((upload) => (
                <tr key={upload.id}>
                  <td>{upload.name}</td>
                  <td>{upload.category}</td>
                  <td className="mono-meta">{formatFileSize(upload.sizeBytes)}</td>
                  <td className="mono-meta">{upload.status}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          <p className="mono-meta">No staged uploads.</p>
        )}
      </section>
    </div>
  );
}

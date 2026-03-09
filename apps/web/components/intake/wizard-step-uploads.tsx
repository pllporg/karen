'use client';

import { useFormContext } from 'react-hook-form';
import { type IntakeWizardFormState, formatFileSize } from '../../lib/intake/intake-wizard-adapter';
import { Button } from '../ui/button';
import { Select } from '../ui/select';
import { Table } from '../ui/table';
import { UploadDropzone } from './upload-dropzone';

export function WizardStepUploads({
  uploadError,
  onFilesSelected,
  onRemoveUpload,
}: {
  uploadError: string | null;
  onFilesSelected: (files: File[]) => void;
  onRemoveUpload: (uploadId: string) => void;
}) {
  const { watch, setValue } = useFormContext<IntakeWizardFormState>();
  const uploads = watch('uploads');

  return (
    <div className="stack-4">
      <UploadDropzone onFilesSelected={onFilesSelected} />

      {uploadError ? (
        <p className="error" role="alert">
          {uploadError}
        </p>
      ) : null}

      {uploads.length ? (
        <Table>
          <thead>
            <tr>
              <th scope="col">File</th>
              <th scope="col">Size</th>
              <th scope="col">Category</th>
              <th scope="col">Status</th>
              <th scope="col">Action</th>
            </tr>
          </thead>
          <tbody>
            {uploads.map((upload, index) => (
              <tr key={upload.id}>
                <td>{upload.name}</td>
                <td className="mono-meta">{formatFileSize(upload.sizeBytes)}</td>
                <td>
                  <Select
                    aria-label={`Upload Category ${upload.name}`}
                    value={upload.category}
                    onChange={(event) => {
                      setValue(`uploads.${index}.category`, event.target.value, { shouldDirty: true });
                    }}
                  >
                    <option value="General">General</option>
                    <option value="Contract">Contract</option>
                    <option value="Inspection">Inspection</option>
                    <option value="Photo">Photo</option>
                    <option value="Invoice">Invoice</option>
                  </Select>
                </td>
                <td className="mono-meta">{upload.status}</td>
                <td>
                  <Button type="button" tone="ghost" size="sm" onClick={() => onRemoveUpload(upload.id)}>
                    Remove
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <p className="mono-meta">No staged uploads yet.</p>
      )}
    </div>
  );
}

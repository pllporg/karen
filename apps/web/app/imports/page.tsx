'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AppShell } from '../../components/app-shell';
import { PageHeader } from '../../components/page-header';
import { Button } from '../../components/ui/button';
import { FormField } from '../../components/ui/form-field';
import { Input } from '../../components/ui/input';
import { Select } from '../../components/ui/select';
import { apiFetch, getSessionToken } from '../../lib/api';
import {
  runImportSchema,
  type RunImportFormData,
} from '../../lib/schemas/imports';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000';

type ImportBatch = {
  id: string;
  sourceSystem: string;
  status: string;
};

function firstFileFromValue(value: unknown): File | null {
  if (value instanceof File) return value;
  if (Array.isArray(value)) return value[0] instanceof File ? value[0] : null;
  if (!value || typeof value !== 'object') return null;

  const maybeFileList = value as { item?: (index: number) => File | null; 0?: unknown };
  if (typeof maybeFileList.item === 'function') {
    return maybeFileList.item(0);
  }
  if (maybeFileList[0] instanceof File) {
    return maybeFileList[0];
  }
  return null;
}

export default function ImportsPage() {
  const [result, setResult] = useState<unknown>(null);
  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RunImportFormData>({
    resolver: zodResolver(runImportSchema),
    mode: 'onBlur',
    defaultValues: {
      sourceSystem: 'mycase_backup_zip',
      entityType: 'contact',
    },
  });
  const sourceSystem = watch('sourceSystem');

  async function loadBatches() {
    setBatches(await apiFetch<ImportBatch[]>('/imports/batches'));
  }

  useEffect(() => {
    loadBatches().catch(() => undefined);
  }, []);

  const runImport = handleSubmit(async (data) => {
    const file = firstFileFromValue(data.file);
    if (!file) return;

    const body = new FormData();
    body.set('sourceSystem', data.sourceSystem);
    if (data.sourceSystem === 'generic_csv') {
      body.set('entityType', data.entityType);
    }
    body.set('file', file);

    const token = getSessionToken();
    const response = await fetch(`${API_BASE}/imports/run`, {
      method: 'POST',
      body,
      headers: token ? { 'x-session-token': token } : undefined,
      credentials: 'include',
    });

    if (!response.ok) {
      setResult({ error: await response.text() });
      return;
    }

    setResult(await response.json());
    await loadBatches();
  });

  return (
    <AppShell>
      <PageHeader title="Import Center" subtitle="Plugin architecture: MyCase ZIP, Clio template CSV/XLSX, and generic CSV imports." />
      <div className="card">
        <form onSubmit={runImport} className="grid-4">
          <FormField label="Source System" name="sourceSystem" error={errors.sourceSystem?.message} required>
            <Select {...register('sourceSystem')} invalid={!!errors.sourceSystem}>
              <option value="mycase_backup_zip">MyCase Full Backup ZIP</option>
              <option value="clio_template">Clio Migration Template</option>
              <option value="generic_csv">Generic CSV</option>
            </Select>
          </FormField>
          <FormField
            label="Entity Type"
            name="entityType"
            error={errors.entityType?.message}
            hint={sourceSystem === 'generic_csv' ? 'Required for generic CSV imports.' : 'Ignored for non-generic imports.'}
          >
            <Select {...register('entityType')} invalid={!!errors.entityType}>
              <option value="contact">Contact</option>
              <option value="matter">Matter</option>
              <option value="task">Task</option>
              <option value="calendar_event">Calendar Event</option>
              <option value="invoice">Invoice</option>
              <option value="payment">Payment</option>
              <option value="time_entry">Time Entry</option>
              <option value="communication_message">Communication</option>
            </Select>
          </FormField>
          <FormField label="Import File" name="file" error={errors.file?.message as string | undefined} required>
            <Input type="file" {...register('file')} />
          </FormField>
          <div className="stack-2">
            <p className="type-label">Run</p>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Working...' : 'Run Import'}
            </Button>
          </div>
        </form>
      </div>

      {result ? (
        <div className="card mt-3">
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      ) : null}

      <div className="card mt-3">
        <h3>Recent Batches</h3>
        <table className="table">
          <thead>
            <tr>
              <th scope="col">Batch</th>
              <th scope="col">Source</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr key={batch.id}>
                <td>{batch.id.slice(0, 8)}</td>
                <td>{batch.sourceSystem}</td>
                <td>{batch.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppShell>
  );
}

import type { FormEventHandler } from 'react';
import type { UseFormRegister, FieldErrors } from 'react-hook-form';
import { Button } from '../../../components/ui/button';
import { FormField } from '../../../components/ui/form-field';
import { Input } from '../../../components/ui/input';
import { Select } from '../../../components/ui/select';
import type { MatterOverviewFormData } from '../../../lib/schemas/matter-overview';
import { MATTER_STATUS_OPTIONS } from './types';

type OverviewPanelProps = {
  dashboard: any;
  editingOverview: boolean;
  register: UseFormRegister<MatterOverviewFormData>;
  errors: FieldErrors<MatterOverviewFormData>;
  isSubmitting: boolean;
  overviewStatusMessage: string | null;
  startOverviewEdit: () => void;
  updateMatterOverview: FormEventHandler<HTMLFormElement>;
  cancelOverviewEdit: () => void;
};

export function OverviewPanel({
  dashboard,
  editingOverview,
  register,
  errors,
  isSubmitting,
  overviewStatusMessage,
  startOverviewEdit,
  updateMatterOverview,
  cancelOverviewEdit,
}: OverviewPanelProps) {
  return (
    <div className="card">
      <h3 style={{ marginTop: 0 }}>Overview</h3>
      {editingOverview ? (
        <form style={{ display: 'grid', gap: 8, gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }} onSubmit={updateMatterOverview}>
          <FormField label="Matter Name" name="matter-overview-name" error={errors.name?.message} required>
            <Input aria-label="Matter Name" placeholder="Matter name" {...register('name')} invalid={!!errors.name} />
          </FormField>
          <FormField label="Matter Number" name="matter-overview-number" error={errors.matterNumber?.message} required>
            <Input
              aria-label="Matter Number"
              placeholder="Matter number"
              {...register('matterNumber')}
              invalid={!!errors.matterNumber}
            />
          </FormField>
          <FormField label="Practice Area" name="matter-overview-practice-area" error={errors.practiceArea?.message} required>
            <Input
              aria-label="Practice Area"
              placeholder="Practice area"
              {...register('practiceArea')}
              invalid={!!errors.practiceArea}
            />
          </FormField>
          <FormField label="Matter Status" name="matter-overview-status" error={errors.status?.message} required>
            <Select aria-label="Matter Status" {...register('status')} invalid={!!errors.status}>
              {MATTER_STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </FormField>
          <FormField label="Matter Venue" name="matter-overview-venue" error={errors.venue?.message}>
            <Input aria-label="Matter Venue" placeholder="Venue" {...register('venue')} invalid={!!errors.venue} />
          </FormField>
          <FormField label="Matter Jurisdiction" name="matter-overview-jurisdiction" error={errors.jurisdiction?.message}>
            <Input
              aria-label="Matter Jurisdiction"
              placeholder="Jurisdiction"
              {...register('jurisdiction')}
              invalid={!!errors.jurisdiction}
            />
          </FormField>
          <FormField label="Matter Opened At" name="matter-overview-opened-at" error={errors.openedAt?.message}>
            <Input
              aria-label="Matter Opened At"
              type="datetime-local"
              {...register('openedAt')}
              invalid={!!errors.openedAt}
            />
          </FormField>
          <FormField label="Matter Closed At" name="matter-overview-closed-at" error={errors.closedAt?.message}>
            <Input
              aria-label="Matter Closed At"
              type="datetime-local"
              {...register('closedAt')}
              invalid={!!errors.closedAt}
            />
          </FormField>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Working...' : 'Save Overview'}
            </Button>
            <Button tone="secondary" type="button" onClick={cancelOverviewEdit}>
              Cancel Overview Edit
            </Button>
          </div>
        </form>
      ) : (
        <div>
          <p>Name: {dashboard.name}</p>
          <p>Matter Number: {dashboard.matterNumber}</p>
          <p>Practice Area: {dashboard.practiceArea}</p>
          <p>Status: {dashboard.status}</p>
          <p>Venue: {dashboard.venue || '-'}</p>
          <p>Jurisdiction: {dashboard.jurisdiction || '-'}</p>
          <p>Opened: {dashboard.openedAt ? new Date(dashboard.openedAt).toLocaleString() : '-'}</p>
          <p>Closed: {dashboard.closedAt ? new Date(dashboard.closedAt).toLocaleString() : '-'}</p>
          <Button tone="secondary" type="button" onClick={startOverviewEdit}>
            Edit Overview
          </Button>
        </div>
      )}
      {overviewStatusMessage ? <p style={{ marginTop: 8, color: 'var(--lic-text-muted)' }}>{overviewStatusMessage}</p> : null}
    </div>
  );
}

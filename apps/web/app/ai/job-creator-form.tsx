import type { FormEventHandler } from 'react';
import type { FieldErrors, UseFormRegister } from 'react-hook-form';
import { Button } from '../../components/ui/button';
import { FormField } from '../../components/ui/form-field';
import { Select } from '../../components/ui/select';
import type { AiJobCreateFormData } from '../../lib/schemas/ai-workspace';
import { MatterLookup, StylePack } from './types';

type JobCreatorFormProps = {
  matterOptions: MatterLookup[];
  stylePacks: StylePack[];
  tools: readonly string[];
  register: UseFormRegister<AiJobCreateFormData>;
  errors: FieldErrors<AiJobCreateFormData>;
  isSubmitting: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
};

export function JobCreatorForm({
  matterOptions,
  stylePacks,
  tools,
  register,
  errors,
  isSubmitting,
  onSubmit,
}: JobCreatorFormProps) {
  return (
    <div className="card mb-3">
      <form onSubmit={onSubmit} className="ai-job-create-form">
        <FormField label="AI Matter" name="ai-job-matter" error={errors.matterId?.message} required>
          <Select aria-label="AI Matter" {...register('matterId')} invalid={!!errors.matterId}>
            <option value="">Select matter</option>
            {matterOptions.map((matter) => (
              <option key={matter.id} value={matter.id}>
                {matter.label}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Tool" name="ai-job-tool" error={errors.toolName?.message} required>
          <Select {...register('toolName')} invalid={!!errors.toolName}>
            {tools.map((tool) => (
              <option key={tool} value={tool}>
                {tool}
              </option>
            ))}
          </Select>
        </FormField>
        <FormField label="Style Pack" name="ai-job-style-pack" error={errors.stylePackId?.message}>
          <Select {...register('stylePackId')} invalid={!!errors.stylePackId}>
            <option value="">No style pack</option>
            {stylePacks.map((stylePack) => (
              <option key={stylePack.id} value={stylePack.id}>
                {stylePack.name}
              </option>
            ))}
          </Select>
        </FormField>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Working...' : 'Create AI Job'}
        </Button>
      </form>
    </div>
  );
}

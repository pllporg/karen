import { z } from 'zod';

export const importSourceSystemSchema = z.enum(['mycase_backup_zip', 'clio_template', 'generic_csv']);

export const importEntityTypeSchema = z.enum([
  'contact',
  'matter',
  'task',
  'calendar_event',
  'invoice',
  'payment',
  'time_entry',
  'communication_message',
]);

function hasFile(value: unknown): value is { length: number } {
  if (!value || typeof value !== 'object') return false;
  return 'length' in value && typeof value.length === 'number' && value.length > 0;
}

const fileListSchema = z.custom<FileList>((value) => hasFile(value), 'Select a file to import.');

export const runImportSchema = z
  .object({
    sourceSystem: importSourceSystemSchema,
    entityType: importEntityTypeSchema,
    file: fileListSchema,
  })
  .superRefine((data, ctx) => {
    if (data.sourceSystem !== 'generic_csv') {
      return;
    }

    if (!data.entityType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['entityType'],
        message: 'Select one of the available options.',
      });
    }
  });

export type RunImportFormData = z.infer<typeof runImportSchema>;

# PRD-03: Form System & Validation

> **Phase:** 1 — Forms
> **Branch:** `refactor/prd-03-forms`
> **Dependencies:** PRD-01 (component error states), PRD-02 (mutation hooks)

---

## Objective

Every form in the application uses react-hook-form with Zod schema validation.
No manual `useState` for form fields. Validation errors render per Brand Doc spec.

---

## Dependencies to Install

```bash
pnpm --filter web add react-hook-form @hookform/resolvers
```

These are production dependencies (not dev), since they ship in the client bundle.

---

## Deliverables

### 1. FormField Wrapper Component

**Create:** `components/ui/form-field.tsx`

```typescript
interface FormFieldProps {
  label: string;
  name: string;
  error?: string;         // Error message from react-hook-form
  required?: boolean;
  hint?: string;          // Optional help text below label
  children: ReactNode;    // The input/select/textarea
}
```

**Layout (top to bottom):**
1. `<label>` — `.type-label` style, htmlFor bound to name. If required, append `*` in Filing Red.
2. `{hint}` — `.type-caption` in Slate, only if provided.
3. `{children}` — The form control. FormField passes `aria-invalid={!!error}` and `aria-describedby` to child.
4. `{error}` — `.type-caption` in Filing Red with 2px Filing Red left border. Only rendered when error is truthy.

**Spacing:** 4px gap between label and hint. 4px gap between hint and control. 4px gap between control and error.
**Margin:** 0 — the parent form layout controls spacing between fields.

### 2. Form Layout Utility

**Add to `globals.css`:**

```css
.form-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--lic-4);
}
.form-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--lic-4);
}
.form-grid-3 {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: var(--lic-4);
}
.form-actions {
  display: flex;
  gap: var(--lic-3);
  justify-content: flex-end;
  padding-top: var(--lic-4);
  border-top: 1px solid var(--lic-fog);
}
```

Responsive: At `compact`, `.form-grid-3` becomes 2-column. At `tablet`, all form grids become single column.

### 3. Zod Schemas

**Create:** `lib/schemas/common.ts`

```typescript
import { z } from 'zod';

export const requiredString = z.string().min(1, 'This field is required.');
export const optionalString = z.string().optional().or(z.literal(''));
export const requiredEmail = z.string().email('Enter a valid email address.');
export const optionalEmail = z.string().email('Enter a valid email address.').optional().or(z.literal(''));
export const requiredPhone = z.string().min(7, 'Enter a valid phone number.');
export const positiveNumber = z.coerce.number().positive('Enter a positive number.');
export const optionalNumber = z.coerce.number().optional();
export const requiredDate = z.string().min(1, 'Select a date.');
```

**Create:** `lib/schemas/lead.ts`

```typescript
export const createLeadSchema = z.object({
  source: requiredString,
  notes: optionalString,
});
```

**Create:** `lib/schemas/intake.ts`

```typescript
// Step 1: Client
export const intakeClientSchema = z.object({
  firstName: requiredString,
  lastName: requiredString,
  email: requiredEmail,
  phone: optionalString,
  company: optionalString,
  role: optionalString,
});

// Step 2: Property
export const intakePropertySchema = z.object({
  addressLine1: requiredString,
  city: requiredString,
  state: requiredString,
  zip: requiredString,
  parcelNumber: optionalString,
  propertyType: optionalString,
  yearBuilt: optionalString,
});

// Step 3: Dispute
export const intakeDisputeSchema = z.object({
  contractDate: optionalString,
  contractPrice: optionalNumber,
  defects: z.array(z.object({
    category: requiredString,
    severity: requiredString,
    description: optionalString,
  })).default([]),
  damages: z.array(z.object({
    category: requiredString,
    repairEstimate: optionalNumber,
  })).default([]),
  // liens, insurance claims follow same pattern
});

// Full intake (all steps combined for final submission)
export const fullIntakeSchema = z.object({
  client: intakeClientSchema,
  property: intakePropertySchema,
  dispute: intakeDisputeSchema,
});
```

**Create:** `lib/schemas/matter.ts`

```typescript
export const createMatterSchema = z.object({
  name: requiredString,
  matterNumber: requiredString,
  practiceArea: requiredString,
  caseType: optionalString,
});

export const convertLeadSchema = z.object({
  name: requiredString,
  matterNumber: requiredString,
  practiceArea: requiredString,
});
```

**Create:** `lib/schemas/contact.ts`

```typescript
export const createContactSchema = z.object({
  firstName: requiredString,
  lastName: requiredString,
  email: optionalEmail,
  phone: optionalString,
  company: optionalString,
  type: z.enum(['INDIVIDUAL', 'ORGANIZATION']),
});
```

**Create:** `lib/schemas/engagement.ts`

```typescript
export const generateEngagementSchema = z.object({
  templateId: requiredString,
  feeType: z.enum(['CONTINGENCY', 'HOURLY', 'FLAT']),
  rate: optionalNumber,
  retainerAmount: optionalNumber,
});

export const sendEngagementSchema = z.object({
  recipientName: requiredString,
  recipientEmail: requiredEmail,
  secondaryRecipients: z.array(z.object({
    name: requiredString,
    email: requiredEmail,
  })).default([]),
});
```

**Create:** `lib/schemas/document.ts`

```typescript
export const uploadDocumentSchema = z.object({
  title: requiredString,
  matterId: optionalString,
  category: optionalString,
});
```

### 4. Integration Pattern

Every form in the app follows this exact pattern:

```tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { createMatterSchema } from '@/lib/schemas/matter';
import { useCreateMatter } from '@/lib/hooks/use-matters';

type FormData = z.infer<typeof createMatterSchema>;

export function CreateMatterForm({ onSuccess }: { onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(createMatterSchema),
    mode: 'onBlur', // Validate on blur per Brand Doc
  });

  const { mutate, loading } = useCreateMatter();

  async function onSubmit(data: FormData) {
    await mutate(data);
    onSuccess();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="stack-4">
      <div className="form-grid-2">
        <FormField label="Matter Name" name="name" error={errors.name?.message} required>
          <Input {...register('name')} invalid={!!errors.name} />
        </FormField>
        <FormField label="Matter Number" name="matterNumber" error={errors.matterNumber?.message} required>
          <Input {...register('matterNumber')} invalid={!!errors.matterNumber} />
        </FormField>
      </div>
      <FormField label="Practice Area" name="practiceArea" error={errors.practiceArea?.message} required>
        <Input {...register('practiceArea')} invalid={!!errors.practiceArea} />
      </FormField>
      <div className="form-actions">
        <Button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create Matter'}
        </Button>
      </div>
    </form>
  );
}
```

**Key rules:**
1. `mode: 'onBlur'` — validate on blur per Brand Doc interaction rules
2. `handleSubmit` wraps `onSubmit` — react-hook-form validates before calling
3. If validation fails, react-hook-form auto-focuses the first error field
4. `errors.fieldName?.message` passes to `FormField` which renders the error
5. Submit button shows loading text and is disabled during mutation
6. No manual `useState` for any form field

---

## Error Message Style Guide

Per Brand Doc: "problem + fix" language. Never blame the user.

| Field | Error Message |
|-------|--------------|
| Required text | "This field is required." |
| Email format | "Enter a valid email address." |
| Phone format | "Enter a valid phone number." |
| Positive number | "Enter a positive number." |
| Date required | "Select a date." |
| Enum mismatch | "Select one of the available options." |

---

## Acceptance Criteria

- [ ] `react-hook-form` and `@hookform/resolvers` installed
- [ ] `<FormField>` renders label, hint, control, and error in correct layout
- [ ] Error messages render in Filing Red with 2px left border
- [ ] All Zod schemas compile and validate correctly
- [ ] Form mode is `onBlur` (validate on blur, then revalidate on change after first error)
- [ ] Submit buttons disable and show loading text during mutation
- [ ] Focus moves to first error field on submit failure
- [ ] Required fields show `*` indicator in label
- [ ] `.form-grid-2` and `.form-grid-3` respond correctly at compact/tablet breakpoints
- [ ] No manual `useState` for form field values in any form
- [ ] `pnpm --filter web test` passes
- [ ] `pnpm --filter web build` succeeds

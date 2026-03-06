# Zod Schema Specifications

> Exact Zod schema definitions for all forms.
> All schemas live in `apps/web/lib/schemas/`.
> Forms use `zodResolver(schema)` with react-hook-form.
> Error messages follow "problem + fix" style — never blame the user.

---

## Common Validators (`lib/schemas/common.ts`)

```typescript
import { z } from 'zod';

// Reusable field validators
export const requiredString = z
  .string()
  .min(1, 'This field is required.');

export const optionalString = z
  .string()
  .optional()
  .or(z.literal(''));

export const requiredEmail = z
  .string()
  .min(1, 'This field is required.')
  .email('Enter a valid email address.');

export const optionalEmail = z
  .string()
  .email('Enter a valid email address.')
  .optional()
  .or(z.literal(''));

export const requiredPhone = z
  .string()
  .min(7, 'Enter a valid phone number.');

export const optionalPhone = z
  .string()
  .min(7, 'Enter a valid phone number.')
  .optional()
  .or(z.literal(''));

export const positiveNumber = z
  .coerce
  .number({ invalid_type_error: 'Enter a number.' })
  .positive('Enter a positive number.');

export const optionalPositiveNumber = z
  .coerce
  .number({ invalid_type_error: 'Enter a number.' })
  .positive('Enter a positive number.')
  .optional()
  .or(z.literal('').transform(() => undefined));

export const requiredDate = z
  .string()
  .min(1, 'Select a date.');

export const optionalDate = z
  .string()
  .optional()
  .or(z.literal(''));
```

---

## Lead Schemas (`lib/schemas/lead.ts`)

```typescript
import { z } from 'zod';
import { requiredString, optionalString } from './common';

export const createLeadSchema = z.object({
  source: requiredString,
  notes: optionalString,
});

export type CreateLeadFormData = z.infer<typeof createLeadSchema>;
```

---

## Intake Wizard Schemas (`lib/schemas/intake.ts`)

```typescript
import { z } from 'zod';
import {
  requiredString,
  optionalString,
  requiredEmail,
  optionalPhone,
  optionalPositiveNumber,
  optionalDate,
} from './common';

// Step 1: Client Information
export const intakeClientSchema = z.object({
  firstName: requiredString,
  lastName: requiredString,
  email: requiredEmail,
  phone: optionalPhone,
  company: optionalString,
  role: optionalString,
});

export type IntakeClientFormData = z.infer<typeof intakeClientSchema>;

// Step 2: Property Information
export const intakePropertySchema = z.object({
  addressLine1: requiredString,
  city: requiredString,
  state: requiredString,
  zip: requiredString,
  parcelNumber: optionalString,
  propertyType: optionalString,
  yearBuilt: optionalString,
});

export type IntakePropertyFormData = z.infer<typeof intakePropertySchema>;

// Step 3: Dispute Details
export const defectSchema = z.object({
  category: requiredString,
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], {
    errorMap: () => ({ message: 'Select a severity level.' }),
  }),
  description: optionalString,
});

export const damageSchema = z.object({
  category: requiredString,
  repairEstimate: optionalPositiveNumber,
});

export const lienSchema = z.object({
  claimantName: requiredString,
  amount: optionalPositiveNumber,
  status: optionalString,
});

export const insuranceClaimSchema = z.object({
  claimNumber: optionalString,
  policyNumber: optionalString,
  insurerName: optionalString,
  adjusterName: optionalString,
  status: optionalString,
});

export const intakeDisputeSchema = z.object({
  contractDate: optionalDate,
  contractPrice: optionalPositiveNumber,
  defects: z.array(defectSchema).default([]),
  damages: z.array(damageSchema).default([]),
  liens: z.array(lienSchema).default([]),
  insuranceClaims: z.array(insuranceClaimSchema).default([]),
});

export type IntakeDisputeFormData = z.infer<typeof intakeDisputeSchema>;

// Combined: Full intake (all steps)
export const fullIntakeSchema = z.object({
  client: intakeClientSchema,
  property: intakePropertySchema,
  dispute: intakeDisputeSchema,
});

export type FullIntakeFormData = z.infer<typeof fullIntakeSchema>;
```

---

## Matter Schemas (`lib/schemas/matter.ts`)

```typescript
import { z } from 'zod';
import { requiredString, optionalString } from './common';

export const createMatterSchema = z.object({
  name: requiredString,
  matterNumber: requiredString,
  practiceArea: requiredString,
  caseType: optionalString,
});

export type CreateMatterFormData = z.infer<typeof createMatterSchema>;

// Used in GP-01-F: Convert Lead to Matter
export const convertLeadSchema = z.object({
  name: requiredString,
  matterNumber: requiredString,
  practiceArea: requiredString,
  caseType: optionalString,
});

export type ConvertLeadFormData = z.infer<typeof convertLeadSchema>;

// Participant (used in Convert screen)
export const participantSchema = z.object({
  name: requiredString,
  role: z.enum([
    'CLIENT',
    'OPPOSING_PARTY',
    'OPPOSING_COUNSEL',
    'EXPERT',
    'WITNESS',
    'MEDIATOR',
    'JUDGE',
    'OTHER',
  ], {
    errorMap: () => ({ message: 'Select a role.' }),
  }),
  side: z.enum(['PLAINTIFF', 'DEFENDANT', 'NEUTRAL'], {
    errorMap: () => ({ message: 'Select a side.' }),
  }),
  contactId: optionalString,
});

export type ParticipantFormData = z.infer<typeof participantSchema>;
```

---

## Contact Schemas (`lib/schemas/contact.ts`)

```typescript
import { z } from 'zod';
import { requiredString, optionalEmail, optionalPhone, optionalString } from './common';

export const createContactSchema = z.object({
  firstName: requiredString,
  lastName: requiredString,
  email: optionalEmail,
  phone: optionalPhone,
  company: optionalString,
  type: z.enum(['INDIVIDUAL', 'ORGANIZATION'], {
    errorMap: () => ({ message: 'Select a contact type.' }),
  }),
});

export type CreateContactFormData = z.infer<typeof createContactSchema>;
```

---

## Engagement Schemas (`lib/schemas/engagement.ts`)

```typescript
import { z } from 'zod';
import { requiredString, requiredEmail, optionalPositiveNumber } from './common';

export const generateEngagementSchema = z.object({
  templateId: requiredString,
  feeType: z.enum(['CONTINGENCY', 'HOURLY', 'FLAT'], {
    errorMap: () => ({ message: 'Select a fee type.' }),
  }),
  rate: optionalPositiveNumber,
  retainerAmount: optionalPositiveNumber,
});

export type GenerateEngagementFormData = z.infer<typeof generateEngagementSchema>;

export const sendEngagementSchema = z.object({
  recipientName: requiredString,
  recipientEmail: requiredEmail,
  secondaryRecipients: z.array(z.object({
    name: requiredString,
    email: requiredEmail,
  })).default([]),
});

export type SendEngagementFormData = z.infer<typeof sendEngagementSchema>;
```

---

## Document Schemas (`lib/schemas/document.ts`)

```typescript
import { z } from 'zod';
import { requiredString, optionalString } from './common';

export const uploadDocumentSchema = z.object({
  title: requiredString,
  matterId: optionalString,
  category: optionalString,
});

export type UploadDocumentFormData = z.infer<typeof uploadDocumentSchema>;
```

---

## Login Schema (`lib/schemas/auth.ts`)

```typescript
import { z } from 'zod';
import { requiredString, requiredEmail } from './common';

export const loginSchema = z.object({
  email: requiredEmail,
  password: requiredString,
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  email: requiredEmail,
  password: z.string().min(8, 'Password must be at least 8 characters.'),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  { message: 'Passwords do not match.', path: ['confirmPassword'] }
);

export type RegisterFormData = z.infer<typeof registerSchema>;
```

---

## Conflict Resolution Schema (`lib/schemas/conflict.ts`)

```typescript
import { z } from 'zod';
import { requiredString, optionalString } from './common';

export const conflictResolutionSchema = z.object({
  resolution: z.enum(['CLEARED', 'POTENTIAL_CONFLICT', 'CONFIRMED_CONFLICT'], {
    errorMap: () => ({ message: 'Select a resolution.' }),
  }),
  notes: z.string().optional(),
}).refine(
  (data) => {
    // Notes required for non-clear resolutions
    if (data.resolution !== 'CLEARED' && (!data.notes || data.notes.trim() === '')) {
      return false;
    }
    return true;
  },
  { message: 'Notes are required for potential or confirmed conflicts.', path: ['notes'] }
);

export type ConflictResolutionFormData = z.infer<typeof conflictResolutionSchema>;
```

---

## Admin Schemas (`lib/schemas/admin.ts`)

```typescript
import { z } from 'zod';
import { requiredString, requiredEmail } from './common';

export const inviteUserSchema = z.object({
  email: requiredEmail,
  role: z.enum(['ADMIN', 'ATTORNEY', 'PARALEGAL', 'STAFF'], {
    errorMap: () => ({ message: 'Select a role.' }),
  }),
  name: requiredString,
});

export type InviteUserFormData = z.infer<typeof inviteUserSchema>;
```

---

## Usage Pattern

Every form follows this exact integration:

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createMatterSchema, CreateMatterFormData } from '@/lib/schemas/matter';

const { register, handleSubmit, formState: { errors } } = useForm<CreateMatterFormData>({
  resolver: zodResolver(createMatterSchema),
  mode: 'onBlur',       // Validate on blur (Brand Doc requirement)
});
```

**Key points:**
- `mode: 'onBlur'` — validate when field loses focus
- After first blur validation, errors update on each keystroke (react-hook-form default)
- `handleSubmit` validates entire form before calling the submit handler
- `errors.fieldName?.message` is passed to `<FormField error={...}>`
- Zod `z.infer<typeof schema>` generates the TypeScript type automatically

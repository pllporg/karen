import type { z } from 'zod';
import { intakeWizardSchema } from '../schemas/intake';

export type IntakeWizardFormState = z.infer<typeof intakeWizardSchema>;

export const defaultIntakeWizardForm: IntakeWizardFormState = {
  client: {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    company: '',
    role: '',
    linkedContactId: '',
  },
  property: {
    addressLine1: '',
    city: '',
    state: '',
    zip: '',
    parcelNumber: '',
    propertyType: '',
    yearBuilt: '',
  },
  dispute: {
    contractDate: '',
    contractPrice: '',
    defects: [
      {
        category: '',
        severity: '',
        description: '',
      },
    ],
    damages: [
      {
        category: '',
        amount: '',
        description: '',
      },
    ],
  },
  uploads: [],
};

export function buildIntakeDraftData(form: IntakeWizardFormState) {
  return {
    client: {
      firstName: form.client.firstName,
      lastName: form.client.lastName,
      email: form.client.email,
      phone: form.client.phone || undefined,
      company: form.client.company || undefined,
      role: form.client.role || undefined,
      linkedContactId: form.client.linkedContactId || undefined,
    },
    property: {
      addressLine1: form.property.addressLine1,
      city: form.property.city,
      state: form.property.state,
      zip: form.property.zip,
      parcelNumber: form.property.parcelNumber || undefined,
      propertyType: form.property.propertyType || undefined,
      yearBuilt: form.property.yearBuilt || undefined,
    },
    dispute: {
      contractDate: form.dispute.contractDate,
      contractPrice: Number(form.dispute.contractPrice || 0),
      defects: form.dispute.defects.map((defect) => ({
        category: defect.category,
        severity: defect.severity,
        description: defect.description,
      })),
      damages: form.dispute.damages.map((damage) => ({
        category: damage.category,
        amount: Number(damage.amount || 0),
        description: damage.description || undefined,
      })),
    },
    uploads: form.uploads.map((upload) => ({
      id: upload.id,
      name: upload.name,
      category: upload.category,
      sizeBytes: upload.sizeBytes,
      status: upload.status,
    })),
  };
}

export function suggestUploadCategory(fileName: string) {
  const normalized = fileName.toLowerCase();

  if (normalized.includes('contract')) return 'Contract';
  if (normalized.includes('photo') || normalized.match(/\.(png|jpg|jpeg|heic)$/)) return 'Photo';
  if (normalized.includes('inspection')) return 'Inspection';
  if (normalized.includes('invoice')) return 'Invoice';
  return 'General';
}

export function formatFileSize(sizeBytes: number) {
  if (sizeBytes >= 1024 * 1024) {
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (sizeBytes >= 1024) {
    return `${Math.round(sizeBytes / 1024)} KB`;
  }

  return `${sizeBytes} B`;
}

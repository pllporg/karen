import { type ConflictStatus, type EngagementStatus, type LeadStage } from './common';

export interface Lead {
  id: string;
  name: string;
  source: string;
  stage: LeadStage;
  type?: string;
  attorneyId?: string;
  attorneyName?: string;
  isPortalOrigin: boolean;
  conflictStatus?: ConflictStatus;
  engagementStatus?: EngagementStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Defect {
  id: string;
  category: string;
  description: string;
  observedAt?: string;
  estimatedCost?: number;
}

export interface Damage {
  id: string;
  category: string;
  description: string;
  amount?: number;
}

export interface Lien {
  id: string;
  claimant: string;
  amount?: number;
  filedAt?: string;
}

export interface InsuranceClaim {
  id: string;
  carrier: string;
  claimNumber?: string;
  status?: string;
  amount?: number;
}

export interface UploadedFile {
  id: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string;
}

export interface IntakeDraft {
  id: string;
  leadId: string;
  client: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    company?: string;
    role?: string;
  };
  property: {
    addressLine1: string;
    city: string;
    state: string;
    zip: string;
    parcelNumber?: string;
    propertyType?: string;
    yearBuilt?: string;
  };
  dispute: {
    contractDate?: string;
    contractPrice?: number;
    defects: Defect[];
    damages: Damage[];
    liens: Lien[];
    insuranceClaims: InsuranceClaim[];
  };
  uploads: UploadedFile[];
  createdAt: string;
  updatedAt: string;
}

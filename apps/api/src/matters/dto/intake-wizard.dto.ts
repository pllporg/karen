import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class IntakeWizardDto {
  @IsString()
  name!: string;

  @IsString()
  matterNumber!: string;

  @IsString()
  practiceArea!: string;

  @IsObject()
  property!: {
    addressLine1: string;
    city?: string;
    state?: string;
    postalCode?: string;
    parcelNumber?: string;
    permits?: unknown;
    inspections?: unknown;
  };

  @IsObject()
  contract!: {
    contractDate?: string;
    contractPrice?: number;
    paymentSchedule?: unknown;
    changeOrders?: unknown;
    warranties?: unknown;
  };

  @IsArray()
  @IsOptional()
  defects?: Array<{
    category: string;
    locationInHome?: string;
    severity?: string;
    description?: string;
    photoDocumentVersionIds?: string[];
  }>;

  @IsArray()
  @IsOptional()
  milestones?: Array<{
    name: string;
    plannedDate?: string;
    actualDate?: string;
    status?: string;
    notes?: string;
  }>;

  @IsArray()
  @IsOptional()
  damages?: Array<{
    category: string;
    repairEstimate?: number;
    paidAmount?: number;
    completionCost?: number;
    consequentialAmount?: number;
    notes?: string;
  }>;

  @IsArray()
  @IsOptional()
  liens?: Array<{
    claimantContactId?: string;
    claimantName?: string;
    amount?: number;
    recordingDate?: string;
    releaseDate?: string;
    status?: string;
    notes?: string;
  }>;

  @IsArray()
  @IsOptional()
  insuranceClaims?: Array<{
    policyNumber?: string;
    claimNumber?: string;
    adjusterContactId?: string;
    adjusterName?: string;
    insurerContactId?: string;
    insurerName?: string;
    coverageNotes?: string;
    status?: string;
  }>;

  @IsArray()
  @IsOptional()
  expertEngagements?: Array<{
    expertContactId?: string;
    expertName?: string;
    scope?: string;
    feeArrangement?: string;
    reportDocumentId?: string;
    status?: string;
  }>;
}

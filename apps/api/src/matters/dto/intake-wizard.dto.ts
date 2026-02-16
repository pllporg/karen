import { IsArray, IsDateString, IsNumber, IsObject, IsOptional, IsString } from 'class-validator';

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
}

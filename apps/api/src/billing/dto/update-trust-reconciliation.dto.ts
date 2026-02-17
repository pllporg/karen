import { IsIn, IsOptional, IsString } from 'class-validator';

export class ResolveTrustReconciliationDiscrepancyDto {
  @IsString()
  @IsIn(['RESOLVED', 'WAIVED'])
  status!: 'RESOLVED' | 'WAIVED';

  @IsString()
  resolutionNote!: string;
}

export class UpdateTrustReconciliationRunDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateRetentionPolicyDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsIn(['ALL_DOCUMENTS', 'MATTER', 'CATEGORY'])
  scope!: 'ALL_DOCUMENTS' | 'MATTER' | 'CATEGORY';

  @IsString()
  @IsOptional()
  matterId?: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsInt()
  @Min(1)
  retentionDays!: number;

  @IsString()
  @IsIn(['DOCUMENT_UPLOADED', 'MATTER_CLOSED'])
  trigger!: 'DOCUMENT_UPLOADED' | 'MATTER_CLOSED';

  @IsBoolean()
  @IsOptional()
  requireApproval?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

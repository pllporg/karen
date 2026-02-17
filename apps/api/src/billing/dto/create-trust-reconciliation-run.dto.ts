import { IsOptional, IsString } from 'class-validator';

export class CreateTrustReconciliationRunDto {
  @IsString()
  @IsOptional()
  trustAccountId?: string;

  @IsString()
  @IsOptional()
  statementStartAt?: string;

  @IsString()
  @IsOptional()
  statementEndAt?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

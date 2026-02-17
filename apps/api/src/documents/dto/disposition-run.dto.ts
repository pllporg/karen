import { IsOptional, IsString } from 'class-validator';

export class CreateDispositionRunDto {
  @IsString()
  @IsOptional()
  policyId?: string;

  @IsString()
  @IsOptional()
  cutoffAt?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class DispositionRunActionDto {
  @IsString()
  @IsOptional()
  notes?: string;
}

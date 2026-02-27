import { IsOptional, IsString } from 'class-validator';

export class CreateLeadDto {
  @IsString()
  source!: string;

  @IsString()
  @IsOptional()
  referralContactId?: string;

  @IsString()
  @IsOptional()
  assignedToUserId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

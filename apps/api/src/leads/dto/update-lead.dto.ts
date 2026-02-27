import { IsEnum, IsOptional, IsString } from 'class-validator';
import { LeadStage } from '@prisma/client';

export class UpdateLeadDto {
  @IsString()
  @IsOptional()
  source?: string;

  @IsString()
  @IsOptional()
  referralContactId?: string;

  @IsString()
  @IsOptional()
  assignedToUserId?: string;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsEnum(LeadStage)
  @IsOptional()
  stage?: LeadStage;
}

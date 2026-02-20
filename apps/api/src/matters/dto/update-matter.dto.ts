import { MatterStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateMatterDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  matterNumber?: string;

  @IsString()
  @IsOptional()
  practiceArea?: string;

  @IsEnum(MatterStatus)
  @IsOptional()
  status?: MatterStatus;

  @IsString()
  @IsOptional()
  jurisdiction?: string | null;

  @IsString()
  @IsOptional()
  venue?: string | null;

  @IsString()
  @IsOptional()
  stageId?: string | null;

  @IsString()
  @IsOptional()
  matterTypeId?: string | null;

  @IsDateString()
  @IsOptional()
  openedAt?: string;

  @IsDateString()
  @IsOptional()
  closedAt?: string | null;
}

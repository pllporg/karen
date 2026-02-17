import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ConflictWeightsDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  name?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  email?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  phone?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  matter?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  relationship?: number;
}

class ConflictThresholdsDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  warn?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  block?: number;
}

export class CreateConflictProfileDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  practiceAreas?: string[];

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  matterTypeIds?: string[];

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ValidateNested()
  @Type(() => ConflictWeightsDto)
  @IsOptional()
  weights?: ConflictWeightsDto;

  @ValidateNested()
  @Type(() => ConflictThresholdsDto)
  @IsOptional()
  thresholds?: ConflictThresholdsDto;
}

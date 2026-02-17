import { IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class DeadlineSelectionDto {
  @IsString()
  ruleId!: string;

  @IsBoolean()
  @IsOptional()
  apply?: boolean;

  @IsString()
  @IsOptional()
  overrideDate?: string;

  @IsString()
  @IsOptional()
  overrideReason?: string;
}

export class ApplyDeadlinePreviewDto {
  @IsString()
  matterId!: string;

  @IsString()
  triggerDate!: string;

  @IsString()
  @IsOptional()
  rulesPackId?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeadlineSelectionDto)
  @IsOptional()
  selections?: DeadlineSelectionDto[];
}

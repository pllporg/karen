import { IsArray, IsBoolean, IsInt, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class DeadlineRuleDefinitionDto {
  @IsString()
  name!: string;

  @IsInt()
  @Type(() => Number)
  offsetDays!: number;

  @IsBoolean()
  @IsOptional()
  businessDaysOnly?: boolean;

  @IsString()
  @IsOptional()
  eventType?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

export class CreateRulesPackDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  jurisdiction!: string;

  @IsString()
  @IsOptional()
  court?: string;

  @IsString()
  @IsOptional()
  procedure?: string;

  @IsString()
  version!: string;

  @IsString()
  effectiveFrom!: string;

  @IsString()
  @IsOptional()
  effectiveTo?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeadlineRuleDefinitionDto)
  rules!: DeadlineRuleDefinitionDto[];
}

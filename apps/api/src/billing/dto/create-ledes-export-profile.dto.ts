import { IsBoolean, IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateLedesExportProfileDto {
  @IsString()
  name!: string;

  @IsString()
  @IsIn(['LEDES98B'])
  @IsOptional()
  format?: 'LEDES98B';

  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @IsBoolean()
  @IsOptional()
  requireUtbmsPhaseCode?: boolean;

  @IsBoolean()
  @IsOptional()
  requireUtbmsTaskCode?: boolean;

  @IsBoolean()
  @IsOptional()
  includeExpenseLineItems?: boolean;

  @IsObject()
  @IsOptional()
  validationRulesJson?: Record<string, unknown>;
}

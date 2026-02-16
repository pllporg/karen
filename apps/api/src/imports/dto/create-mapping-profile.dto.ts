import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateMappingProfileDto {
  @IsString()
  name!: string;

  @IsString()
  sourceSystem!: string;

  @IsObject()
  @IsOptional()
  fieldMappings?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  transforms?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  dedupeRules?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  conflictRules?: Record<string, unknown>;
}

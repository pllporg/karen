import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateCustomFieldDto {
  @IsString()
  entityType!: string;

  @IsString()
  key!: string;

  @IsString()
  label!: string;

  @IsString()
  fieldType!: string;

  @IsObject()
  @IsOptional()
  optionsJson?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  validationsJson?: Record<string, unknown>;
}

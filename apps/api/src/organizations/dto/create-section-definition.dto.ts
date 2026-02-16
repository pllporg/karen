import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateSectionDefinitionDto {
  @IsString()
  name!: string;

  @IsString()
  @IsOptional()
  matterTypeId?: string;

  @IsObject()
  schemaJson!: Record<string, unknown>;
}

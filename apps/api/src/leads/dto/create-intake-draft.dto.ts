import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateIntakeDraftDto {
  @IsString()
  intakeFormDefinitionId!: string;

  @IsObject()
  dataJson!: Record<string, unknown>;

  @IsString()
  @IsOptional()
  submittedByContactId?: string;
}

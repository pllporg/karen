import { IsObject, IsOptional, IsString } from 'class-validator';

export class SaveIntakeDraftDto {
  @IsString()
  @IsOptional()
  draftId?: string;

  @IsObject()
  payload!: Record<string, unknown>;
}

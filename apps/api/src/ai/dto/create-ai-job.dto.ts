import { IsObject, IsOptional, IsString } from 'class-validator';

export class CreateAiJobDto {
  @IsString()
  matterId!: string;

  @IsString()
  toolName!: string;

  @IsObject()
  @IsOptional()
  input?: Record<string, unknown>;
}

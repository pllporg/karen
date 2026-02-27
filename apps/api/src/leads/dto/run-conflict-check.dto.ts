import { IsOptional, IsString } from 'class-validator';

export class RunConflictCheckDto {
  @IsString()
  queryText!: string;

  @IsOptional()
  resultJson?: Record<string, unknown>;
}

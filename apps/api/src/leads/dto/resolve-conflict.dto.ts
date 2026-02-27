import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class ResolveConflictDto {
  @IsBoolean()
  resolved!: boolean;

  @IsString()
  @IsOptional()
  resolutionNotes?: string;
}

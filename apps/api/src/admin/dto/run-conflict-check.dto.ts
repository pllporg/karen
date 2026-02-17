import { IsOptional, IsString } from 'class-validator';

export class RunConflictCheckDto {
  @IsString()
  queryText!: string;

  @IsString()
  @IsOptional()
  profileId?: string;

  @IsString()
  @IsOptional()
  practiceArea?: string;

  @IsString()
  @IsOptional()
  matterTypeId?: string;
}

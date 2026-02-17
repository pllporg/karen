import { IsOptional, IsString } from 'class-validator';

export class PreviewDeadlinesDto {
  @IsString()
  matterId!: string;

  @IsString()
  triggerDate!: string;

  @IsString()
  @IsOptional()
  rulesPackId?: string;
}

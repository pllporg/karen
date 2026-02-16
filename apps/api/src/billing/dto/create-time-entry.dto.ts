import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateTimeEntryDto {
  @IsString()
  matterId!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  startedAt!: string;

  @IsDateString()
  endedAt!: string;

  @IsNumber()
  @IsOptional()
  billableRate?: number;

  @IsString()
  @IsOptional()
  utbmsPhaseCode?: string;

  @IsString()
  @IsOptional()
  utbmsTaskCode?: string;
}

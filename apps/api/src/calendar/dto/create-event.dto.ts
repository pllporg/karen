import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateCalendarEventDto {
  @IsString()
  matterId!: string;

  @IsString()
  type!: string;

  @IsDateString()
  startAt!: string;

  @IsDateString()
  @IsOptional()
  endAt?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

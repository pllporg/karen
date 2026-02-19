import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateCalendarEventDto {
  @IsString()
  @IsOptional()
  type?: string;

  @IsDateString()
  @IsOptional()
  startAt?: string;

  @IsDateString()
  @IsOptional()
  endAt?: string;

  @IsBoolean()
  @IsOptional()
  clearEndAt?: boolean;

  @IsString()
  @IsOptional()
  location?: string;

  @IsString()
  @IsOptional()
  description?: string;
}

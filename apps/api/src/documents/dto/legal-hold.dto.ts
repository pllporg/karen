import { IsOptional, IsString } from 'class-validator';

export class PlaceLegalHoldDto {
  @IsString()
  reason!: string;
}

export class ReleaseLegalHoldDto {
  @IsString()
  @IsOptional()
  reason?: string;
}

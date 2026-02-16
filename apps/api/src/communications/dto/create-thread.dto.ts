import { IsOptional, IsString } from 'class-validator';

export class CreateThreadDto {
  @IsString()
  @IsOptional()
  matterId?: string;

  @IsString()
  @IsOptional()
  contactId?: string;

  @IsString()
  @IsOptional()
  subject?: string;
}

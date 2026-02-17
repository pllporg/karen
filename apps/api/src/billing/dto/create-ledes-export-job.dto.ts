import { IsArray, IsOptional, IsString } from 'class-validator';

export class CreateLedesExportJobDto {
  @IsString()
  profileId!: string;

  @IsString()
  @IsOptional()
  matterId?: string;

  @IsArray()
  @IsOptional()
  invoiceIds?: string[];
}

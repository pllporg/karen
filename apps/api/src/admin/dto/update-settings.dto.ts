import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateSettingsDto {
  @IsString()
  @IsOptional()
  letterhead?: string;

  @IsObject()
  @IsOptional()
  defaultsJson?: Record<string, unknown>;

  @IsObject()
  @IsOptional()
  invoiceTemplateJson?: Record<string, unknown>;
}

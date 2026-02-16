import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UploadDocumentDto {
  @IsString()
  matterId!: string;

  @IsString()
  title!: string;

  @IsString()
  @IsOptional()
  category?: string;

  @IsString()
  @IsOptional()
  tags?: string;

  @IsBoolean()
  @IsOptional()
  sharedWithClient?: boolean;
}

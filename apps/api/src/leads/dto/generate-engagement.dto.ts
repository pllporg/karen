import { IsOptional, IsString } from 'class-validator';

export class GenerateEngagementDto {
  @IsString()
  engagementLetterTemplateId!: string;

  @IsString()
  @IsOptional()
  provider?: string;

  @IsOptional()
  payloadJson?: Record<string, unknown>;
}

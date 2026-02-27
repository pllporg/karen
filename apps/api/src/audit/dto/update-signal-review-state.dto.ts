import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { MatterAuditSignalReviewState } from '@prisma/client';

export class UpdateSignalReviewStateDto {
  @IsEnum(MatterAuditSignalReviewState)
  reviewState!: MatterAuditSignalReviewState;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  reviewNotes?: string;
}

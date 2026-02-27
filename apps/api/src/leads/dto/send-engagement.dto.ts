import { IsOptional, IsString } from 'class-validator';

export class SendEngagementDto {
  @IsString()
  envelopeId!: string;

  @IsString()
  @IsOptional()
  externalId?: string;
}

import { MatterParticipantSide } from '@prisma/client';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export class AddParticipantDto {
  @IsString()
  contactId!: string;

  @IsString()
  participantRoleKey!: string;

  @IsEnum(MatterParticipantSide)
  @IsOptional()
  side?: MatterParticipantSide;

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsString()
  @IsOptional()
  representedByContactId?: string;

  @IsString()
  @IsOptional()
  lawFirmContactId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

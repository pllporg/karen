import { MatterParticipantSide } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateParticipantRoleDto {
  @IsString()
  key!: string;

  @IsString()
  label!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(MatterParticipantSide)
  @IsOptional()
  sideDefault?: MatterParticipantSide;
}

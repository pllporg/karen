import { CommunicationDirection, CommunicationMessageType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateCommunicationEntryDto {
  @IsString()
  @IsOptional()
  threadId?: string;

  @IsEnum(CommunicationMessageType)
  @IsOptional()
  type?: CommunicationMessageType;

  @IsEnum(CommunicationDirection)
  @IsOptional()
  direction?: CommunicationDirection;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsString()
  @IsOptional()
  participantContactId?: string;

  @IsDateString()
  @IsOptional()
  occurredAt?: string;
}

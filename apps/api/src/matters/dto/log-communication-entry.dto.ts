import { CommunicationDirection, CommunicationMessageType } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class LogCommunicationEntryDto {
  @IsString()
  @IsOptional()
  threadId?: string;

  @IsString()
  @IsOptional()
  threadSubject?: string;

  @IsEnum(CommunicationMessageType)
  type!: CommunicationMessageType;

  @IsEnum(CommunicationDirection)
  direction!: CommunicationDirection;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  body!: string;

  @IsString()
  @IsOptional()
  participantContactId?: string;

  @IsDateString()
  @IsOptional()
  occurredAt?: string;
}

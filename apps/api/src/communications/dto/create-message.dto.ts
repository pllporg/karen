import { CommunicationDirection, CommunicationMessageType } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  threadId!: string;

  @IsEnum(CommunicationMessageType)
  type!: CommunicationMessageType;

  @IsEnum(CommunicationDirection)
  direction!: CommunicationDirection;

  @IsString()
  @IsOptional()
  subject?: string;

  @IsString()
  body!: string;

  @IsArray()
  @IsOptional()
  participants?: Array<{ contactId: string; role: 'FROM' | 'TO' | 'CC' | 'BCC' | 'OTHER' }>;

  @IsArray()
  @IsOptional()
  attachmentVersionIds?: string[];
}

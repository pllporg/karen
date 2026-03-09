import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class ConvertLeadParticipantDto {
  @IsString()
  name!: string;

  @IsString()
  roleKey!: string;

  @IsString()
  @IsOptional()
  @IsIn(['CLIENT_SIDE', 'OPPOSING_SIDE', 'NEUTRAL', 'COURT'])
  side?: 'CLIENT_SIDE' | 'OPPOSING_SIDE' | 'NEUTRAL' | 'COURT';

  @IsBoolean()
  @IsOptional()
  isPrimary?: boolean;

  @IsString()
  @IsOptional()
  existingContactId?: string;

  @IsString()
  @IsOptional()
  representedByContactId?: string;

  @IsString()
  @IsOptional()
  representedByName?: string;

  @IsString()
  @IsOptional()
  lawFirmContactId?: string;

  @IsString()
  @IsOptional()
  lawFirmName?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

export class ConvertLeadDto {
  @IsString()
  name!: string;

  @IsString()
  matterNumber!: string;

  @IsString()
  practiceArea!: string;

  @IsString()
  @IsOptional()
  jurisdiction?: string;

  @IsString()
  @IsOptional()
  venue?: string;

  @IsBoolean()
  @IsOptional()
  ethicalWallEnabled?: boolean;

  @IsString()
  @IsOptional()
  ethicalWallNotes?: string;

  @IsArray()
  @IsOptional()
  deniedUserIds?: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConvertLeadParticipantDto)
  @IsOptional()
  participants?: ConvertLeadParticipantDto[];
}

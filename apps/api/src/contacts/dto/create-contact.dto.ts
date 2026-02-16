import { ContactKind } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class CreateContactDto {
  @IsEnum(ContactKind)
  kind!: ContactKind;

  @IsString()
  displayName!: string;

  @IsString()
  @IsOptional()
  primaryEmail?: string;

  @IsString()
  @IsOptional()
  primaryPhone?: string;

  @IsArray()
  @IsOptional()
  tags?: string[];

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  barNumber?: string;

  @IsString()
  @IsOptional()
  licenseJurisdiction?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  legalName?: string;

  @IsString()
  @IsOptional()
  dba?: string;

  @IsString()
  @IsOptional()
  website?: string;
}

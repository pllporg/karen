import { IsBoolean, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateMatterDto {
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

  @IsString()
  @IsOptional()
  matterTypeId?: string;

  @IsString()
  @IsOptional()
  stageId?: string;

  @IsDateString()
  @IsOptional()
  openedAt?: string;

  @IsBoolean()
  @IsOptional()
  ethicalWallEnabled?: boolean;
}

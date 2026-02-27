import { IsOptional, IsString } from 'class-validator';

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
}

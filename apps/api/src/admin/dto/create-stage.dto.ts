import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateStageDto {
  @IsString()
  name!: string;

  @IsString()
  practiceArea!: string;

  @IsInt()
  @IsOptional()
  orderIndex?: number;
}

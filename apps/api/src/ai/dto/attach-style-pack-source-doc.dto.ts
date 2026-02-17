import { IsString } from 'class-validator';

export class AttachStylePackSourceDocDto {
  @IsString()
  documentVersionId!: string;
}

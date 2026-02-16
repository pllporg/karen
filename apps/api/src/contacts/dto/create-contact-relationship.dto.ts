import { IsOptional, IsString } from 'class-validator';

export class CreateContactRelationshipDto {
  @IsString()
  fromContactId!: string;

  @IsString()
  toContactId!: string;

  @IsString()
  relationshipType!: string;

  @IsString()
  @IsOptional()
  notes?: string;
}

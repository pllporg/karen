import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateExpenseDto {
  @IsString()
  matterId!: string;

  @IsString()
  description!: string;

  @IsNumber()
  amount!: number;

  @IsDateString()
  incurredAt!: string;

  @IsString()
  @IsOptional()
  receiptDocumentVersionId?: string;
}

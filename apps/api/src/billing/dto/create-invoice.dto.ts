import { IsArray, IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateInvoiceDto {
  @IsString()
  matterId!: string;

  @IsDateString()
  @IsOptional()
  dueAt?: string;

  @IsArray()
  lineItems!: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    timeEntryId?: string;
    expenseId?: string;
    utbmsPhaseCode?: string;
    utbmsTaskCode?: string;
  }>;

  @IsString()
  @IsOptional()
  notes?: string;
}

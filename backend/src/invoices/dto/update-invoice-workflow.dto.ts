import { IsBoolean } from 'class-validator';

export class UpdateInvoiceWorkflowDto {
  @IsBoolean()
  transport: boolean;

  @IsBoolean()
  logistics: boolean;

  @IsBoolean()
  isImport: boolean;

  @IsBoolean()
  isExport: boolean;

  @IsBoolean()
  freight: boolean;
}

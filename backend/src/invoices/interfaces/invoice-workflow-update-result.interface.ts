import { Invoice } from '../entities/invoice.entity';

export interface InvoiceWorkflowUpdateResult {
  voided: boolean;
  jobCardId: string;
  jobCardNumber: string | null;
  invoice?: Invoice;
}

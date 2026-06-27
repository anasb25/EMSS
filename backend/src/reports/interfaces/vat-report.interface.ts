export type VatReportFilter = 'all' | 'sales' | 'purchases' | 'paynow';

export type VatLineType = 'sales' | 'purchase' | 'paynow';

export interface VatReportLine {
  id: string;
  type: VatLineType;
  date: string;
  documentNumber: string;
  partyName: string;
  description: string;
  taxableAmount: number;
  vatAmount: number;
  totalAmount: number;
  vatPercent: number;
}

export interface VatReportSummary {
  outputVat: number;
  outputTaxable: number;
  inputVat: number;
  inputTaxable: number;
  netVatPayable: number;
}

export interface VatReport {
  dateFrom: string;
  dateTo: string;
  filter: VatReportFilter;
  summary: VatReportSummary;
  sales: VatReportLine[];
  purchases: VatReportLine[];
  payNowExpenses: VatReportLine[];
  lines: VatReportLine[];
}

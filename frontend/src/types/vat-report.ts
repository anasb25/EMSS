export type VatReportFilter = 'all' | 'sales' | 'purchases' | 'paynow'

export type VatLineType = 'sales' | 'purchase' | 'paynow'

export interface VatReportLine {
  id: string
  type: VatLineType
  date: string
  documentNumber: string
  partyName: string
  description: string
  taxableAmount: number
  vatAmount: number
  totalAmount: number
  vatPercent: number
}

export interface VatReportSummary {
  outputVat: number
  outputTaxable: number
  inputVat: number
  inputTaxable: number
  netVatPayable: number
}

export interface VatReport {
  dateFrom: string
  dateTo: string
  filter: VatReportFilter
  summary: VatReportSummary
  sales: VatReportLine[]
  purchases: VatReportLine[]
  payNowExpenses: VatReportLine[]
  lines: VatReportLine[]
}

export type VatPeriodFilter = 'today' | 'week' | 'month' | 'year' | 'custom'

export {
  formatProfitLossDate as formatVatDate,
  formatProfitLossMoney as formatVatMoney,
  getProfitLossPeriodRange as getVatPeriodRange,
  profitLossPeriodLabel as vatPeriodLabel,
} from '@/types/profit-loss'

export function vatFilterLabel(filter: VatReportFilter): string {
  switch (filter) {
    case 'all':
      return 'All'
    case 'sales':
      return 'Sales'
    case 'purchases':
      return 'Purchases'
    case 'paynow':
      return 'Pay Now'
    default:
      return filter
  }
}

export function vatLineTypeLabel(type: VatLineType): string {
  switch (type) {
    case 'sales':
      return 'Sales'
    case 'purchase':
      return 'Purchase'
    case 'paynow':
      return 'Pay Now'
    default:
      return type
  }
}

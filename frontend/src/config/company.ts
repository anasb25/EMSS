export const COMPANY = {
  name: 'EMSS SHIPPING L.L.C',
  tagline: 'SEA, AIR, LAND CARGO, TRANSPORTATION',
  address:
    'Deira Al-Ras Dubai U.A.E. Al-Sheikh Building Office #102 P.O Box. 64959',
  trn: '100427791700003',
  paymentPayee: 'EMSS SHIPPING LLC',
} as const

export const INVOICE_PRINT_FOOTER = {
  paymentLine: `Kindly arrange payment in favor of ${COMPANY.paymentPayee}.`,
  discrepancyNote:
    'Note: Discrepancies if any should be notified within 7 days or else this invoice will be deemed as accepted.',
  systemNote:
    'System Generated Invoice Not Required Stamp & Sign.',
} as const

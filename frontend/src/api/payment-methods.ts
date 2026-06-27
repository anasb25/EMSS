import { apiRequest } from '@/api/http'
import type { PaymentMethod } from '@/types/receivable'

export function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  return apiRequest<PaymentMethod[]>('/payment-methods')
}

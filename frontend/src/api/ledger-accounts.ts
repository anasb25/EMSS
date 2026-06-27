import { apiRequest } from '@/api/http'

export interface LedgerAccount {
  id: number
  name: string
  code: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export function fetchLedgerAccounts(): Promise<LedgerAccount[]> {
  return apiRequest<LedgerAccount[]>('/ledger-accounts')
}

export function createLedgerAccount(name: string): Promise<LedgerAccount> {
  return apiRequest<LedgerAccount>('/ledger-accounts', {
    method: 'POST',
    body: JSON.stringify({ name: name.trim() }),
  })
}

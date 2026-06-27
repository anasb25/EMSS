import { ROUTES } from '@/config/routes'
import { useDailyBookDate } from '@/hooks/useDailyBookDate'

export function useDailyCashBookDate() {
  return useDailyBookDate(ROUTES.books.cash)
}

export function useDailyBankBookDate() {
  return useDailyBookDate(ROUTES.books.bank)
}

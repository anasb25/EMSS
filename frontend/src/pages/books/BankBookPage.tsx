import { ModulePage } from '@/components/common/ModulePage'
import { BankBookSheet } from '@/components/bank/BankBookSheet'
import { useDailyBankBookDate } from '@/hooks/useDailyCashBookDate'

export function BankBookPage() {
  const [selectedDate, setSelectedDate] = useDailyBankBookDate()

  return (
    <ModulePage
      title="Bank Book"
      description="Standalone daily bank book. Record bank in and bank out manually — not linked to sales, purchases, or expenses."
    >
      <BankBookSheet
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />
    </ModulePage>
  )
}

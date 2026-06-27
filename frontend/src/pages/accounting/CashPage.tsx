import { useCallback, useEffect, useState } from 'react'
import { Wallet } from 'lucide-react'
import { createOpeningBalance, fetchCashDaySummary } from '@/api/cash'
import { CashBookSheet } from '@/components/cash/CashBookSheet'
import { OpeningBalanceForm } from '@/components/cash/OpeningBalanceForm'
import { ModulePage } from '@/components/common/ModulePage'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useDailyCashBookDate } from '@/hooks/useDailyCashBookDate'
import { useModal } from '@/hooks/useModal'
import {
  todayDateInputValue,
  type OpeningBalanceFormData,
} from '@/types/cash'
import styles from './CashPage.module.css'

export function CashPage() {
  const [selectedDate, setSelectedDate] = useDailyCashBookDate()
  const [hasOpeningBalance, setHasOpeningBalance] = useState(true)
  const [isCheckingOpening, setIsCheckingOpening] = useState(true)
  const openingModal = useModal()

  const checkOpeningBalance = useCallback(async () => {
    setIsCheckingOpening(true)
    try {
      const summary = await fetchCashDaySummary(selectedDate)
      setHasOpeningBalance(summary.hasOpeningBalance)
    } catch {
      setHasOpeningBalance(false)
    } finally {
      setIsCheckingOpening(false)
    }
  }, [selectedDate])

  useEffect(() => {
    void checkOpeningBalance()
  }, [checkOpeningBalance])

  async function handleCreateOpeningBalance(data: OpeningBalanceFormData) {
    await createOpeningBalance(data)
    openingModal.close()
    setHasOpeningBalance(true)
    setSelectedDate(data.entryDate)
  }

  return (
    <ModulePage
      title="Cash Book"
      description="Standalone daily cashbook. Record cash in and cash out manually — not linked to sales, purchases, or expenses."
    >
      <div className={styles.page}>
        {!hasOpeningBalance && !isCheckingOpening ? (
          <div className={styles.notice}>
            <Wallet size={18} />
            <div>
              <strong>Set your opening balance</strong>
              <p>
                Record how much cash you have on hand to start the cashbook.
                Each new day opens with the previous day&apos;s closing balance.
              </p>
            </div>
            <Button type="button" onClick={() => openingModal.open()}>
              Set Opening Balance
            </Button>
          </div>
        ) : null}

        <CashBookSheet
          selectedDate={selectedDate}
          onDateChange={setSelectedDate}
        />
      </div>

      <Modal
        isOpen={openingModal.isOpen}
        title="Opening Balance"
        description="Set the starting cash balance for your cashbook."
        onClose={openingModal.close}
        size="md"
      >
        <OpeningBalanceForm
          defaultDate={todayDateInputValue()}
          onSubmit={handleCreateOpeningBalance}
          onCancel={openingModal.close}
        />
      </Modal>
    </ModulePage>
  )
}

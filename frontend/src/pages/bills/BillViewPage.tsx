import { useCallback, useEffect, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { fetchBill } from '@/api/bills'
import { BillView } from '@/components/bills/BillView'
import { ModulePage } from '@/components/common/ModulePage'
import { Button } from '@/components/ui/Button'
import { ROUTES } from '@/config/routes'
import type { Bill } from '@/types/bill'
import styles from './BillViewPage.module.css'

export function BillViewPage() {
  const { billId } = useParams<{ billId: string }>()
  const navigate = useNavigate()
  const [bill, setBill] = useState<Bill | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  const loadBill = useCallback(async () => {
    if (!billId) return

    setIsLoading(true)
    setError('')

    try {
      const data = await fetchBill(billId)
      setBill(data)
    } catch {
      setError('Failed to load bill.')
      setBill(null)
    } finally {
      setIsLoading(false)
    }
  }, [billId])

  useEffect(() => {
    void loadBill()
  }, [loadBill])

  function handleBack() {
    navigate(ROUTES.bills)
  }

  return (
    <ModulePage
      title="Bill"
      description="View vendor bill details and line items."
      actions={
        <Button type="button" variant="secondary" onClick={handleBack}>
          <ArrowLeft size={16} />
          Back to Bills
        </Button>
      }
    >
      {isLoading ? (
        <p className={styles.status}>Loading bill…</p>
      ) : error ? (
        <p className={styles.error}>{error}</p>
      ) : bill ? (
        <BillView bill={bill} />
      ) : null}
    </ModulePage>
  )
}

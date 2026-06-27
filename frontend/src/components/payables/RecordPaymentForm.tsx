import { type FormEvent, useEffect, useState } from 'react'
import { fetchPaymentMethods } from '@/api/payment-methods'
import { Button } from '@/components/ui/Button'
import { DateInput } from '@/components/ui/DateInput'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import type { PaymentMethod } from '@/types/payable'
import {
  emptyRecordPaymentForm,
  formatPayableMoney,
  type Payable,
  type RecordPaymentFormData,
} from '@/types/payable'
import styles from './RecordPaymentForm.module.css'

interface RecordPaymentFormProps {
  payable: Payable
  onSubmit: (data: RecordPaymentFormData) => Promise<void>
  onCancel: () => void
}

export function RecordPaymentForm({
  payable,
  onSubmit,
  onCancel,
}: RecordPaymentFormProps) {
  const [form, setForm] = useState<RecordPaymentFormData>(emptyRecordPaymentForm())
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [isLoadingPaymentMethods, setIsLoadingPaymentMethods] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setForm(emptyRecordPaymentForm())
    setError('')
  }, [payable])

  useEffect(() => {
    setIsLoadingPaymentMethods(true)
    fetchPaymentMethods()
      .then(setPaymentMethods)
      .finally(() => setIsLoadingPaymentMethods(false))
  }, [])

  function updateField<K extends keyof RecordPaymentFormData>(
    field: K,
    value: RecordPaymentFormData[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!form.paymentMethodId) {
      setError('Payment method is required.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(form)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to record payment.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.summary}>
        <strong>{formatPayableMoney(payable.amount)}</strong>
        <span>{payable.vendor?.name ?? 'Vendor'}</span>
      </div>

      <div className={styles.grid}>
        <Select
          label="Payment Method"
          name="paymentMethodId"
          value={form.paymentMethodId}
          onChange={(event) => updateField('paymentMethodId', event.target.value)}
          options={paymentMethods.map((method) => ({
            value: String(method.id),
            label: method.name,
          }))}
          disabled={isLoadingPaymentMethods}
          required
        />
        <Input
          label="Bank Detail"
          name="bankDetail"
          value={form.bankDetail}
          onChange={(event) => updateField('bankDetail', event.target.value)}
          placeholder="Bank name, account number..."
        />
        <Input
          label="Cheque Number"
          name="chequeNumber"
          value={form.chequeNumber}
          onChange={(event) => updateField('chequeNumber', event.target.value)}
          placeholder="Cheque number"
        />
        <DateInput
          label="Cheque Date"
          name="chequeDate"
          value={form.chequeDate}
          onChange={(event) => updateField('chequeDate', event.target.value)}
        />
        <Input
          label="Transaction Reference"
          name="transactionReference"
          value={form.transactionReference}
          onChange={(event) =>
            updateField('transactionReference', event.target.value)
          }
          placeholder="Reference number"
        />
      </div>

      <Textarea
        label="Notes"
        name="notes"
        value={form.notes}
        onChange={(event) => updateField('notes', event.target.value)}
        placeholder="Payment notes..."
        rows={3}
      />

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Record Payment'}
        </Button>
      </div>
    </form>
  )
}

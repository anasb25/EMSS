import { type FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { DateInput } from '@/components/ui/DateInput'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import {
  emptyOpeningBalanceForm,
  type OpeningBalanceFormData,
} from '@/types/cash'
import styles from './OpeningBalanceForm.module.css'

interface OpeningBalanceFormProps {
  defaultDate: string
  onSubmit: (data: OpeningBalanceFormData) => Promise<void>
  onCancel: () => void
}

export function OpeningBalanceForm({
  defaultDate,
  onSubmit,
  onCancel,
}: OpeningBalanceFormProps) {
  const [form, setForm] = useState<OpeningBalanceFormData>(
    emptyOpeningBalanceForm(defaultDate),
  )
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setForm(emptyOpeningBalanceForm(defaultDate))
    setError('')
  }, [defaultDate])

  function updateField<K extends keyof OpeningBalanceFormData>(
    field: K,
    value: OpeningBalanceFormData[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const amount = Number(form.amount)
    if (!Number.isFinite(amount) || amount < 0) {
      setError('Enter a valid opening balance.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(form)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to set opening balance.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <p className={styles.hint}>
        Set the cash on hand at the start of your cashbook. This is recorded once
        and carries forward to the next day automatically.
      </p>

      <div className={styles.grid}>
        <DateInput
          label="Start Date"
          name="entryDate"
          value={form.entryDate}
          onChange={(event) => updateField('entryDate', event.target.value)}
          required
        />
        <Input
          label="Opening Balance"
          name="amount"
          type="number"
          min="0"
          step="0.01"
          value={form.amount}
          onChange={(event) => updateField('amount', event.target.value)}
          placeholder="0.00"
          required
        />
      </div>

      <Textarea
        label="Notes"
        name="notes"
        value={form.notes}
        onChange={(event) => updateField('notes', event.target.value)}
        placeholder="Optional notes..."
        rows={3}
      />

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Set Opening Balance'}
        </Button>
      </div>
    </form>
  )
}

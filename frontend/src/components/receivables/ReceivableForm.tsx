import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { fetchCustomers } from '@/api/customers'
import { Button } from '@/components/ui/Button'
import { DateInput } from '@/components/ui/DateInput'
import { Input } from '@/components/ui/Input'
import {
  SearchableSelect,
  type SearchableSelectOption,
} from '@/components/ui/SearchableSelect'
import { Textarea } from '@/components/ui/Textarea'
import { emptyReceivableForm, type ReceivableFormData } from '@/types/receivable'
import styles from './ReceivableForm.module.css'

interface ReceivableFormProps {
  onSubmit: (data: ReceivableFormData) => Promise<void>
  onCancel: () => void
}

const DROPDOWN_LIMIT = 20

export function ReceivableForm({ onSubmit, onCancel }: ReceivableFormProps) {
  const [form, setForm] = useState<ReceivableFormData>(emptyReceivableForm())
  const [customerLabel, setCustomerLabel] = useState('')
  const [customerOptions, setCustomerOptions] = useState<SearchableSelectOption[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadCustomers = useCallback(async (search: string) => {
    setIsLoadingCustomers(true)
    try {
      const response = await fetchCustomers({
        search,
        status: 'active',
        page: 1,
        limit: DROPDOWN_LIMIT,
      })
      setCustomerOptions(
        response.data.map((customer) => ({
          value: customer.id,
          label: customer.name,
          sublabel: customer.email ?? customer.phoneNumber ?? undefined,
        })),
      )
    } finally {
      setIsLoadingCustomers(false)
    }
  }, [])

  useEffect(() => {
    void loadCustomers('')
  }, [loadCustomers])

  useEffect(() => {
    void loadCustomers(customerSearch)
  }, [customerSearch, loadCustomers])

  function updateField<K extends keyof ReceivableFormData>(
    field: K,
    value: ReceivableFormData[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!form.customerId) {
      setError('Customer is required.')
      return
    }

    const amount = Number(form.amount)
    if (!form.amount.trim() || Number.isNaN(amount) || amount <= 0) {
      setError('Amount must be greater than zero.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(form)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to save receivable.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Receivable Details</h3>
        <div className={styles.grid}>
          <SearchableSelect
            label="Customer"
            value={form.customerId}
            selectedLabel={customerLabel}
            options={customerOptions}
            onSearchChange={setCustomerSearch}
            onChange={(value, option) => {
              updateField('customerId', value)
              setCustomerLabel(option.label)
            }}
            isLoading={isLoadingCustomers}
            required
          />
          <Input
            label="Amount"
            name="amount"
            type="number"
            min="0.01"
            step="0.01"
            value={form.amount}
            onChange={(event) => updateField('amount', event.target.value)}
            placeholder="0.00"
            required
          />
          <DateInput
            label="Due Date"
            name="dueDate"
            value={form.dueDate}
            onChange={(event) => updateField('dueDate', event.target.value)}
            required
          />
        </div>
        <Textarea
          label="Notes"
          name="notes"
          value={form.notes}
          onChange={(event) => updateField('notes', event.target.value)}
          placeholder="Additional notes..."
          rows={3}
        />
      </section>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Add Receivable'}
        </Button>
      </div>
    </form>
  )
}

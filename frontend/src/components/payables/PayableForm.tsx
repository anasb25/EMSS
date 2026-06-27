import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { fetchVendors } from '@/api/vendors'
import { Button } from '@/components/ui/Button'
import { DateInput } from '@/components/ui/DateInput'
import { Input } from '@/components/ui/Input'
import {
  SearchableSelect,
  type SearchableSelectOption,
} from '@/components/ui/SearchableSelect'
import { Textarea } from '@/components/ui/Textarea'
import { emptyPayableForm, type PayableFormData } from '@/types/payable'
import styles from './PayableForm.module.css'

interface PayableFormProps {
  onSubmit: (data: PayableFormData) => Promise<void>
  onCancel: () => void
}

const DROPDOWN_LIMIT = 20

export function PayableForm({ onSubmit, onCancel }: PayableFormProps) {
  const [form, setForm] = useState<PayableFormData>(emptyPayableForm())
  const [vendorLabel, setVendorLabel] = useState('')
  const [vendorOptions, setVendorOptions] = useState<SearchableSelectOption[]>([])
  const [vendorSearch, setVendorSearch] = useState('')
  const [isLoadingVendors, setIsLoadingVendors] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const loadVendors = useCallback(async (search: string) => {
    setIsLoadingVendors(true)
    try {
      const response = await fetchVendors({
        search,
        status: 'active',
        page: 1,
        limit: DROPDOWN_LIMIT,
      })
      setVendorOptions(
        response.data.map((vendor) => ({
          value: vendor.id,
          label: vendor.name,
          sublabel: vendor.email ?? vendor.phoneNumber ?? undefined,
        })),
      )
    } finally {
      setIsLoadingVendors(false)
    }
  }, [])

  useEffect(() => {
    void loadVendors('')
  }, [loadVendors])

  useEffect(() => {
    void loadVendors(vendorSearch)
  }, [vendorSearch, loadVendors])

  function updateField<K extends keyof PayableFormData>(
    field: K,
    value: PayableFormData[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!form.vendorId) {
      setError('Vendor is required.')
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
          : 'Unable to save payable.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Payable Details</h3>
        <p className={styles.hint}>
          Payment method and payment details are captured when you record payment.
        </p>
        <div className={styles.grid}>
          <SearchableSelect
            label="Vendor"
            value={form.vendorId}
            selectedLabel={vendorLabel}
            options={vendorOptions}
            onSearchChange={setVendorSearch}
            onChange={(value, option) => {
              updateField('vendorId', value)
              setVendorLabel(option.label)
            }}
            isLoading={isLoadingVendors}
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
          {isSubmitting ? 'Saving...' : 'Add Payable'}
        </Button>
      </div>
    </form>
  )
}

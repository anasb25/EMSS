import { type FormEvent, useCallback, useEffect, useState } from 'react'
import { fetchPaymentMethods } from '@/api/payment-methods'
import { fetchExpenseCategories } from '@/api/expenses'
import { fetchVendors } from '@/api/vendors'
import { Button } from '@/components/ui/Button'
import { DateInput } from '@/components/ui/DateInput'
import { Input } from '@/components/ui/Input'
import {
  SearchableSelect,
  type SearchableSelectOption,
} from '@/components/ui/SearchableSelect'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Textarea'
import type { PaymentMethod } from '@/types/payable'
import {
  calculateExpensePricing,
  emptyExpenseForm,
  formatExpenseMoney,
  type ExpenseCategory,
  type ExpenseFormData,
} from '@/types/expense'
import styles from './ExpenseForm.module.css'

interface ExpenseFormProps {
  defaultDate?: string
  cashOutMode?: boolean
  onSubmit: (data: ExpenseFormData) => Promise<void>
  onCancel: () => void
}

const DROPDOWN_LIMIT = 20

export function ExpenseForm({
  defaultDate,
  cashOutMode = false,
  onSubmit,
  onCancel,
}: ExpenseFormProps) {
  const [form, setForm] = useState<ExpenseFormData>(
    emptyExpenseForm(defaultDate),
  )
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [vendorLabel, setVendorLabel] = useState('')
  const [vendorOptions, setVendorOptions] = useState<SearchableSelectOption[]>([])
  const [vendorSearch, setVendorSearch] = useState('')
  const [isLoadingVendors, setIsLoadingVendors] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setForm(emptyExpenseForm(defaultDate))
    setVendorLabel('')
    setError('')
  }, [defaultDate])

  useEffect(() => {
    fetchExpenseCategories().then(setCategories)
    fetchPaymentMethods().then((methods) => {
      setPaymentMethods(methods)
      if (cashOutMode) {
        const cashMethod = methods.find((method) => method.name === 'Cash')
        if (cashMethod) {
          setForm((current) => ({
            ...current,
            paymentMethodId: String(cashMethod.id),
          }))
        }
      }
    })
  }, [cashOutMode])

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

  function updateField<K extends keyof ExpenseFormData>(
    field: K,
    value: ExpenseFormData[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const pricing = calculateExpensePricing(
    Number(form.amount) || 0,
    form.includeVat,
  )

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!form.categoryId) {
      setError('Category is required.')
      return
    }

    if (!form.paymentMethodId) {
      setError('Payment method is required.')
      return
    }

    if (!form.description.trim()) {
      setError('Description is required.')
      return
    }

    const amount = Number(form.amount)
    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Enter a valid amount greater than zero.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(form)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to record expense.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.grid}>
        <DateInput
          label="Date"
          name="expenseDate"
          value={form.expenseDate}
          onChange={(event) => updateField('expenseDate', event.target.value)}
          required
        />
        <Input
          label={form.includeVat ? 'Amount (before VAT)' : 'Amount'}
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          value={form.amount}
          onChange={(event) => updateField('amount', event.target.value)}
          placeholder="0.00"
          required
        />
        <Select
          label="Category"
          name="categoryId"
          value={form.categoryId}
          onChange={(event) => updateField('categoryId', event.target.value)}
          options={categories.map((category) => ({
            value: String(category.id),
            label: category.name,
          }))}
          required
        />
        {cashOutMode ? (
          <Input
            label="Paid Through"
            name="paymentMethodDisplay"
            value="Cash"
            readOnly
          />
        ) : (
          <Select
            label="Paid Through"
            name="paymentMethodId"
            value={form.paymentMethodId}
            onChange={(event) =>
              updateField('paymentMethodId', event.target.value)
            }
            options={paymentMethods.map((method) => ({
              value: String(method.id),
              label: method.name,
            }))}
            required
          />
        )}
      </div>

      <label className={styles.vatToggle}>
        <input
          type="checkbox"
          checked={form.includeVat}
          onChange={(event) => updateField('includeVat', event.target.checked)}
        />
        <span>Include VAT (5%)</span>
      </label>

      {form.includeVat && form.amount ? (
        <div className={styles.vatSummary}>
          <span>VAT: {formatExpenseMoney(pricing.vatAmount)}</span>
          <strong>Total: {formatExpenseMoney(pricing.total)}</strong>
        </div>
      ) : null}

      <SearchableSelect
        label="Vendor (optional)"
        value={form.vendorId}
        selectedLabel={vendorLabel}
        options={vendorOptions}
        placeholder="Search vendor..."
        isLoading={isLoadingVendors}
        onSearchChange={setVendorSearch}
        onChange={(value, option) => {
          updateField('vendorId', value)
          setVendorLabel(option.label)
        }}
      />

      <Input
        label="Description"
        name="description"
        value={form.description}
        onChange={(event) => updateField('description', event.target.value)}
        placeholder="What was this expense for?"
        required
      />

      <Textarea
        label="Notes"
        name="notes"
        value={form.notes}
        onChange={(event) => updateField('notes', event.target.value)}
        placeholder="Optional notes..."
        rows={3}
      />

      <p className={styles.hint}>
        {cashOutMode
          ? 'This records a cash expense in Expenses and posts it to today’s cashbook.'
          : 'Cash expenses are posted to the cashbook automatically. Bank and cheque expenses are recorded here only.'}
      </p>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? 'Saving...'
            : cashOutMode
              ? 'Record Cash Out'
              : 'Record Expense'}
        </Button>
      </div>
    </form>
  )
}

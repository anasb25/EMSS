import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { fetchCustomers } from '@/api/customers'
import { fetchProducts } from '@/api/products'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  SearchableSelect,
  type SearchableSelectOption,
} from '@/components/ui/SearchableSelect'
import { Textarea } from '@/components/ui/Textarea'
import {
  createLineItemDraft,
  emptyJobCardForm,
  formatMoney,
  lineItemDraftsToFormItems,
  recalculateLineItemDraft,
  type JobCardFormData,
  type JobCardLineItemDraft,
} from '@/types/job-card'
import styles from './JobCardForm.module.css'

interface JobCardFormProps {
  onSubmit: (data: JobCardFormData) => Promise<void>
  onCancel: () => void
}

const DROPDOWN_LIMIT = 20

export function JobCardForm({ onSubmit, onCancel }: JobCardFormProps) {
  const [form, setForm] = useState<JobCardFormData>(emptyJobCardForm())
  const [lineItems, setLineItems] = useState<JobCardLineItemDraft[]>([])
  const [customerLabel, setCustomerLabel] = useState('')
  const [customerOptions, setCustomerOptions] = useState<SearchableSelectOption[]>([])
  const [productOptions, setProductOptions] = useState<SearchableSelectOption[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [pendingProductId, setPendingProductId] = useState('')
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setForm(emptyJobCardForm())
    setLineItems([])
    setCustomerLabel('')
    setError('')
    setPendingProductId('')
  }, [])

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

  const loadProducts = useCallback(async (search: string) => {
    setIsLoadingProducts(true)
    try {
      const response = await fetchProducts({
        search,
        status: 'active',
        page: 1,
        limit: DROPDOWN_LIMIT,
      })
      setProductOptions(
        response.data.map((product) => ({
          value: product.id,
          label: product.name,
        })),
      )
    } finally {
      setIsLoadingProducts(false)
    }
  }, [])

  useEffect(() => {
    void loadCustomers(customerSearch)
  }, [customerSearch, loadCustomers])

  useEffect(() => {
    void loadProducts(productSearch)
  }, [productSearch, loadProducts])

  const grandTotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [lineItems],
  )

  function updateField<K extends keyof JobCardFormData>(
    field: K,
    value: JobCardFormData[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleCustomerChange(value: string, option: SearchableSelectOption) {
    updateField('customerId', value)
    setCustomerLabel(option.label)
  }

  function handleAddProduct(value: string, option: SearchableSelectOption) {
    if (lineItems.some((item) => item.productId === value)) {
      setPendingProductId('')
      return
    }

    setLineItems((current) => [...current, createLineItemDraft(value, option.label)])
    setPendingProductId('')
    setProductSearch('')
  }

  function handleRemoveLineItem(key: string) {
    setLineItems((current) => current.filter((item) => item.key !== key))
  }

  function updateLineItem(
    key: string,
    patch: Partial<Pick<JobCardLineItemDraft, 'note' | 'quantity' | 'unitPrice' | 'includeVat'>>,
  ) {
    setLineItems((current) =>
      current.map((item) => {
        if (item.key !== key) return item
        return recalculateLineItemDraft({ ...item, ...patch })
      }),
    )
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!form.customerId) {
      setError('Customer is required.')
      return
    }

    if (!lineItems.length) {
      setError('Add at least one product.')
      return
    }

    const payload: JobCardFormData = {
      ...form,
      items: lineItemDraftsToFormItems(lineItems),
    }

    setIsSubmitting(true)
    try {
      await onSubmit(payload)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to save job card.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const availableProductOptions = productOptions.filter(
    (option) => !lineItems.some((item) => item.productId === option.value),
  )

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Job Details</h3>
        <SearchableSelect
          label="Customer"
          value={form.customerId}
          selectedLabel={customerLabel}
          placeholder="Search customers..."
          options={customerOptions}
          onSearchChange={setCustomerSearch}
          onChange={handleCustomerChange}
          isLoading={isLoadingCustomers}
          required
        />
        <div className={styles.grid}>
          <Input
            label="BL Number"
            name="blNumber"
            value={form.blNumber}
            onChange={(event) => updateField('blNumber', event.target.value)}
            placeholder="Bill of lading number"
          />
          <Input
            label="Declaration Number"
            name="declarationNumber"
            value={form.declarationNumber}
            onChange={(event) => updateField('declarationNumber', event.target.value)}
            placeholder="Declaration number"
          />
        </div>
        <Input
          label="Container Number"
          name="containerNumber"
          value={form.containerNumber}
          onChange={(event) => updateField('containerNumber', event.target.value)}
          placeholder="Container number"
        />
        <Textarea
          label="Description"
          name="description"
          value={form.description}
          onChange={(event) => updateField('description', event.target.value)}
          placeholder="Additional notes or instructions"
        />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Products</h3>
          <span className={styles.countBadge}>{lineItems.length} added</span>
        </div>

        <SearchableSelect
          label="Add Product"
          value={pendingProductId}
          placeholder="Search products to add..."
          options={availableProductOptions}
          onSearchChange={setProductSearch}
          onChange={handleAddProduct}
          isLoading={isLoadingProducts}
        />

        {lineItems.length ? (
          <div className={styles.lineItemsTableWrap}>
            <table className={styles.lineItemsTable}>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Note</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Include VAT</th>
                  <th>VAT %</th>
                  <th>Total</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.key}>
                    <td className={styles.productNameCell}>{item.productName}</td>
                    <td>
                      <input
                        type="text"
                        className={styles.tableInput}
                        value={item.note}
                        onChange={(event) =>
                          updateLineItem(item.key, { note: event.target.value })
                        }
                        placeholder="Note"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0.01"
                        step="0.01"
                        className={styles.tableInputNumber}
                        value={item.quantity}
                        onChange={(event) =>
                          updateLineItem(item.key, {
                            quantity: Number(event.target.value) || 0,
                          })
                        }
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className={styles.tableInputNumber}
                        value={item.unitPrice}
                        onChange={(event) =>
                          updateLineItem(item.key, {
                            unitPrice: Number(event.target.value) || 0,
                          })
                        }
                      />
                    </td>
                    <td className={styles.checkboxCell}>
                      <input
                        type="checkbox"
                        checked={item.includeVat}
                        onChange={(event) =>
                          updateLineItem(item.key, { includeVat: event.target.checked })
                        }
                        aria-label={`Include VAT for ${item.productName}`}
                      />
                    </td>
                    <td className={styles.vatCell}>{item.vatPercent}%</td>
                    <td className={styles.totalCell}>{formatMoney(item.lineTotal)}</td>
                    <td className={styles.actionCell}>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => handleRemoveLineItem(item.key)}
                        aria-label={`Remove ${item.productName}`}
                      >
                        <X size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={6} className={styles.grandTotalLabel}>
                    Grand Total
                  </td>
                  <td className={styles.grandTotalValue}>{formatMoney(grandTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className={styles.emptyProducts}>
            <Plus size={16} />
            <span>Search and select products to attach them to this job card.</span>
          </div>
        )}
      </section>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Create Job Card
        </Button>
      </div>
    </form>
  )
}

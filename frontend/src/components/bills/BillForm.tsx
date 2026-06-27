import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, X } from 'lucide-react'
import { fetchVendors } from '@/api/vendors'
import { Button } from '@/components/ui/Button'
import { DateInput } from '@/components/ui/DateInput'
import { Input } from '@/components/ui/Input'
import {
  SearchableSelect,
  type SearchableSelectOption,
} from '@/components/ui/SearchableSelect'
import { Textarea } from '@/components/ui/Textarea'
import {
  createLineItemDraft,
  emptyBillForm,
  formatBillMoney,
  lineItemDraftsToFormItems,
  recalculateLineItemDraft,
  type BillFormData,
  type BillLineItemDraft,
} from '@/types/bill'
import styles from './BillForm.module.css'

interface BillFormProps {
  onSubmit: (data: BillFormData) => Promise<void>
  onCancel: () => void
}

const DROPDOWN_LIMIT = 20

export function BillForm({ onSubmit, onCancel }: BillFormProps) {
  const [form, setForm] = useState<BillFormData>(emptyBillForm())
  const [lineItems, setLineItems] = useState<BillLineItemDraft[]>([])
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

  const grandTotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [lineItems],
  )

  function updateField<K extends keyof BillFormData>(
    field: K,
    value: BillFormData[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleAddLineItem() {
    setLineItems((current) => [...current, createLineItemDraft()])
  }

  function updateLineItem(key: string, updates: Partial<BillLineItemDraft>) {
    setLineItems((current) =>
      current.map((item) =>
        item.key === key ? recalculateLineItemDraft(item, updates) : item,
      ),
    )
  }

  function handleRemoveLineItem(key: string) {
    setLineItems((current) => current.filter((item) => item.key !== key))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!form.vendorId) {
      setError('Vendor is required.')
      return
    }

    if (!lineItems.length) {
      setError('Add at least one line item.')
      return
    }

    if (lineItems.some((item) => !item.description.trim())) {
      setError('Each line item must have a description.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit({
        ...form,
        items: lineItemDraftsToFormItems(lineItems),
      })
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to save bill.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Bill Details</h3>
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
            label="Vendor Reference"
            name="vendorReference"
            value={form.vendorReference}
            onChange={(event) => updateField('vendorReference', event.target.value)}
            placeholder="Vendor invoice number"
          />
          <DateInput
            label="Bill Date"
            name="billDate"
            value={form.billDate}
            onChange={(event) => updateField('billDate', event.target.value)}
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
          rows={2}
        />
      </section>

      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h3 className={styles.sectionTitle}>Line Items</h3>
          <span className={styles.countBadge}>{lineItems.length} added</span>
        </div>

        <Button type="button" variant="secondary" size="sm" onClick={handleAddLineItem}>
          <Plus size={15} />
          Add Line Item
        </Button>

        {lineItems.length ? (
          <div className={styles.lineItemsTableWrap}>
            <table className={styles.lineItemsTable}>
              <thead>
                <tr>
                  <th>Description</th>
                  <th>Note</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>VAT</th>
                  <th>VAT %</th>
                  <th>Total</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.key}>
                    <td>
                      <input
                        type="text"
                        className={styles.tableInput}
                        value={item.description}
                        onChange={(event) =>
                          updateLineItem(item.key, { description: event.target.value })
                        }
                        placeholder="Goods or service"
                      />
                    </td>
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
                        aria-label={`Include VAT for ${item.description || 'line item'}`}
                      />
                    </td>
                    <td className={styles.vatCell}>{item.vatPercent}%</td>
                    <td className={styles.totalCell}>{formatBillMoney(item.lineTotal)}</td>
                    <td className={styles.actionCell}>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => handleRemoveLineItem(item.key)}
                        aria-label="Remove line item"
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
                  <td className={styles.grandTotalValue}>{formatBillMoney(grandTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className={styles.emptyProducts}>
            <Plus size={16} />
            <span>Add line items for goods or services purchased from this vendor.</span>
          </div>
        )}
      </section>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          Create Bill
        </Button>
      </div>
    </form>
  )
}

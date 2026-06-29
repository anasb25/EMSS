import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Check, FileText, Plus, X } from 'lucide-react'
import { fetchCustomers } from '@/api/customers'
import { fetchProducts } from '@/api/products'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import {
  SearchableSelect,
  type SearchableSelectOption,
} from '@/components/ui/SearchableSelect'
import { Textarea } from '@/components/ui/Textarea'
import {
  areAllWorkflowStepsComplete,
  createLineItemDraft,
  formatMoney,
  JOB_CARD_WORKFLOW_STEPS,
  jobCardToEditFormData,
  jobCardToLineItemDrafts,
  lineItemDraftsToFormItems,
  recalculateLineItemDraft,
  type JobCard,
  type JobCardEditFormData,
  type JobCardLineItemDraft,
  type JobCardWorkflowKey,
} from '@/types/job-card'
import formStyles from './JobCardForm.module.css'
import styles from './JobCardEditForm.module.css'

interface JobCardEditFormProps {
  jobCard: JobCard
  onSubmit: (data: JobCardEditFormData) => Promise<void>
  onGenerateInvoice: (data: JobCardEditFormData) => Promise<void>
  onCancel: () => void
}

const DROPDOWN_LIMIT = 20

export function JobCardEditForm({
  jobCard,
  onSubmit,
  onGenerateInvoice,
  onCancel,
}: JobCardEditFormProps) {
  const [form, setForm] = useState<JobCardEditFormData>(() => jobCardToEditFormData(jobCard))
  const [lineItems, setLineItems] = useState<JobCardLineItemDraft[]>(() =>
    jobCardToLineItemDrafts(jobCard),
  )
  const [customerLabel, setCustomerLabel] = useState(jobCard.customer?.name ?? '')
  const [customerOptions, setCustomerOptions] = useState<SearchableSelectOption[]>([])
  const [productOptions, setProductOptions] = useState<SearchableSelectOption[]>([])
  const [customerSearch, setCustomerSearch] = useState('')
  const [productSearch, setProductSearch] = useState('')
  const [pendingProductId, setPendingProductId] = useState('')
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false)

  useEffect(() => {
    setForm(jobCardToEditFormData(jobCard))
    setLineItems(jobCardToLineItemDrafts(jobCard))
    setCustomerLabel(jobCard.customer?.name ?? '')
    setError('')
    setPendingProductId('')
  }, [jobCard])

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
  const allStepsComplete = areAllWorkflowStepsComplete(form)

  function updateField<K extends keyof JobCardEditFormData>(
    field: K,
    value: JobCardEditFormData[K],
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

  function buildPayload(isClosed: boolean): JobCardEditFormData {
    return {
      ...form,
      items: lineItemDraftsToFormItems(lineItems),
      isOpen: !isClosed,
    }
  }

  function validateForm(): string | null {
    if (!form.customerId) {
      return 'Customer is required.'
    }

    if (!lineItems.length) {
      return 'Add at least one product.'
    }

    return null
  }

  function markStepComplete(key: JobCardWorkflowKey) {
    setForm((current) => {
      const next = { ...current, [key]: true }
      if (areAllWorkflowStepsComplete(next)) {
        next.isOpen = false
      }
      return next
    })
  }

  function markStepIncomplete(key: JobCardWorkflowKey) {
    setForm((current) => ({
      ...current,
      [key]: false,
      isOpen: true,
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(buildPayload(allStepsComplete))
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to update job card.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleGenerateInvoice() {
    if (!allStepsComplete) return

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setIsGeneratingInvoice(true)
    try {
      await onGenerateInvoice(buildPayload(true))
    } catch (invoiceError) {
      setError(
        invoiceError instanceof Error
          ? invoiceError.message
          : 'Unable to generate invoice.',
      )
    } finally {
      setIsGeneratingInvoice(false)
    }
  }

  const availableProductOptions = productOptions.filter(
    (option) => !lineItems.some((item) => item.productId === option.value),
  )

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.metaRow}>
        <div>
          <span className={styles.metaLabel}>Job Card ID</span>
          <strong className={styles.jobCardId}>{jobCard.jobCardNumber ?? '—'}</strong>
        </div>
        <Badge variant={form.isOpen ? 'success' : 'danger'}>
          {form.isOpen ? 'Open' : 'Closed'}
        </Badge>
      </div>

      <div className={styles.topGrid}>
        <section className={formStyles.section}>
          <h3 className={formStyles.sectionTitle}>Job Details</h3>
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
          <div className={formStyles.grid}>
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

        <section className={styles.workflowCard}>
          <h3 className={styles.cardTitle}>Workflow Steps</h3>
          <ul className={styles.workflowList}>
            {JOB_CARD_WORKFLOW_STEPS.map((step) => {
              const isComplete = form[step.key]

              return (
                <li
                  key={step.key}
                  className={[
                    styles.workflowItem,
                    isComplete ? styles.workflowItemComplete : '',
                  ].join(' ')}
                >
                  <div className={styles.workflowLeft}>
                    <span
                      className={[
                        styles.stepIcon,
                        isComplete ? styles.stepIconComplete : styles.stepIconPending,
                      ].join(' ')}
                    >
                      {isComplete ? (
                        <Check size={16} strokeWidth={2.5} />
                      ) : (
                        <X size={16} strokeWidth={2.5} />
                      )}
                    </span>
                    <span className={styles.stepLabel}>{step.label}</span>
                  </div>
                  {!isComplete ? (
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => markStepComplete(step.key)}
                    >
                      Mark as Complete
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      onClick={() => markStepIncomplete(step.key)}
                    >
                      Mark as Incomplete
                    </Button>
                  )}
                </li>
              )
            })}
          </ul>

          {allStepsComplete ? (
            <div className={styles.generateInvoiceSection}>
              <p className={styles.generateInvoiceHint}>
                All workflow steps are complete. You can now generate an invoice for this
                job card.
              </p>
              <Button
                type="button"
                onClick={handleGenerateInvoice}
                isLoading={isGeneratingInvoice}
                disabled={isSubmitting}
              >
                <FileText size={16} />
                Generate Invoice
              </Button>
            </div>
          ) : null}
        </section>
      </div>

      <section className={formStyles.section}>
        <div className={formStyles.sectionHeader}>
          <h3 className={formStyles.sectionTitle}>Products</h3>
          <span className={formStyles.countBadge}>{lineItems.length} added</span>
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
          <div className={formStyles.lineItemsTableWrap}>
            <table className={formStyles.lineItemsTable}>
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
                    <td className={formStyles.productNameCell}>{item.productName}</td>
                    <td>
                      <input
                        type="text"
                        className={formStyles.tableInput}
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
                        className={formStyles.tableInputNumber}
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
                        className={formStyles.tableInputNumber}
                        value={item.unitPrice}
                        onChange={(event) =>
                          updateLineItem(item.key, {
                            unitPrice: Number(event.target.value) || 0,
                          })
                        }
                      />
                    </td>
                    <td className={formStyles.checkboxCell}>
                      <input
                        type="checkbox"
                        checked={item.includeVat}
                        onChange={(event) =>
                          updateLineItem(item.key, { includeVat: event.target.checked })
                        }
                        aria-label={`Include VAT for ${item.productName}`}
                      />
                    </td>
                    <td className={formStyles.vatCell}>{item.vatPercent}%</td>
                    <td className={formStyles.totalCell}>{formatMoney(item.lineTotal)}</td>
                    <td className={formStyles.actionCell}>
                      <button
                        type="button"
                        className={formStyles.removeButton}
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
                  <td colSpan={6} className={formStyles.grandTotalLabel}>
                    Grand Total
                  </td>
                  <td className={formStyles.grandTotalValue}>{formatMoney(grandTotal)}</td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className={formStyles.emptyProducts}>
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
        <Button type="submit" isLoading={isSubmitting} disabled={isGeneratingInvoice}>
          Update Job Card
        </Button>
      </div>
    </form>
  )
}

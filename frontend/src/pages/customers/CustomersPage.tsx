import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import {
  createCustomer,
  deleteCustomer,
  fetchCustomers,
  updateCustomer,
  type CustomerStatusFilter,
} from '@/api/customers'
import { CustomerDetailsModal } from '@/components/customers/CustomerDetailsModal'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { CustomerTable } from '@/components/customers/CustomerTable'
import { ModulePage } from '@/components/common/ModulePage'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { useModal } from '@/hooks/useModal'
import { customerLedgerPath } from '@/types/customer-ledger'
import type { Customer, CustomerFormData } from '@/types/customer'
import type { PaginationMeta } from '@/types/pagination'
import styles from './CustomersPage.module.css'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

const STATUS_FILTERS: { label: string; value: CustomerStatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

const EMPTY_META: PaginationMeta = {
  total: 0,
  page: 1,
  limit: PAGE_SIZE,
  totalPages: 1,
}

export function CustomersPage() {
  const navigate = useNavigate()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<CustomerStatusFilter>('all')
  const [page, setPage] = useState(1)
  const formModal = useModal<Customer>()
  const viewModal = useModal<Customer>()
  const addButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [search])

  const loadCustomers = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetchCustomers({
        search: debouncedSearch,
        status: statusFilter,
        page,
        limit: PAGE_SIZE,
      })
      setCustomers(response.data)
      setMeta(response.meta)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load customers.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, statusFilter, page])

  useEffect(() => {
    void loadCustomers()
  }, [loadCustomers])

  const isEditing = Boolean(formModal.data)

  function handleStatusChange(nextStatus: CustomerStatusFilter) {
    setStatusFilter(nextStatus)
    setPage(1)
  }

  function handleEditFromView(customer: Customer) {
    formModal.open(customer)
  }

  async function handleSubmit(data: CustomerFormData) {
    if (formModal.data) {
      await updateCustomer(formModal.data.id, data)
    } else {
      await createCustomer(data)
    }

    formModal.close()
    await loadCustomers()
  }

  async function handleDelete(customer: Customer) {
    const confirmed = window.confirm(`Delete customer "${customer.name}"?`)
    if (!confirmed) return

    try {
      await deleteCustomer(customer.id)
      if (customers.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        await loadCustomers()
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete customer.',
      )
    }
  }

  function handleViewLedger(customer: Customer) {
    navigate(customerLedgerPath(customer.id))
  }

  return (
    <ModulePage
      title="Customers"
      description="Manage customer profiles, contact details, tax information, and status."
      actions={
        <Button ref={addButtonRef} onClick={() => formModal.open()}>
          <Plus size={16} strokeWidth={2.25} />
          Add Customer
        </Button>
      }
    >
      <div className={styles.page}>
        {error ? <p className={styles.error}>{error}</p> : null}

        <section className={styles.panel}>
          <div className={styles.toolbar}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search customers by name, email, phone, TRN..."
            />

            <div className={styles.filters} role="group" aria-label="Status filter">
              {STATUS_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={[
                    styles.filterButton,
                    statusFilter === filter.value ? styles.filterButtonActive : '',
                  ].join(' ')}
                  onClick={() => handleStatusChange(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <CustomerTable
            customers={customers}
            isLoading={isLoading}
            onView={viewModal.open}
            onViewLedger={handleViewLedger}
            onEdit={formModal.open}
            onDelete={handleDelete}
          />

          {!isLoading ? (
            <Pagination meta={meta} onPageChange={setPage} />
          ) : null}
        </section>
      </div>

      <CustomerDetailsModal
        customer={viewModal.data ?? null}
        isOpen={viewModal.isOpen}
        onClose={viewModal.close}
        onEdit={handleEditFromView}
        onViewLedger={handleViewLedger}
      />

      <Modal
        isOpen={formModal.isOpen}
        title={isEditing ? 'Edit Customer' : 'Add Customer'}
        description={
          isEditing
            ? 'Update customer details and active status.'
            : 'Fill in the details to create a new customer record.'
        }
        onClose={formModal.close}
        size="lg"
        anchorRef={isEditing ? undefined : addButtonRef}
      >
        <CustomerForm
          customer={formModal.data ?? null}
          onSubmit={handleSubmit}
          onCancel={formModal.close}
        />
      </Modal>
    </ModulePage>
  )
}

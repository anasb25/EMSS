import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  createVendor,
  deleteVendor,
  fetchVendors,
  updateVendor,
  type VendorStatusFilter,
} from '@/api/vendors'
import { ModulePage } from '@/components/common/ModulePage'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { VendorDetailsModal } from '@/components/vendors/VendorDetailsModal'
import { VendorForm } from '@/components/vendors/VendorForm'
import { VendorTable } from '@/components/vendors/VendorTable'
import { useModal } from '@/hooks/useModal'
import type { PaginationMeta } from '@/types/pagination'
import type { Vendor, VendorFormData } from '@/types/vendor'
import styles from './VendorsPage.module.css'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

const STATUS_FILTERS: { label: string; value: VendorStatusFilter }[] = [
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

export function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<VendorStatusFilter>('all')
  const [page, setPage] = useState(1)
  const formModal = useModal<Vendor>()
  const viewModal = useModal<Vendor>()
  const addButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [search])

  const loadVendors = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetchVendors({
        search: debouncedSearch,
        status: statusFilter,
        page,
        limit: PAGE_SIZE,
      })
      setVendors(response.data)
      setMeta(response.meta)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load vendors.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, statusFilter, page])

  useEffect(() => {
    void loadVendors()
  }, [loadVendors])

  const isEditing = Boolean(formModal.data)

  function handleStatusChange(nextStatus: VendorStatusFilter) {
    setStatusFilter(nextStatus)
    setPage(1)
  }

  function handleEditFromView(vendor: Vendor) {
    formModal.open(vendor)
  }

  async function handleSubmit(data: VendorFormData) {
    if (formModal.data) {
      await updateVendor(formModal.data.id, data)
    } else {
      await createVendor(data)
    }

    formModal.close()
    await loadVendors()
  }

  async function handleDelete(vendor: Vendor) {
    const confirmed = window.confirm(`Delete vendor "${vendor.name}"?`)
    if (!confirmed) return

    try {
      await deleteVendor(vendor.id)
      if (vendors.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        await loadVendors()
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete vendor.',
      )
    }
  }

  return (
    <ModulePage
      title="Vendors"
      description="Manage vendor profiles, contact details, and active status."
      actions={
        <Button ref={addButtonRef} onClick={() => formModal.open()}>
          <Plus size={16} strokeWidth={2.25} />
          Add Vendor
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
              placeholder="Search vendors by name, email, phone, country..."
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

          <VendorTable
            vendors={vendors}
            isLoading={isLoading}
            onView={viewModal.open}
            onEdit={formModal.open}
            onDelete={handleDelete}
          />

          {!isLoading ? (
            <Pagination meta={meta} onPageChange={setPage} />
          ) : null}
        </section>
      </div>

      <VendorDetailsModal
        vendor={viewModal.data ?? null}
        isOpen={viewModal.isOpen}
        onClose={viewModal.close}
        onEdit={handleEditFromView}
      />

      <Modal
        isOpen={formModal.isOpen}
        title={isEditing ? 'Edit Vendor' : 'Add Vendor'}
        description={
          isEditing
            ? 'Update vendor details and active status.'
            : 'Fill in the details to create a new vendor record.'
        }
        onClose={formModal.close}
        size="lg"
        anchorRef={isEditing ? undefined : addButtonRef}
      >
        <VendorForm
          vendor={formModal.data ?? null}
          onSubmit={handleSubmit}
          onCancel={formModal.close}
        />
      </Modal>
    </ModulePage>
  )
}

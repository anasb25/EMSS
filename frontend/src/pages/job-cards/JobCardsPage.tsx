import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { createInvoiceFromJobCard } from '@/api/invoices'
import {
  createJobCard,
  deleteJobCard,
  fetchJobCards,
  updateJobCard,
} from '@/api/job-cards'
import { JobCardDetailsModal } from '@/components/job-cards/JobCardDetailsModal'
import { JobCardEditForm } from '@/components/job-cards/JobCardEditForm'
import { JobCardForm } from '@/components/job-cards/JobCardForm'
import { JobCardTable } from '@/components/job-cards/JobCardTable'
import { ModulePage } from '@/components/common/ModulePage'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { useModal } from '@/hooks/useModal'
import { ROUTES } from '@/config/routes'
import type { JobCard, JobCardEditFormData, JobCardFormData } from '@/types/job-card'
import type { PaginationMeta } from '@/types/pagination'
import styles from './JobCardsPage.module.css'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

const EMPTY_META: PaginationMeta = {
  total: 0,
  page: 1,
  limit: PAGE_SIZE,
  totalPages: 1,
}

export function JobCardsPage() {
  const navigate = useNavigate()
  const [jobCards, setJobCards] = useState<JobCard[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const formModal = useModal<JobCard>()
  const viewModal = useModal<JobCard>()
  const addButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [search])

  const loadJobCards = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetchJobCards({
        search: debouncedSearch,
        page,
        limit: PAGE_SIZE,
      })
      setJobCards(response.data)
      setMeta(response.meta)
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Failed to load job cards.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, page])

  useEffect(() => {
    void loadJobCards()
  }, [loadJobCards])

  const isEditing = Boolean(formModal.data)

  function handleEditFromView(jobCard: JobCard) {
    formModal.open(jobCard)
  }

  async function handleCreate(data: JobCardFormData) {
    await createJobCard(data)
    formModal.close()
    await loadJobCards()
  }

  async function handleUpdate(data: JobCardEditFormData) {
    if (!formModal.data) return
    await updateJobCard(formModal.data.id, data)
    formModal.close()
    await loadJobCards()
  }

  async function handleGenerateInvoice(data: JobCardEditFormData) {
    if (!formModal.data) return
    await updateJobCard(formModal.data.id, {
      ...data,
      isOpen: false,
    })
    const invoice = await createInvoiceFromJobCard(formModal.data.id)
    formModal.close()
    navigate(`${ROUTES.invoices}/${invoice.id}`)
  }

  async function handleDelete(jobCard: JobCard) {
    const label = jobCard.customer?.name ?? 'this job card'
    const confirmed = window.confirm(`Delete job card for "${label}"?`)
    if (!confirmed) return

    try {
      await deleteJobCard(jobCard.id)
      if (jobCards.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        await loadJobCards()
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete job card.',
      )
    }
  }

  return (
    <ModulePage
      title="Job Cards"
      description="Create and manage job cards linked to customers and products."
      actions={
        <Button ref={addButtonRef} onClick={() => formModal.open()}>
          <Plus size={16} strokeWidth={2.25} />
          Add Job Card
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
              placeholder="Search by job card ID, customer, BL, declaration, container, product..."
            />
          </div>

          <JobCardTable
            jobCards={jobCards}
            isLoading={isLoading}
            onView={viewModal.open}
            onEdit={formModal.open}
            onDelete={handleDelete}
          />

          {!isLoading ? <Pagination meta={meta} onPageChange={setPage} /> : null}
        </section>
      </div>

      <JobCardDetailsModal
        jobCard={viewModal.data ?? null}
        isOpen={viewModal.isOpen}
        onClose={viewModal.close}
        onEdit={handleEditFromView}
      />

      <Modal
        isOpen={formModal.isOpen}
        title={isEditing ? 'Edit Job Card' : 'Add Job Card'}
        description={
          isEditing
            ? 'Review details, complete workflow steps, and update the job card.'
            : 'Link a customer, shipment details, and products.'
        }
        onClose={formModal.close}
        size="xl"
        anchorRef={isEditing ? undefined : addButtonRef}
      >
        {isEditing && formModal.data ? (
          <JobCardEditForm
            jobCard={formModal.data}
            onSubmit={handleUpdate}
            onGenerateInvoice={handleGenerateInvoice}
            onCancel={formModal.close}
          />
        ) : (
          <JobCardForm
            key={formModal.isOpen ? 'create' : 'create-hidden'}
            onSubmit={handleCreate}
            onCancel={formModal.close}
          />
        )}
      </Modal>
    </ModulePage>
  )
}

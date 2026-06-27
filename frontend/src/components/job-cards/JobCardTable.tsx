import { useMemo } from 'react'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import {
  formatDateTime,
  formatMoney,
  getJobCardGrandTotal,
  type JobCard,
} from '@/types/job-card'
import type { TableColumn } from '@/types/table'
import styles from './JobCardTable.module.css'

interface JobCardTableProps {
  jobCards: JobCard[]
  isLoading?: boolean
  onView: (jobCard: JobCard) => void
  onEdit: (jobCard: JobCard) => void
  onDelete: (jobCard: JobCard) => void
}

function DetailLine({ label, value }: { label: string; value: string | null }) {
  return (
    <div className={styles.detailLine}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value || '—'}</span>
    </div>
  )
}

export function JobCardTable({
  jobCards,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
}: JobCardTableProps) {
  const columns = useMemo<TableColumn<JobCard>[]>(
    () => [
      {
        key: 'details',
        header: 'Details',
        render: (jobCard) => (
          <div className={styles.detailsCell}>
            <DetailLine label="Job Card" value={jobCard.jobCardNumber} />
            <DetailLine label="BL" value={jobCard.blNumber} />
            <DetailLine label="Container" value={jobCard.containerNumber} />
            <DetailLine label="Declaration" value={jobCard.declarationNumber} />
          </div>
        ),
      },
      {
        key: 'customer',
        header: 'Customer',
        render: (jobCard) => (
          <span className={styles.customerName}>{jobCard.customer?.name ?? '—'}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (jobCard) => (
          <Badge variant={jobCard.isOpen ? 'success' : 'danger'}>
            {jobCard.isOpen ? 'Open' : 'Closed'}
          </Badge>
        ),
      },
      {
        key: 'creation',
        header: 'Creation',
        render: (jobCard) => (
          <div className={styles.creationCell}>
            <strong>{jobCard.createdBy?.username ?? '—'}</strong>
            <span>{formatDateTime(jobCard.createdAt)}</span>
          </div>
        ),
      },
      {
        key: 'total',
        header: 'Total',
        render: (jobCard) => (
          <span className={styles.totalCell}>
            {formatMoney(getJobCardGrandTotal(jobCard))}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        className: styles.actionsColumn,
        render: (jobCard) => (
          <div className={styles.rowActions}>
            <ActionIconButton
              variant="view"
              label="View job card"
              onClick={() => onView(jobCard)}
            >
              <Eye size={15} />
            </ActionIconButton>
            <ActionIconButton
              variant="edit"
              label="Edit job card"
              onClick={() => onEdit(jobCard)}
            >
              <Pencil size={15} />
            </ActionIconButton>
            <ActionIconButton
              variant="delete"
              label="Delete job card"
              onClick={() => onDelete(jobCard)}
            >
              <Trash2 size={15} />
            </ActionIconButton>
          </div>
        ),
      },
    ],
    [onView, onEdit, onDelete],
  )

  return (
    <Table
      data={jobCards}
      columns={columns}
      rowKey={(jobCard) => jobCard.id}
      isLoading={isLoading}
      loadingMessage="Loading job cards..."
      emptyMessage="No job cards yet. Click Add Job Card to create your first record."
    />
  )
}

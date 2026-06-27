import { useMemo } from 'react'
import { Eye, BookOpen, Pencil, Trash2 } from 'lucide-react'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import type { Customer } from '@/types/customer'
import type { TableColumn } from '@/types/table'
import styles from './CustomerTable.module.css'

interface CustomerTableProps {
  customers: Customer[]
  isLoading?: boolean
  onView: (customer: Customer) => void
  onViewLedger: (customer: Customer) => void
  onEdit: (customer: Customer) => void
  onDelete: (customer: Customer) => void
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function CustomerTable({
  customers,
  isLoading = false,
  onView,
  onViewLedger,
  onEdit,
  onDelete,
}: CustomerTableProps) {
  const columns = useMemo<TableColumn<Customer>[]>(
    () => [
      {
        key: 'name',
        header: 'Customer',
        render: (customer) => (
          <div className={styles.nameCell}>
            <div className={styles.avatar}>{getInitials(customer.name)}</div>
            <div className={styles.nameContent}>
              <strong>{customer.name}</strong>
              {customer.address ? <span>{customer.address}</span> : null}
            </div>
          </div>
        ),
      },
      {
        key: 'email',
        header: 'Email',
        render: (customer) => (
          <span className={styles.cellMuted}>{customer.email || '—'}</span>
        ),
      },
      {
        key: 'phone',
        header: 'Phone',
        render: (customer) => (
          <span className={styles.cellMuted}>{customer.phoneNumber || '—'}</span>
        ),
      },
      {
        key: 'mobile',
        header: 'Mobile',
        render: (customer) => (
          <span className={styles.cellMuted}>{customer.mobileNumber || '—'}</span>
        ),
      },
      {
        key: 'country',
        header: 'Country',
        render: (customer) => (
          <span className={styles.cellMuted}>{customer.country || '—'}</span>
        ),
      },
      {
        key: 'trn',
        header: 'TRN',
        render: (customer) => (
          <span className={styles.cellMuted}>{customer.trnNumber || '—'}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (customer) => (
          <Badge variant={customer.isActive ? 'success' : 'danger'}>
            {customer.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        className: styles.actionsColumn,
        render: (customer) => (
          <div className={styles.rowActions}>
            <ActionIconButton
              variant="view"
              label={`View ${customer.name}`}
              onClick={() => onView(customer)}
            >
              <Eye size={15} />
            </ActionIconButton>
            <ActionIconButton
              variant="view"
              label={`Open ledger for ${customer.name}`}
              onClick={() => onViewLedger(customer)}
            >
              <BookOpen size={15} />
            </ActionIconButton>
            <ActionIconButton
              variant="edit"
              label={`Edit ${customer.name}`}
              onClick={() => onEdit(customer)}
            >
              <Pencil size={15} />
            </ActionIconButton>
            <ActionIconButton
              variant="delete"
              label={`Delete ${customer.name}`}
              onClick={() => onDelete(customer)}
            >
              <Trash2 size={15} />
            </ActionIconButton>
          </div>
        ),
      },
    ],
    [onView, onViewLedger, onEdit, onDelete],
  )

  return (
    <Table
      data={customers}
      columns={columns}
      rowKey={(customer) => customer.id}
      isLoading={isLoading}
      loadingMessage="Loading customers..."
      emptyMessage="No customers yet. Click Add Customer to create your first record."
    />
  )
}

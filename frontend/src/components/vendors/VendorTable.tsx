import { useMemo } from 'react'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import type { Vendor } from '@/types/vendor'
import type { TableColumn } from '@/types/table'
import styles from './VendorTable.module.css'

interface VendorTableProps {
  vendors: Vendor[]
  isLoading?: boolean
  onView: (vendor: Vendor) => void
  onEdit: (vendor: Vendor) => void
  onDelete: (vendor: Vendor) => void
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export function VendorTable({
  vendors,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
}: VendorTableProps) {
  const columns = useMemo<TableColumn<Vendor>[]>(
    () => [
      {
        key: 'name',
        header: 'Vendor',
        render: (vendor) => (
          <div className={styles.nameCell}>
            <div className={styles.avatar}>{getInitials(vendor.name)}</div>
            <div className={styles.nameContent}>
              <strong>{vendor.name}</strong>
              {vendor.address ? <span>{vendor.address}</span> : null}
            </div>
          </div>
        ),
      },
      {
        key: 'email',
        header: 'Email',
        render: (vendor) => (
          <span className={styles.cellMuted}>{vendor.email || '—'}</span>
        ),
      },
      {
        key: 'phone',
        header: 'Phone',
        render: (vendor) => (
          <span className={styles.cellMuted}>{vendor.phoneNumber || '—'}</span>
        ),
      },
      {
        key: 'mobile',
        header: 'Mobile',
        render: (vendor) => (
          <span className={styles.cellMuted}>{vendor.mobileNumber || '—'}</span>
        ),
      },
      {
        key: 'country',
        header: 'Country',
        render: (vendor) => (
          <span className={styles.cellMuted}>{vendor.country || '—'}</span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (vendor) => (
          <Badge variant={vendor.isActive ? 'success' : 'danger'}>
            {vendor.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        className: styles.actionsColumn,
        render: (vendor) => (
          <div className={styles.rowActions}>
            <ActionIconButton
              variant="view"
              label={`View ${vendor.name}`}
              onClick={() => onView(vendor)}
            >
              <Eye size={15} />
            </ActionIconButton>
            <ActionIconButton
              variant="edit"
              label={`Edit ${vendor.name}`}
              onClick={() => onEdit(vendor)}
            >
              <Pencil size={15} />
            </ActionIconButton>
            <ActionIconButton
              variant="delete"
              label={`Delete ${vendor.name}`}
              onClick={() => onDelete(vendor)}
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
      data={vendors}
      columns={columns}
      rowKey={(vendor) => vendor.id}
      isLoading={isLoading}
      loadingMessage="Loading vendors..."
      emptyMessage="No vendors yet. Click Add Vendor to create your first record."
    />
  )
}

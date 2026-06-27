import { useMemo } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import type { Product } from '@/types/product'
import type { TableColumn } from '@/types/table'
import styles from './ProductTable.module.css'

interface ProductTableProps {
  products: Product[]
  isLoading?: boolean
  onEdit: (product: Product) => void
  onDelete: (product: Product) => void
}

export function ProductTable({
  products,
  isLoading = false,
  onEdit,
  onDelete,
}: ProductTableProps) {
  const columns = useMemo<TableColumn<Product>[]>(
    () => [
      {
        key: 'name',
        header: 'Product',
        render: (product) => (
          <div className={styles.nameCell}>
            <div className={styles.avatar}>{product.name.charAt(0).toUpperCase()}</div>
            <strong>{product.name}</strong>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (product) => (
          <Badge variant={product.isActive ? 'success' : 'danger'}>
            {product.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        className: styles.actionsColumn,
        render: (product) => (
          <div className={styles.rowActions}>
            <ActionIconButton
              variant="edit"
              label={`Edit ${product.name}`}
              onClick={() => onEdit(product)}
            >
              <Pencil size={15} />
            </ActionIconButton>
            <ActionIconButton
              variant="delete"
              label={`Delete ${product.name}`}
              onClick={() => onDelete(product)}
            >
              <Trash2 size={15} />
            </ActionIconButton>
          </div>
        ),
      },
    ],
    [onEdit, onDelete],
  )

  return (
    <Table
      data={products}
      columns={columns}
      rowKey={(product) => product.id}
      isLoading={isLoading}
      loadingMessage="Loading products..."
      emptyMessage="No products yet. Click Add Product to create your first record."
    />
  )
}

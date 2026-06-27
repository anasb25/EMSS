import { useMemo } from 'react'
import { Eye, Pencil, Trash2 } from 'lucide-react'
import { ActionIconButton } from '@/components/ui/ActionIconButton'
import { Badge } from '@/components/ui/Badge'
import { Table } from '@/components/ui/Table'
import { formatUserDate, roleLabel, RoleName, type User } from '@/types/user'
import type { TableColumn } from '@/types/table'
import styles from './UserTable.module.css'

interface UserTableProps {
  users: User[]
  isLoading?: boolean
  onView: (user: User) => void
  onEdit: (user: User) => void
  onDelete: (user: User) => void
}

function getInitials(username: string) {
  return username.slice(0, 2).toUpperCase()
}

export function UserTable({
  users,
  isLoading = false,
  onView,
  onEdit,
  onDelete,
}: UserTableProps) {
  const columns = useMemo<TableColumn<User>[]>(
    () => [
      {
        key: 'username',
        header: 'User',
        render: (user) => (
          <div className={styles.nameCell}>
            <div className={styles.avatar}>{getInitials(user.username)}</div>
            <div className={styles.nameContent}>
              <strong>{user.username}</strong>
              <span>ID {user.id.slice(0, 8)}</span>
            </div>
          </div>
        ),
      },
      {
        key: 'role',
        header: 'Role',
        render: (user) => (
          <Badge variant={user.role === RoleName.ADMIN ? 'success' : 'neutral'}>
            {roleLabel(user.role)}
          </Badge>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (user) => (
          <Badge variant={user.isActive ? 'success' : 'danger'}>
            {user.isActive ? 'Active' : 'Inactive'}
          </Badge>
        ),
      },
      {
        key: 'createdAt',
        header: 'Created',
        render: (user) => (
          <span className={styles.cellMuted}>{formatUserDate(user.createdAt)}</span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        align: 'right',
        className: styles.actionsColumn,
        render: (user) => (
          <div className={styles.rowActions}>
            <ActionIconButton
              variant="view"
              label={`View ${user.username}`}
              onClick={() => onView(user)}
            >
              <Eye size={15} />
            </ActionIconButton>
            <ActionIconButton
              variant="edit"
              label={`Edit ${user.username}`}
              onClick={() => onEdit(user)}
            >
              <Pencil size={15} />
            </ActionIconButton>
            <ActionIconButton
              variant="delete"
              label={`Delete ${user.username}`}
              onClick={() => onDelete(user)}
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
      columns={columns}
      data={users}
      rowKey={(user) => user.id}
      isLoading={isLoading}
      emptyMessage="No users found."
    />
  )
}

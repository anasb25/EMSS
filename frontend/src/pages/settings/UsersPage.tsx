import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  createUser,
  deleteUser,
  fetchUsers,
  updateUser,
} from '@/api/users'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { UserDetailsModal } from '@/components/users/UserDetailsModal'
import { UserForm } from '@/components/users/UserForm'
import { UserTable } from '@/components/users/UserTable'
import { useModal } from '@/hooks/useModal'
import {
  RoleName,
  type User,
  type UserFormData,
  type UserRoleFilter,
  type UserStatusFilter,
} from '@/types/user'
import type { PaginationMeta } from '@/types/pagination'
import styles from './UsersPage.module.css'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

const STATUS_FILTERS: { label: string; value: UserStatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

const ROLE_FILTERS: { label: string; value: UserRoleFilter }[] = [
  { label: 'All roles', value: 'all' },
  { label: 'Admin', value: RoleName.ADMIN },
  { label: 'User', value: RoleName.USER },
]

const EMPTY_META: PaginationMeta = {
  total: 0,
  page: 1,
  limit: PAGE_SIZE,
  totalPages: 1,
}

export function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserStatusFilter>('all')
  const [roleFilter, setRoleFilter] = useState<UserRoleFilter>('all')
  const [page, setPage] = useState(1)
  const formModal = useModal<User>()
  const viewModal = useModal<User>()
  const addButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [search])

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetchUsers({
        search: debouncedSearch,
        status: statusFilter,
        role: roleFilter,
        page,
        limit: PAGE_SIZE,
      })
      setUsers(response.data)
      setMeta(response.meta)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load users.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, statusFilter, roleFilter, page])

  useEffect(() => {
    void loadUsers()
  }, [loadUsers])

  const isEditing = Boolean(formModal.data)

  function handleStatusChange(nextStatus: UserStatusFilter) {
    setStatusFilter(nextStatus)
    setPage(1)
  }

  function handleRoleChange(nextRole: UserRoleFilter) {
    setRoleFilter(nextRole)
    setPage(1)
  }

  function handleEditFromView(user: User) {
    formModal.open(user)
  }

  async function handleSubmit(data: UserFormData) {
    if (formModal.data) {
      await updateUser(formModal.data.id, data)
    } else {
      await createUser(data)
    }

    formModal.close()
    await loadUsers()
  }

  async function handleDelete(user: User) {
    const confirmed = window.confirm(`Delete user "${user.username}"?`)
    if (!confirmed) return

    try {
      await deleteUser(user.id)
      if (users.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        await loadUsers()
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete user.',
      )
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <div>
          <h2 className={styles.title}>User Management</h2>
          <p className={styles.description}>
            Add users, assign roles, and control who can access EMSS.
          </p>
        </div>
        <Button ref={addButtonRef} onClick={() => formModal.open()}>
          <Plus size={16} strokeWidth={2.25} />
          Add User
        </Button>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <section className={styles.panel}>
        <div className={styles.toolbar}>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search users by username..."
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

          <div className={styles.filters} role="group" aria-label="Role filter">
            {ROLE_FILTERS.map((filter) => (
              <button
                key={filter.value}
                type="button"
                className={[
                  styles.filterButton,
                  roleFilter === filter.value ? styles.filterButtonActive : '',
                ].join(' ')}
                onClick={() => handleRoleChange(filter.value)}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>

        <UserTable
          users={users}
          isLoading={isLoading}
          onView={viewModal.open}
          onEdit={formModal.open}
          onDelete={(user) => {
            void handleDelete(user)
          }}
        />

        {!isLoading ? (
          <Pagination meta={meta} onPageChange={setPage} />
        ) : null}
      </section>

      <UserDetailsModal
        user={viewModal.data ?? null}
        isOpen={viewModal.isOpen}
        onClose={viewModal.close}
        onEdit={handleEditFromView}
      />

      <Modal
        isOpen={formModal.isOpen}
        title={isEditing ? 'Edit User' : 'Add User'}
        description={
          isEditing
            ? 'Update username, role, password, or active status.'
            : 'Create a new user account with a role and password.'
        }
        onClose={formModal.close}
        size="md"
        anchorRef={isEditing ? undefined : addButtonRef}
      >
        <UserForm
          user={formModal.data ?? null}
          onSubmit={handleSubmit}
          onCancel={formModal.close}
        />
      </Modal>
    </div>
  )
}

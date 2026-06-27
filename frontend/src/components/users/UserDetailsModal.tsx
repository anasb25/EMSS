import { Shield, UserRound } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { formatUserDate, roleLabel, RoleName, type User } from '@/types/user'
import styles from './UserDetailsModal.module.css'

interface UserDetailsModalProps {
  user: User | null
  isOpen: boolean
  onClose: () => void
  onEdit: (user: User) => void
}

export function UserDetailsModal({
  user,
  isOpen,
  onClose,
  onEdit,
}: UserDetailsModalProps) {
  if (!user) return null

  const selectedUser = user

  function handleEdit() {
    onClose()
    onEdit(selectedUser)
  }

  return (
    <Modal
      isOpen={isOpen}
      title="User Details"
      description="Account access and role information."
      onClose={onClose}
      size="md"
    >
      <div className={styles.content}>
        <div className={styles.hero}>
          <div className={styles.avatar}>
            <UserRound size={24} />
          </div>
          <div>
            <h3 className={styles.name}>{user.username}</h3>
            <div className={styles.badges}>
              <Badge variant={user.role === RoleName.ADMIN ? 'success' : 'neutral'}>
                <Shield size={12} />
                {roleLabel(user.role)}
              </Badge>
              <Badge variant={user.isActive ? 'success' : 'danger'}>
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>

        <dl className={styles.details}>
          <div>
            <dt>Username</dt>
            <dd>{user.username}</dd>
          </div>
          <div>
            <dt>Role</dt>
            <dd>{roleLabel(user.role)}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{user.isActive ? 'Active' : 'Inactive'}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatUserDate(user.createdAt)}</dd>
          </div>
          <div>
            <dt>Last updated</dt>
            <dd>{formatUserDate(user.updatedAt)}</dd>
          </div>
        </dl>

        <div className={styles.actions}>
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button onClick={handleEdit}>Edit User</Button>
        </div>
      </div>
    </Modal>
  )
}

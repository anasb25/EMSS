import { type FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { USER_ROLE_OPTIONS } from '@/api/users'
import {
  emptyUserForm,
  userToFormData,
  type User,
  type UserFormData,
} from '@/types/user'
import styles from './UserForm.module.css'

interface UserFormProps {
  user?: User | null
  onSubmit: (data: UserFormData) => Promise<void>
  onCancel: () => void
}

export function UserForm({ user, onSubmit, onCancel }: UserFormProps) {
  const [form, setForm] = useState<UserFormData>(emptyUserForm())
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const isEditing = Boolean(user)

  useEffect(() => {
    setForm(user ? userToFormData(user) : emptyUserForm())
    setError('')
  }, [user])

  function updateField<K extends keyof UserFormData>(
    field: K,
    value: UserFormData[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!form.username.trim()) {
      setError('Username is required.')
      return
    }

    if (!isEditing && form.password.trim().length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    if (isEditing && form.password.trim() && form.password.trim().length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(form)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to save user.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Account</h3>
        <div className={styles.grid}>
          <Input
            label="Username"
            name="username"
            value={form.username}
            onChange={(event) => updateField('username', event.target.value)}
            placeholder="jane.smith"
            required
            autoComplete="off"
          />
          <Input
            label={isEditing ? 'New Password' : 'Password'}
            name="password"
            type="password"
            value={form.password}
            onChange={(event) => updateField('password', event.target.value)}
            placeholder={isEditing ? 'Leave blank to keep current' : 'Minimum 6 characters'}
            required={!isEditing}
            autoComplete="new-password"
          />
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Access</h3>
        <div className={styles.grid}>
          <label className={styles.field}>
            <span className={styles.label}>Role</span>
            <select
              className={styles.select}
              value={form.role}
              onChange={(event) =>
                updateField('role', event.target.value as UserFormData['role'])
              }
            >
              {USER_ROLE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className={styles.statusCard}>
        <div>
          <strong>Active Status</strong>
          <span>Inactive users cannot sign in to EMSS.</span>
        </div>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => updateField('isActive', event.target.checked)}
          />
          <span>{form.isActive ? 'Active' : 'Inactive'}</span>
        </label>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Add User'}
        </Button>
      </div>
    </form>
  )
}

import { type FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import {
  customerToFormData,
  emptyCustomerForm,
  type Customer,
  type CustomerFormData,
} from '@/types/customer'
import styles from './CustomerForm.module.css'

interface CustomerFormProps {
  customer?: Customer | null
  onSubmit: (data: CustomerFormData) => Promise<void>
  onCancel: () => void
}

export function CustomerForm({ customer, onSubmit, onCancel }: CustomerFormProps) {
  const [form, setForm] = useState<CustomerFormData>(emptyCustomerForm())
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setForm(customer ? customerToFormData(customer) : emptyCustomerForm())
    setError('')
  }, [customer])

  function updateField<K extends keyof CustomerFormData>(
    field: K,
    value: CustomerFormData[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!form.name.trim()) {
      setError('Name is required.')
      return
    }

    setIsSubmitting(true)
    try {
      await onSubmit(form)
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : 'Unable to save customer.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Basic Information</h3>
        <div className={styles.grid}>
          <Input
            label="Name"
            name="name"
            value={form.name}
            onChange={(event) => updateField('name', event.target.value)}
            placeholder="Customer name"
            required
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={(event) => updateField('email', event.target.value)}
            placeholder="email@company.com"
          />
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Contact Details</h3>
        <div className={styles.grid}>
          <Input
            label="Phone Number"
            name="phoneNumber"
            value={form.phoneNumber}
            onChange={(event) => updateField('phoneNumber', event.target.value)}
            placeholder="+971 4 000 0000"
          />
          <Input
            label="Mobile Number"
            name="mobileNumber"
            value={form.mobileNumber}
            onChange={(event) => updateField('mobileNumber', event.target.value)}
            placeholder="+971 50 000 0000"
          />
        </div>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Tax & Location</h3>
        <div className={styles.grid}>
          <Input
            label="Country"
            name="country"
            value={form.country}
            onChange={(event) => updateField('country', event.target.value)}
            placeholder="United Arab Emirates"
          />
          <Input
            label="TRN Number"
            name="trnNumber"
            value={form.trnNumber}
            onChange={(event) => updateField('trnNumber', event.target.value)}
            placeholder="Tax registration number"
          />
        </div>
        <Textarea
          label="Address"
          name="address"
          value={form.address}
          onChange={(event) => updateField('address', event.target.value)}
          placeholder="Street, city, postal code"
        />
      </section>

      <div className={styles.statusCard}>
        <div>
          <strong>Active Status</strong>
          <span>Inactive customers are hidden from active workflows.</span>
        </div>
        <label className={styles.toggle}>
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => updateField('isActive', event.target.checked)}
          />
          <span className={styles.toggleTrack}>
            <span className={styles.toggleThumb} />
          </span>
        </label>
      </div>

      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {customer ? 'Update Customer' : 'Create Customer'}
        </Button>
      </div>
    </form>
  )
}

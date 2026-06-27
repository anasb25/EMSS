import { type FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import {
  emptyVendorForm,
  vendorToFormData,
  type Vendor,
  type VendorFormData,
} from '@/types/vendor'
import styles from './VendorForm.module.css'

interface VendorFormProps {
  vendor?: Vendor | null
  onSubmit: (data: VendorFormData) => Promise<void>
  onCancel: () => void
}

export function VendorForm({ vendor, onSubmit, onCancel }: VendorFormProps) {
  const [form, setForm] = useState<VendorFormData>(emptyVendorForm())
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setForm(vendor ? vendorToFormData(vendor) : emptyVendorForm())
    setError('')
  }, [vendor])

  function updateField<K extends keyof VendorFormData>(
    field: K,
    value: VendorFormData[K],
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
          : 'Unable to save vendor.',
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
            placeholder="Vendor name"
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
        <h3 className={styles.sectionTitle}>Location</h3>
        <div className={styles.grid}>
          <Input
            label="Country"
            name="country"
            value={form.country}
            onChange={(event) => updateField('country', event.target.value)}
            placeholder="United Arab Emirates"
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
          <span>Inactive vendors are hidden from active workflows.</span>
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
          {vendor ? 'Update Vendor' : 'Create Vendor'}
        </Button>
      </div>
    </form>
  )
}

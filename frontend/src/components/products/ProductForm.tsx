import { type FormEvent, useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import {
  emptyProductForm,
  productToFormData,
  type Product,
  type ProductFormData,
} from '@/types/product'
import styles from './ProductForm.module.css'

interface ProductFormProps {
  product?: Product | null
  onSubmit: (data: ProductFormData) => Promise<void>
  onCancel: () => void
}

export function ProductForm({ product, onSubmit, onCancel }: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>(emptyProductForm())
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    setForm(product ? productToFormData(product) : emptyProductForm())
    setError('')
  }, [product])

  function updateField<K extends keyof ProductFormData>(
    field: K,
    value: ProductFormData[K],
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
          : 'Unable to save product.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <Input
        label="Product Name"
        name="name"
        value={form.name}
        onChange={(event) => updateField('name', event.target.value)}
        placeholder="Enter product name"
        required
      />

      <div className={styles.statusCard}>
        <div>
          <strong>Active Status</strong>
          <span>Inactive products are hidden from job card selection.</span>
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
          {product ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  )
}

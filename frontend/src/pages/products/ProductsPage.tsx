import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  createProduct,
  deleteProduct,
  fetchProducts,
  updateProduct,
  type ProductStatusFilter,
} from '@/api/products'
import { ProductForm } from '@/components/products/ProductForm'
import { ProductTable } from '@/components/products/ProductTable'
import { ModulePage } from '@/components/common/ModulePage'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { useModal } from '@/hooks/useModal'
import type { Product, ProductFormData } from '@/types/product'
import type { PaginationMeta } from '@/types/pagination'
import styles from './ProductsPage.module.css'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

const STATUS_FILTERS: { label: string; value: ProductStatusFilter }[] = [
  { label: 'All', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
]

const EMPTY_META: PaginationMeta = {
  total: 0,
  page: 1,
  limit: PAGE_SIZE,
  totalPages: 1,
}

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProductStatusFilter>('all')
  const [page, setPage] = useState(1)
  const formModal = useModal<Product>()
  const addButtonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [search])

  const loadProducts = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetchProducts({
        search: debouncedSearch,
        status: statusFilter,
        page,
        limit: PAGE_SIZE,
      })
      setProducts(response.data)
      setMeta(response.meta)
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : 'Failed to load products.',
      )
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, statusFilter, page])

  useEffect(() => {
    void loadProducts()
  }, [loadProducts])

  const isEditing = Boolean(formModal.data)

  function handleStatusChange(nextStatus: ProductStatusFilter) {
    setStatusFilter(nextStatus)
    setPage(1)
  }

  async function handleSubmit(data: ProductFormData) {
    if (formModal.data) {
      await updateProduct(formModal.data.id, data)
    } else {
      await createProduct(data)
    }

    formModal.close()
    await loadProducts()
  }

  async function handleDelete(product: Product) {
    const confirmed = window.confirm(`Delete product "${product.name}"?`)
    if (!confirmed) return

    try {
      await deleteProduct(product.id)
      if (products.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        await loadProducts()
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete product.',
      )
    }
  }

  return (
    <ModulePage
      title="Products"
      description="Manage products used on job cards and workflows."
      actions={
        <Button ref={addButtonRef} onClick={() => formModal.open()}>
          <Plus size={16} strokeWidth={2.25} />
          Add Product
        </Button>
      }
    >
      <div className={styles.page}>
        {error ? <p className={styles.error}>{error}</p> : null}

        <section className={styles.panel}>
          <div className={styles.toolbar}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search products by name..."
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
          </div>

          <ProductTable
            products={products}
            isLoading={isLoading}
            onEdit={formModal.open}
            onDelete={handleDelete}
          />

          {!isLoading ? <Pagination meta={meta} onPageChange={setPage} /> : null}
        </section>
      </div>

      <Modal
        isOpen={formModal.isOpen}
        title={isEditing ? 'Edit Product' : 'Add Product'}
        description={
          isEditing
            ? 'Update product name and active status.'
            : 'Create a new product for job cards.'
        }
        onClose={formModal.close}
        size="md"
        anchorRef={isEditing ? undefined : addButtonRef}
      >
        <ProductForm
          product={formModal.data ?? null}
          onSubmit={handleSubmit}
          onCancel={formModal.close}
        />
      </Modal>
    </ModulePage>
  )
}

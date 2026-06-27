export interface Product {
  id: string
  name: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface ProductFormData {
  name: string
  isActive: boolean
}

export const emptyProductForm = (): ProductFormData => ({
  name: '',
  isActive: true,
})

export function productToFormData(product: Product): ProductFormData {
  return {
    name: product.name,
    isActive: product.isActive,
  }
}

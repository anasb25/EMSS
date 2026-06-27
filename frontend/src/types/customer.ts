export interface Customer {
  id: string
  name: string
  email: string | null
  phoneNumber: string | null
  mobileNumber: string | null
  country: string | null
  trnNumber: string | null
  address: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface CustomerFormData {
  name: string
  email: string
  phoneNumber: string
  mobileNumber: string
  country: string
  trnNumber: string
  address: string
  isActive: boolean
}

export const emptyCustomerForm = (): CustomerFormData => ({
  name: '',
  email: '',
  phoneNumber: '',
  mobileNumber: '',
  country: '',
  trnNumber: '',
  address: '',
  isActive: true,
})

export function customerToFormData(customer: Customer): CustomerFormData {
  return {
    name: customer.name,
    email: customer.email ?? '',
    phoneNumber: customer.phoneNumber ?? '',
    mobileNumber: customer.mobileNumber ?? '',
    country: customer.country ?? '',
    trnNumber: customer.trnNumber ?? '',
    address: customer.address ?? '',
    isActive: customer.isActive,
  }
}

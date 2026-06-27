export interface Vendor {
  id: string
  name: string
  email: string | null
  phoneNumber: string | null
  mobileNumber: string | null
  country: string | null
  address: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface VendorFormData {
  name: string
  email: string
  phoneNumber: string
  mobileNumber: string
  country: string
  address: string
  isActive: boolean
}

export const emptyVendorForm = (): VendorFormData => ({
  name: '',
  email: '',
  phoneNumber: '',
  mobileNumber: '',
  country: '',
  address: '',
  isActive: true,
})

export function vendorToFormData(vendor: Vendor): VendorFormData {
  return {
    name: vendor.name,
    email: vendor.email ?? '',
    phoneNumber: vendor.phoneNumber ?? '',
    mobileNumber: vendor.mobileNumber ?? '',
    country: vendor.country ?? '',
    address: vendor.address ?? '',
    isActive: vendor.isActive,
  }
}

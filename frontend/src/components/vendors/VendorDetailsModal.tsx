import type { ReactNode } from 'react'
import {
  Building2,
  Globe,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Smartphone,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { Vendor } from '@/types/vendor'
import styles from './VendorDetailsModal.module.css'

interface VendorDetailsModalProps {
  vendor: Vendor | null
  isOpen: boolean
  onClose: () => void
  onEdit: (vendor: Vendor) => void
}

function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function DetailItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className={styles.detailItem}>
      <div className={styles.detailIcon}>{icon}</div>
      <div>
        <p className={styles.detailLabel}>{label}</p>
        <p className={styles.detailValue}>{value}</p>
      </div>
    </div>
  )
}

export function VendorDetailsModal({
  vendor,
  isOpen,
  onClose,
  onEdit,
}: VendorDetailsModalProps) {
  if (!vendor) return null

  const selectedVendor = vendor

  function handleEdit() {
    onClose()
    onEdit(selectedVendor)
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Vendor Details"
      description="Full profile and contact information."
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button type="button" onClick={handleEdit}>
            <Pencil size={15} />
            Edit Vendor
          </Button>
        </>
      }
    >
      <div className={styles.content}>
        <div className={styles.hero}>
          <div className={styles.avatar}>{getInitials(selectedVendor.name)}</div>
          <div className={styles.heroText}>
            <h3 className={styles.name}>{selectedVendor.name}</h3>
            <Badge variant={selectedVendor.isActive ? 'success' : 'danger'}>
              {selectedVendor.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Contact Information</h4>
          <div className={styles.detailGrid}>
            <DetailItem
              icon={<Mail size={16} />}
              label="Email"
              value={selectedVendor.email || '—'}
            />
            <DetailItem
              icon={<Phone size={16} />}
              label="Phone Number"
              value={selectedVendor.phoneNumber || '—'}
            />
            <DetailItem
              icon={<Smartphone size={16} />}
              label="Mobile Number"
              value={selectedVendor.mobileNumber || '—'}
            />
          </div>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Location</h4>
          <div className={styles.detailGrid}>
            <DetailItem
              icon={<Globe size={16} />}
              label="Country"
              value={selectedVendor.country || '—'}
            />
            <DetailItem
              icon={<MapPin size={16} />}
              label="Address"
              value={selectedVendor.address || '—'}
            />
          </div>
        </div>

        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <Building2 size={15} />
            <span>Created {formatDate(selectedVendor.createdAt)}</span>
          </div>
          <div className={styles.metaItem}>
            <Building2 size={15} />
            <span>Updated {formatDate(selectedVendor.updatedAt)}</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}

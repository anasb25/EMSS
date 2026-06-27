import type { ReactNode } from 'react'
import {
  Building2,
  Globe,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Receipt,
  Smartphone,
  BookOpen,
} from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import type { Customer } from '@/types/customer'
import styles from './CustomerDetailsModal.module.css'

interface CustomerDetailsModalProps {
  customer: Customer | null
  isOpen: boolean
  onClose: () => void
  onEdit: (customer: Customer) => void
  onViewLedger: (customer: Customer) => void
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

export function CustomerDetailsModal({
  customer,
  isOpen,
  onClose,
  onEdit,
  onViewLedger,
}: CustomerDetailsModalProps) {
  if (!customer) return null

  const selectedCustomer = customer

  function handleEdit() {
    onClose()
    onEdit(selectedCustomer)
  }

  function handleViewLedger() {
    onClose()
    onViewLedger(selectedCustomer)
  }

  return (
    <Modal
      isOpen={isOpen}
      title="Customer Details"
      description="Full profile and contact information."
      onClose={onClose}
      size="lg"
      footer={
        <>
          <Button type="button" variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button type="button" variant="secondary" onClick={handleViewLedger}>
            <BookOpen size={15} />
            View Ledger
          </Button>
          <Button type="button" onClick={handleEdit}>
            <Pencil size={15} />
            Edit Customer
          </Button>
        </>
      }
    >
      <div className={styles.content}>
        <div className={styles.hero}>
          <div className={styles.avatar}>{getInitials(selectedCustomer.name)}</div>
          <div className={styles.heroText}>
            <h3 className={styles.name}>{selectedCustomer.name}</h3>
            <Badge variant={selectedCustomer.isActive ? 'success' : 'danger'}>
              {selectedCustomer.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Contact Information</h4>
          <div className={styles.detailGrid}>
            <DetailItem
              icon={<Mail size={16} />}
              label="Email"
              value={selectedCustomer.email || '—'}
            />
            <DetailItem
              icon={<Phone size={16} />}
              label="Phone Number"
              value={selectedCustomer.phoneNumber || '—'}
            />
            <DetailItem
              icon={<Smartphone size={16} />}
              label="Mobile Number"
              value={selectedCustomer.mobileNumber || '—'}
            />
          </div>
        </div>

        <div className={styles.section}>
          <h4 className={styles.sectionTitle}>Business & Location</h4>
          <div className={styles.detailGrid}>
            <DetailItem
              icon={<Globe size={16} />}
              label="Country"
              value={selectedCustomer.country || '—'}
            />
            <DetailItem
              icon={<Receipt size={16} />}
              label="TRN Number"
              value={selectedCustomer.trnNumber || '—'}
            />
            <DetailItem
              icon={<MapPin size={16} />}
              label="Address"
              value={selectedCustomer.address || '—'}
            />
          </div>
        </div>

        <div className={styles.meta}>
          <div className={styles.metaItem}>
            <Building2 size={15} />
            <span>Created {formatDate(selectedCustomer.createdAt)}</span>
          </div>
          <div className={styles.metaItem}>
            <Building2 size={15} />
            <span>Updated {formatDate(selectedCustomer.updatedAt)}</span>
          </div>
        </div>
      </div>
    </Modal>
  )
}

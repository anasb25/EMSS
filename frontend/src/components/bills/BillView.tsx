import { Receipt, Truck, User } from 'lucide-react'
import {
  formatBillDate,
  formatBillDateLong,
  formatBillMoney,
  type Bill,
} from '@/types/bill'
import styles from './BillView.module.css'

interface BillViewProps {
  bill: Bill
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailRow}>
      <p className={styles.detailLabel}>{label}</p>
      <p className={styles.detailValue}>{value}</p>
    </div>
  )
}

export function BillView({ bill }: BillViewProps) {
  const vendor = bill.vendor

  return (
    <div className={styles.billView}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerIcon}>
            <Receipt size={24} />
          </div>
          <div>
            <h1 className={styles.headerTitle}>{bill.billNumber}</h1>
            <p className={styles.headerSubtitle}>
              Bill from {vendor?.name ?? 'Vendor'}
              {bill.vendorReference ? ` · Ref ${bill.vendorReference}` : ''}
            </p>
          </div>
        </div>
        <div className={styles.headerMeta}>
          <strong>Bill Date</strong>
          <span>{formatBillDate(bill.billDate)}</span>
          <strong style={{ marginTop: '0.75rem' }}>Due Date</strong>
          <span>{formatBillDate(bill.dueDate)}</span>
          {bill.createdBy ? (
            <>
              <strong style={{ marginTop: '0.75rem' }}>Created by</strong>
              <span>{bill.createdBy.username}</span>
            </>
          ) : null}
        </div>
      </header>

      <section className={styles.infoCard}>
        <div className={styles.infoCardHeader}>
          <h2 className={styles.infoCardTitle}>
            <User size={18} />
            Vendor Information
          </h2>
        </div>
        <div className={styles.infoCardBody}>
          <DetailRow label="Name" value={vendor?.name ?? '—'} />
          <DetailRow label="Email" value={vendor?.email ?? '—'} />
          <DetailRow label="Phone" value={vendor?.phoneNumber ?? '—'} />
          <DetailRow label="Mobile" value={vendor?.mobileNumber ?? '—'} />
          <DetailRow label="Country" value={vendor?.country ?? '—'} />
          <DetailRow label="Address" value={vendor?.address ?? '—'} />
          {bill.notes ? <DetailRow label="Notes" value={bill.notes} /> : null}
        </div>
      </section>

      <section className={styles.productsSection}>
        <div className={styles.productsHeader}>
          <h2 className={styles.productsTitle}>
            <Truck size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '0.4rem' }} />
            Line Items
          </h2>
        </div>
        <div className={styles.tableWrap}>
          <table className={styles.productsTable}>
            <thead>
              <tr>
                <th>Description</th>
                <th>Note</th>
                <th>Qty</th>
                <th>Unit Price</th>
                <th>VAT</th>
                <th>Subtotal</th>
                <th>VAT Amt</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <span className={styles.productName}>{item.description}</span>
                  </td>
                  <td className={styles.noteCell}>{item.note || '—'}</td>
                  <td className={styles.numCell}>{item.quantity}</td>
                  <td className={styles.numCell}>{formatBillMoney(item.unitPrice)}</td>
                  <td>
                    <span
                      className={`${styles.vatBadge} ${
                        item.includeVat ? styles.vatYes : styles.vatNo
                      }`}
                    >
                      {item.includeVat ? `${item.vatPercent}%` : 'No VAT'}
                    </span>
                  </td>
                  <td className={styles.numCell}>{formatBillMoney(item.subtotal)}</td>
                  <td className={styles.numCell}>{formatBillMoney(item.vatAmount)}</td>
                  <td className={styles.numCell}>{formatBillMoney(item.lineTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className={styles.totalsPanel}>
          <div className={styles.totalsGrid}>
            <div className={styles.totalRow}>
              <span>Subtotal</span>
              <span>{formatBillMoney(bill.subtotal)}</span>
            </div>
            <div className={styles.totalRow}>
              <span>VAT Total</span>
              <span>{formatBillMoney(bill.vatTotal)}</span>
            </div>
            <div className={`${styles.totalRow} ${styles.grandTotalRow}`}>
              <span>Grand Total</span>
              <span>{formatBillMoney(bill.grandTotal)}</span>
            </div>
          </div>
        </div>
        <p className={styles.createdAt}>Recorded {formatBillDateLong(bill.createdAt)}</p>
      </section>
    </div>
  )
}

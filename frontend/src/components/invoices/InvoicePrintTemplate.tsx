import emssLogo from '@/assets/emss-logo.png'
import { COMPANY, INVOICE_PRINT_FOOTER } from '@/config/company'
import {
  formatInvoiceMoney,
  formatInvoicePrintDate,
  invoiceDisplayValue,
  invoicePaymentTerms,
  type Invoice,
} from '@/types/invoice'
import styles from './InvoicePrintTemplate.module.css'

interface InvoicePrintTemplateProps {
  invoice: Invoice
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailField}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  )
}

export function InvoicePrintTemplate({ invoice }: InvoicePrintTemplateProps) {
  const customer = invoice.jobCard?.customer
  const jobCard = invoice.jobCard

  return (
    <div className={`invoicePrintArea ${styles.printRoot}`}>
      <article className={styles.document}>
        <header className={styles.letterhead}>
          <img src={emssLogo} alt="EMSS" className={styles.logo} />
          <div className={styles.companyBlock}>
            <h1 className={styles.companyName}>{COMPANY.name}</h1>
            <p className={styles.companyTagline}>{COMPANY.tagline}</p>
            <p className={styles.companyAddress}>{COMPANY.address}</p>
            <p className={styles.companyTrn}>EMSS TAX TRN No. {COMPANY.trn}</p>
          </div>
        </header>

        <h2 className={styles.title}>Invoice</h2>

        <div className={styles.metaGrid}>
          <section className={styles.metaCard}>
            <h3 className={styles.metaHeading}>Customer Details</h3>
            <DetailField
              label="Customer"
              value={invoiceDisplayValue(customer?.name)}
            />
            <DetailField
              label="Phone Number"
              value={invoiceDisplayValue(customer?.phoneNumber)}
            />
            <DetailField
              label="Mobile Number"
              value={invoiceDisplayValue(customer?.mobileNumber)}
            />
            <DetailField
              label="Tax id. no."
              value={invoiceDisplayValue(customer?.trnNumber)}
            />
            <DetailField
              label="Address"
              value={invoiceDisplayValue(customer?.address)}
            />
          </section>

          <section className={styles.metaCard}>
            <h3 className={styles.metaHeading}>Invoice Details</h3>
            <DetailField
              label="Invoice Number"
              value={invoice.invoiceNumber}
            />
            <DetailField
              label="BL Number"
              value={invoiceDisplayValue(jobCard?.blNumber)}
            />
            <DetailField
              label="Declaration Number"
              value={invoiceDisplayValue(jobCard?.declarationNumber)}
            />
            <DetailField
              label="Container Number"
              value={invoiceDisplayValue(jobCard?.containerNumber)}
            />
            <DetailField
              label="Invoice Date"
              value={formatInvoicePrintDate(invoice.createdAt)}
            />
            <DetailField
              label="Description"
              value={invoiceDisplayValue(jobCard?.description)}
            />
            <DetailField
              label="Payment Terms"
              value={invoicePaymentTerms(invoice)}
            />
          </section>
        </div>

        <div className={styles.tableWrap}>
          <table className={styles.itemsTable}>
            <thead>
              <tr>
                <th className={styles.colIndex}>#</th>
                <th>Description</th>
                <th className={styles.colNum}>Qty</th>
                <th className={styles.colNum}>Unit Price</th>
                <th className={styles.colNum}>VAT %</th>
                <th className={styles.colNum}>VAT Amt</th>
                <th className={styles.colNum}>Subtotal</th>
                <th className={styles.colNum}>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => {
                const description = item.note?.trim()
                  ? `${item.productName || item.product?.name || 'Product'} — ${item.note}`
                  : item.productName || item.product?.name || 'Product'

                return (
                  <tr key={item.id}>
                    <td className={styles.colIndex}>{index + 1}</td>
                    <td>{description}</td>
                    <td className={styles.colNum}>{item.quantity}</td>
                    <td className={styles.colNum}>
                      {formatInvoiceMoney(item.unitPrice)}
                    </td>
                    <td className={styles.colNum}>
                      {item.includeVat ? `${item.vatPercent}%` : '—'}
                    </td>
                    <td className={styles.colNum}>
                      {item.includeVat
                        ? formatInvoiceMoney(item.vatAmount)
                        : '—'}
                    </td>
                    <td className={styles.colNum}>
                      {formatInvoiceMoney(item.subtotal)}
                    </td>
                    <td className={styles.colNum}>
                      {formatInvoiceMoney(item.lineTotal)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className={styles.totalsRow}>
          <div className={styles.totalsPanel}>
            <div className={styles.totalLine}>
              <span>Subtotal</span>
              <span>{formatInvoiceMoney(invoice.subtotal)}</span>
            </div>
            <div className={styles.totalLine}>
              <span>VAT Total</span>
              <span>{formatInvoiceMoney(invoice.vatTotal)}</span>
            </div>
            <div className={`${styles.totalLine} ${styles.grandTotal}`}>
              <span>Grand Total</span>
              <span>{formatInvoiceMoney(invoice.grandTotal)}</span>
            </div>
          </div>
        </div>

        <footer className={styles.footer}>
          <p>{INVOICE_PRINT_FOOTER.paymentLine}</p>
          <p>{INVOICE_PRINT_FOOTER.discrepancyNote}</p>
          <p className={styles.footerNote}>{INVOICE_PRINT_FOOTER.systemNote}</p>
        </footer>
      </article>
    </div>
  )
}

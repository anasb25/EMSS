import type { ReactNode } from 'react'
import emssLogo from '@/assets/emss-logo.png'
import styles from './ReportDocument.module.css'

interface ReportDocumentProps {
  title: string
  subtitle?: string
  meta?: string[]
  currencyNote?: string
  footerNote?: string
  children: ReactNode
}

export function ReportDocument({
  title,
  subtitle,
  meta = [],
  currencyNote = 'All amounts in AED unless stated otherwise.',
  footerNote,
  children,
}: ReportDocumentProps) {
  const generatedOn = new Date().toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <article className={`printOnly reportPrintArea ${styles.document}`}>
      <header className={styles.header}>
        <div className={styles.companyRow}>
          <img src={emssLogo} alt="EMSS" className={styles.logo} />
          <div>
            <p className={styles.companyName}>EMSS</p>
            <p className={styles.companyTagline}>Enterprise Management Suite</p>
          </div>
        </div>
        <h1 className={styles.title}>{title}</h1>
        {subtitle ? <p className={styles.subtitle}>{subtitle}</p> : null}
        {meta.map((line) => (
          <p key={line} className={styles.meta}>
            {line}
          </p>
        ))}
        {currencyNote ? <p className={styles.currencyNote}>{currencyNote}</p> : null}
      </header>

      <div className={styles.body}>{children}</div>

      <footer className={styles.footer}>
        {footerNote ? <p className={styles.footerNote}>{footerNote}</p> : null}
        <p className={styles.footerMeta}>Generated on {generatedOn}</p>
      </footer>
    </article>
  )
}

export { styles as reportDocumentStyles }

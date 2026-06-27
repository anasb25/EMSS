import { LayoutTemplate } from 'lucide-react'
import type { ReactNode } from 'react'
import { Card } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import styles from './ModulePage.module.css'

interface ModulePageProps {
  title: string
  description: string
  actions?: ReactNode
  children?: ReactNode
}

export function ModulePage({
  title,
  description,
  actions,
  children,
}: ModulePageProps) {
  return (
    <section className={styles.page}>
      <PageHeader title={title} description={description} actions={actions} />
      {children ?? (
        <Card padding="lg" className={styles.placeholder}>
          <div className={styles.placeholderIcon}>
            <LayoutTemplate size={24} />
          </div>
          <h2 className={styles.placeholderTitle}>{title}</h2>
          <p className={styles.placeholderText}>
            This module is ready for content. Data tables, forms, and reports will
            appear here.
          </p>
        </Card>
      )}
    </section>
  )
}

import type { ReactNode } from 'react'

export interface TableColumn<T> {
  key: string
  header: string
  render: (row: T) => ReactNode
  align?: 'left' | 'center' | 'right'
  className?: string
}

export interface TableProps<T> {
  data: T[]
  columns: TableColumn<T>[]
  rowKey: (row: T) => string
  emptyMessage?: string
  isLoading?: boolean
  loadingMessage?: string
  className?: string
}

import { Card } from '@/components/ui/Card'
import type { TableProps } from '@/types/table'
import styles from './Table.module.css'

function TableSkeleton() {
  return (
    <div className={styles.skeleton}>
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className={styles.skeletonRow} />
      ))}
    </div>
  )
}

export function Table<T>({
  data,
  columns,
  rowKey,
  emptyMessage = 'No records found.',
  isLoading = false,
  loadingMessage = 'Loading...',
  className = '',
}: TableProps<T>) {
  if (isLoading) {
    return (
      <div
        className={[styles.tableCard, className].filter(Boolean).join(' ')}
        aria-busy="true"
        aria-label={loadingMessage}
      >
        <TableSkeleton />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <Card padding="lg" className={[styles.stateCard, className].join(' ')}>
        <p className={styles.stateText}>{emptyMessage}</p>
      </Card>
    )
  }

  return (
    <div className={[styles.tableCard, className].filter(Boolean).join(' ')}>
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={[
                    column.align ? styles[column.align] : '',
                    column.className ?? '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={[
                      column.align ? styles[column.align] : '',
                      column.className ?? '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

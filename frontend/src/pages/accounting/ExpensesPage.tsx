import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import {
  createExpense,
  deleteExpense,
  fetchExpenseCategories,
  fetchExpenses,
} from '@/api/expenses'
import { ModulePage } from '@/components/common/ModulePage'
import { ExpenseDetailsModal } from '@/components/expenses/ExpenseDetailsModal'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import { ExpenseTable } from '@/components/expenses/ExpenseTable'
import { Button } from '@/components/ui/Button'
import { DateRangePicker } from '@/components/ui/DateRangePicker'
import { Modal } from '@/components/ui/Modal'
import { Pagination } from '@/components/ui/Pagination'
import { SearchInput } from '@/components/ui/SearchInput'
import { Select } from '@/components/ui/Select'
import { useModal } from '@/hooks/useModal'
import type { PaginationMeta } from '@/types/pagination'
import {
  expensePeriodLabel,
  formatExpenseDate,
  formatExpenseMoney,
  getExpensePeriodRange,
  type Expense,
  type ExpenseCategory,
  type ExpenseFormData,
  type ExpensePeriodFilter,
  type ExpensesSummary,
} from '@/types/expense'
import { PERIOD_FILTERS } from '@/types/period-filter'
import styles from './ExpensesPage.module.css'

const PAGE_SIZE = 10
const SEARCH_DEBOUNCE_MS = 300

const EMPTY_META: PaginationMeta = {
  total: 0,
  page: 1,
  limit: PAGE_SIZE,
  totalPages: 1,
}

const EMPTY_SUMMARY: ExpensesSummary = {
  todayAmount: 0,
  todayCount: 0,
  filteredAmount: 0,
  filteredCount: 0,
}

export function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [meta, setMeta] = useState<PaginationMeta>(EMPTY_META)
  const [summary, setSummary] = useState<ExpensesSummary>(EMPTY_SUMMARY)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [periodFilter, setPeriodFilter] = useState<ExpensePeriodFilter>('today')
  const [customDateFrom, setCustomDateFrom] = useState('')
  const [customDateTo, setCustomDateTo] = useState('')
  const [page, setPage] = useState(1)
  const formModal = useModal()
  const viewModal = useModal<Expense>()

  const dateRange = useMemo(
    () => getExpensePeriodRange(periodFilter, customDateFrom, customDateTo),
    [periodFilter, customDateFrom, customDateTo],
  )

  useEffect(() => {
    fetchExpenseCategories().then(setCategories)
  }, [])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timeout)
  }, [search])

  const loadExpenses = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetchExpenses({
        search: debouncedSearch,
        categoryId: categoryFilter ? Number(categoryFilter) : undefined,
        dateFrom: dateRange.dateFrom,
        dateTo: dateRange.dateTo,
        page,
        limit: PAGE_SIZE,
      })
      setExpenses(response.data)
      setMeta(response.meta)
      setSummary(response.summary)
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load expenses.',
      )
      setExpenses([])
      setMeta(EMPTY_META)
      setSummary(EMPTY_SUMMARY)
    } finally {
      setIsLoading(false)
    }
  }, [debouncedSearch, categoryFilter, dateRange.dateFrom, dateRange.dateTo, page])

  useEffect(() => {
    void loadExpenses()
  }, [loadExpenses])

  function handlePeriodChange(nextPeriod: ExpensePeriodFilter) {
    setPeriodFilter(nextPeriod)
    setPage(1)
  }

  async function handleSubmit(data: ExpenseFormData) {
    await createExpense(data)
    formModal.close()
    await loadExpenses()
  }

  async function handleDelete(expense: Expense) {
    const confirmed = window.confirm(
      `Delete expense #${expense.id} — ${expense.description}?`,
    )
    if (!confirmed) return

    setError('')
    try {
      await deleteExpense(expense.id)
      if (expenses.length === 1 && page > 1) {
        setPage(page - 1)
      } else {
        await loadExpenses()
      }
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete expense.',
      )
    }
  }

  const periodSummaryLabel =
    periodFilter === 'today'
      ? "Today's Total"
      : `${expensePeriodLabel(periodFilter)} Total`

  return (
    <ModulePage
      title="Expenses"
      description="Record pay-now operational expenses by category. Cash expenses sync to the cashbook automatically."
    >
      <div className={styles.page}>
        {error ? <p className={styles.error}>{error}</p> : null}

        <section className={styles.summaryGrid}>
          <article className={[styles.summaryCard, styles.summaryCardHighlight].join(' ')}>
            <span className={styles.summaryLabel}>Today&apos;s Expenses</span>
            <strong>{formatExpenseMoney(summary.todayAmount)}</strong>
            <span className={styles.summaryHint}>
              {summary.todayCount} expense{summary.todayCount === 1 ? '' : 's'} today
            </span>
          </article>
          <article className={styles.summaryCard}>
            <span className={styles.summaryLabel}>{periodSummaryLabel}</span>
            <strong className={styles.summaryNegative}>
              {formatExpenseMoney(summary.filteredAmount)}
            </strong>
            <span className={styles.summaryHint}>
              {summary.filteredCount} expense{summary.filteredCount === 1 ? '' : 's'} in
              selected period
            </span>
          </article>
          {dateRange.dateFrom && dateRange.dateTo ? (
            <article className={styles.summaryCard}>
              <span className={styles.summaryLabel}>Date Range</span>
              <strong className={styles.summarySmall}>
                {formatExpenseDate(dateRange.dateFrom)}
                {' — '}
                {formatExpenseDate(dateRange.dateTo)}
              </strong>
              <span className={styles.summaryHint}>
                {expensePeriodLabel(periodFilter)} filter active
              </span>
            </article>
          ) : null}
        </section>

        <section className={styles.panel}>
          <div className={styles.filtersRow}>
            <div className={styles.periodFilters}>
              {PERIOD_FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  className={[
                    styles.filterButton,
                    periodFilter === filter.value ? styles.filterButtonActive : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                  onClick={() => handlePeriodChange(filter.value)}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {periodFilter === 'custom' ? (
              <DateRangePicker
                label=""
                from={customDateFrom}
                to={customDateTo}
                onFromChange={(value) => {
                  setCustomDateFrom(value)
                  setPage(1)
                }}
                onToChange={(value) => {
                  setCustomDateTo(value)
                  setPage(1)
                }}
              />
            ) : null}
          </div>

          <div className={styles.toolbar}>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by description, category, or vendor..."
            />
            <Select
              label="Category"
              name="categoryFilter"
              value={categoryFilter}
              onChange={(event) => {
                setCategoryFilter(event.target.value)
                setPage(1)
              }}
              options={[
                { value: '', label: 'All categories' },
                ...categories.map((category) => ({
                  value: String(category.id),
                  label: category.name,
                })),
              ]}
            />
            <Button type="button" onClick={() => formModal.open()}>
              <Plus size={16} />
              Record Expense
            </Button>
          </div>

          <ExpenseTable
            expenses={expenses}
            isLoading={isLoading}
            onView={viewModal.open}
            onDelete={handleDelete}
          />

          {!isLoading ? (
            <Pagination meta={meta} onPageChange={setPage} />
          ) : null}
        </section>
      </div>

      <Modal
        isOpen={formModal.isOpen}
        title="Record Expense"
        description="Add a pay-now expense. Use Bills for vendor invoices you will pay later."
        onClose={formModal.close}
        size="md"
      >
        <ExpenseForm onSubmit={handleSubmit} onCancel={formModal.close} />
      </Modal>

      <ExpenseDetailsModal
        expense={viewModal.data ?? null}
        isOpen={viewModal.isOpen}
        onClose={viewModal.close}
      />
    </ModulePage>
  )
}

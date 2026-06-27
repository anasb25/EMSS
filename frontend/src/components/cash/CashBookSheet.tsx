import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Save, Trash2 } from 'lucide-react'
import {
  createCashEntry,
  deleteCashEntry,
  fetchCashDaySummary,
  updateCashEntry,
} from '@/api/cash'
import { createLedgerAccount, fetchLedgerAccounts } from '@/api/ledger-accounts'
import { fetchCustomers } from '@/api/customers'
import { fetchVendors } from '@/api/vendors'
import { Button } from '@/components/ui/Button'
import type { LedgerAccount } from '@/api/ledger-accounts'
import type { Customer } from '@/types/customer'
import type { Vendor } from '@/types/vendor'
import {
  cashAccountTypeLabel,
  cashEntryTypeLabel,
  emptyCashEntryForm,
  entryAccountId,
  formatCashDate,
  formatCashMoney,
  type CashAccountType,
  type CashDaySummary,
  type CashEntry,
  type CashEntryFormData,
} from '@/types/cash'
import styles from './CashBookSheet.module.css'

interface CashBookSheetProps {
  selectedDate: string
  onDateChange: (date: string) => void
}

interface SheetRow {
  key: string
  id?: number
  form: CashEntryFormData
  balance: number
  isOpening?: boolean
  isDraft?: boolean
  isReadOnly?: boolean
  entryType?: CashEntry['type']
}

const EMPTY_DAY: CashDaySummary = {
  date: '',
  openingBalance: 0,
  totalIn: 0,
  totalOut: 0,
  closingBalance: 0,
  hasOpeningBalance: false,
  entries: [],
}

function createDraftRow(date: string): SheetRow {
  return {
    key: `draft-${crypto.randomUUID()}`,
    form: emptyCashEntryForm(date),
    balance: 0,
    isDraft: true,
  }
}

function entryToForm(entry: CashEntry): CashEntryFormData {
  return {
    entryDate: entry.entryDate,
    description: entry.description,
    cashIn: entry.cashIn > 0 ? String(entry.cashIn) : '',
    cashOut: entry.cashOut > 0 ? String(entry.cashOut) : '',
    accountType: entry.accountType ?? '',
    accountId: entryAccountId(entry),
    salesPersonName: entry.salesPersonName ?? '',
    remarks: entry.remarks ?? '',
  }
}

function hasRowContent(form: CashEntryFormData): boolean {
  return Boolean(
    form.description.trim() ||
      Number(form.cashIn) > 0 ||
      Number(form.cashOut) > 0 ||
      form.salesPersonName.trim() ||
      form.remarks.trim(),
  )
}

function shiftDate(date: string, days: number): string {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next.toISOString().slice(0, 10)
}

export function CashBookSheet({ selectedDate, onDateChange }: CashBookSheetProps) {
  const [daySummary, setDaySummary] = useState<CashDaySummary>(EMPTY_DAY)
  const [rows, setRows] = useState<SheetRow[]>([])
  const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccount[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const buildRows = useCallback((summary: CashDaySummary): SheetRow[] => {
    const sheetRows: SheetRow[] = [
      {
        key: 'opening',
        form: {
          ...emptyCashEntryForm(summary.date),
          description: 'Opening Balance',
          cashIn:
            summary.openingBalance > 0 ? String(summary.openingBalance) : '',
        },
        balance: summary.openingBalance,
        isOpening: true,
        isReadOnly: true,
      },
    ]

    summary.entries.forEach((entry) => {
      sheetRows.push({
        key: `entry-${entry.id}`,
        id: entry.id,
        form: entryToForm(entry),
        balance: entry.runningBalance ?? 0,
        isReadOnly: false,
        entryType: entry.type,
      })
    })

    sheetRows.push(createDraftRow(summary.date))

    return sheetRows
  }, [])

  const displayRows = useMemo(() => {
    let runningBalance = daySummary.openingBalance
    let serial = 0

    return rows.map((row) => {
      if (row.isOpening) {
        return {
          ...row,
          balance: runningBalance,
          serialLabel: '—',
        }
      }

      const cashIn = Number(row.form.cashIn || 0)
      const cashOut = Number(row.form.cashOut || 0)
      const shouldAffectBalance = Boolean(row.id) || hasRowContent(row.form)

      if (shouldAffectBalance) {
        runningBalance += cashIn - cashOut
      }

      serial += 1

      return {
        ...row,
        balance: runningBalance,
        serialLabel: String(serial),
      }
    })
  }, [daySummary.openingBalance, rows])

  const loadSheet = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const [summary, accounts, vendorResponse, customerResponse] =
        await Promise.all([
          fetchCashDaySummary(selectedDate),
          fetchLedgerAccounts(),
          fetchVendors({ status: 'all', limit: 100 }),
          fetchCustomers({ status: 'all', limit: 100 }),
        ])

      setDaySummary(summary)
      setLedgerAccounts(accounts)
      setVendors(vendorResponse.data)
      setCustomers(customerResponse.data)
      setRows(buildRows(summary))
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : 'Failed to load cash book.',
      )
      setDaySummary({ ...EMPTY_DAY, date: selectedDate })
      setRows([])
    } finally {
      setIsLoading(false)
    }
  }, [buildRows, selectedDate])

  useEffect(() => {
    void loadSheet()
  }, [loadSheet])

  useEffect(() => {
    const refreshOnVisible = () => {
      if (document.visibilityState === 'visible') {
        void loadSheet()
      }
    }

    document.addEventListener('visibilitychange', refreshOnVisible)
    return () => document.removeEventListener('visibilitychange', refreshOnVisible)
  }, [loadSheet])

  const accountOptions = useMemo(() => {
    const sortByName = <T extends { label: string }>(items: T[]) =>
      [...items].sort((left, right) => left.label.localeCompare(right.label))

    return {
      account: sortByName(
        ledgerAccounts.map((account) => ({
          value: String(account.id),
          label: account.name,
        })),
      ),
      vendor: sortByName(
        vendors.map((vendor) => ({
          value: vendor.id,
          label: vendor.name,
        })),
      ),
      customer: sortByName(
        customers.map((customer) => ({
          value: customer.id,
          label: customer.name,
        })),
      ),
    }
  }, [customers, ledgerAccounts, vendors])

  function updateRow(key: string, patch: Partial<CashEntryFormData>) {
    setRows((current) =>
      current.map((row) => {
        if (row.key !== key || row.isReadOnly) {
          return row
        }

        const nextForm = { ...row.form, ...patch }
        if (patch.accountType !== undefined && patch.accountType !== row.form.accountType) {
          nextForm.accountId = ''
        }

        return { ...row, form: nextForm }
      }),
    )
  }

  function addRow() {
    setRows((current) => [...current, createDraftRow(selectedDate)])
  }

  async function handleAddAccount() {
    const name = window.prompt('New account name')
    if (!name?.trim()) {
      return
    }

    try {
      const account = await createLedgerAccount(name)
      setLedgerAccounts((current) =>
        [...current, account].sort((left, right) =>
          left.name.localeCompare(right.name),
        ),
      )
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : 'Failed to create account.',
      )
    }
  }

  async function handleSaveRow(row: SheetRow) {
    if (row.isReadOnly || !hasRowContent(row.form)) {
      return
    }

    setSavingKey(row.key)
    setError('')

    try {
      if (row.id) {
        await updateCashEntry(row.id, row.form)
      } else {
        await createCashEntry(row.form)
      }
      await loadSheet()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to save cash book row.',
      )
    } finally {
      setSavingKey(null)
    }
  }

  async function handleDeleteRow(row: SheetRow) {
    if (!row.id || row.isReadOnly) {
      return
    }

    if (!window.confirm('Delete this cash book row?')) {
      return
    }

    setSavingKey(row.key)
    setError('')

    try {
      await deleteCashEntry(row.id)
      await loadSheet()
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete cash book row.',
      )
    } finally {
      setSavingKey(null)
    }
  }

  function renderAccountSelect(row: SheetRow) {
    if (row.isOpening) {
      return <span className={styles.cellInputReadOnly}>—</span>
    }

    if (!row.form.accountType) {
      return (
        <select
          className={styles.cellSelect}
          value=""
          disabled={row.isReadOnly}
          onChange={() => undefined}
        >
          <option value="">Select type first</option>
        </select>
      )
    }

    const options =
      accountOptions[row.form.accountType as CashAccountType] ?? []

    const selectedLabel =
      options.find((option) => option.value === row.form.accountId)?.label ?? ''

    if (row.isReadOnly) {
      return (
        <span className={styles.cellInputReadOnly}>
          {selectedLabel || '—'}
        </span>
      )
    }

    return (
      <div className={styles.accountCell}>
        <select
          className={styles.cellSelect}
          value={row.form.accountId}
          disabled={row.isReadOnly}
          onChange={(event) =>
            updateRow(row.key, { accountId: event.target.value })
          }
        >
          <option value="">
            {options.length === 0
              ? `No ${cashAccountTypeLabel(row.form.accountType)} found`
              : `Select ${cashAccountTypeLabel(row.form.accountType)}`}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {row.form.accountType === 'account' && !row.isReadOnly ? (
          <button
            type="button"
            className={styles.iconButton}
            title="Add account"
            onClick={() => void handleAddAccount()}
          >
            <Plus size={14} />
          </button>
        ) : null}
      </div>
    )
  }

  return (
    <div className={styles.sheetWrap}>
      {error ? <p className={styles.error}>{error}</p> : null}

      <div className={styles.toolbar}>
        <div className={styles.dateNav}>
          <button
            type="button"
            className={styles.dateNavButton}
            onClick={() => onDateChange(shiftDate(selectedDate, -1))}
            aria-label="Previous day"
          >
            <ChevronLeft size={18} />
          </button>
          <input
            type="date"
            className={styles.dateInput}
            value={selectedDate}
            onChange={(event) => onDateChange(event.target.value)}
          />
          <button
            type="button"
            className={styles.dateNavButton}
            onClick={() => onDateChange(shiftDate(selectedDate, 1))}
            aria-label="Next day"
          >
            <ChevronRight size={18} />
          </button>
          <span className={styles.hint}>{formatCashDate(selectedDate)}</span>
        </div>
      </div>

      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Opening Balance</span>
          <strong className={styles.summaryValue}>
            {formatCashMoney(daySummary.openingBalance)}
          </strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Cash In</span>
          <strong className={[styles.summaryValue, styles.positive].join(' ')}>
            {formatCashMoney(daySummary.totalIn)}
          </strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Cash Out</span>
          <strong className={[styles.summaryValue, styles.negative].join(' ')}>
            {formatCashMoney(daySummary.totalOut)}
          </strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Closing Balance</span>
          <strong className={styles.summaryValue}>
            {formatCashMoney(daySummary.closingBalance)}
          </strong>
        </article>
      </section>

      {isLoading ? (
        <div className={styles.loading}>Loading cash book...</div>
      ) : (
        <div className={styles.tableScroll}>
          <table className={styles.sheetTable}>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Date</th>
                <th>Description</th>
                <th>Cash In</th>
                <th>Cash Out</th>
                <th>Balance</th>
                <th>Account Type</th>
                <th>Account</th>
                <th>Sales Person</th>
                <th>Remarks</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row) => (
                <tr
                  key={row.key}
                  className={[
                    row.isOpening ? styles.openingRow : '',
                    row.isReadOnly && !row.isOpening ? styles.readOnlyRow : '',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <td className={styles.serialCell}>{row.serialLabel}</td>
                  <td>
                    <input
                      type="date"
                      className={styles.cellInput}
                      value={row.form.entryDate}
                      disabled={row.isReadOnly || row.isOpening}
                      onChange={(event) =>
                        updateRow(row.key, { entryDate: event.target.value })
                      }
                    />
                  </td>
                  <td className={styles.descCell}>
                    {row.isReadOnly ? (
                      <div>
                        <span>{row.form.description}</span>
                        {row.entryType ? (
                          <span className={styles.typeBadge}>
                            {cashEntryTypeLabel(row.entryType)}
                          </span>
                        ) : null}
                      </div>
                    ) : (
                      <input
                        type="text"
                        className={styles.cellInput}
                        value={row.form.description}
                        placeholder="Description"
                        onChange={(event) =>
                          updateRow(row.key, { description: event.target.value })
                        }
                      />
                    )}
                  </td>
                  <td className={styles.amountCell}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={styles.cellInput}
                      value={row.form.cashIn}
                      disabled={row.isReadOnly || row.isOpening}
                      placeholder="0.00"
                      onChange={(event) =>
                        updateRow(row.key, {
                          cashIn: event.target.value,
                          cashOut:
                            Number(event.target.value) > 0 ? '' : row.form.cashOut,
                        })
                      }
                    />
                  </td>
                  <td className={styles.amountCell}>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={styles.cellInput}
                      value={row.form.cashOut}
                      disabled={row.isReadOnly || row.isOpening}
                      placeholder="0.00"
                      onChange={(event) =>
                        updateRow(row.key, {
                          cashOut: event.target.value,
                          cashIn:
                            Number(event.target.value) > 0 ? '' : row.form.cashIn,
                        })
                      }
                    />
                  </td>
                  <td className={styles.balanceCell}>
                    {formatCashMoney(row.balance)}
                  </td>
                  <td>
                    {row.isOpening ? (
                      <span className={styles.cellInputReadOnly}>—</span>
                    ) : (
                      <select
                        className={styles.cellSelect}
                        value={row.form.accountType}
                        disabled={row.isReadOnly}
                        onChange={(event) =>
                          updateRow(row.key, {
                            accountType: event.target.value as CashEntryFormData['accountType'],
                          })
                        }
                      >
                        <option value="">—</option>
                        <option value="account">Accounts</option>
                        <option value="vendor">Vendors</option>
                        <option value="customer">Customers</option>
                      </select>
                    )}
                  </td>
                  <td>{renderAccountSelect(row)}</td>
                  <td className={styles.salesPersonCell}>
                    <input
                      type="text"
                      className={styles.cellInput}
                      value={row.form.salesPersonName}
                      disabled={row.isReadOnly || row.isOpening}
                      placeholder="Sales person"
                      onChange={(event) =>
                        updateRow(row.key, { salesPersonName: event.target.value })
                      }
                    />
                  </td>
                  <td className={styles.remarksCell}>
                    <input
                      type="text"
                      className={styles.cellInput}
                      value={row.form.remarks}
                      disabled={row.isReadOnly || row.isOpening}
                      placeholder="Remarks"
                      onChange={(event) =>
                        updateRow(row.key, { remarks: event.target.value })
                      }
                    />
                  </td>
                  <td className={styles.actionsCell}>
                    {!row.isReadOnly && !row.isOpening ? (
                      <div className={styles.rowActions}>
                        <button
                          type="button"
                          className={styles.iconButton}
                          title="Save row"
                          disabled={savingKey === row.key}
                          onClick={() => void handleSaveRow(row)}
                        >
                          <Save size={15} />
                        </button>
                        {row.id ? (
                          <button
                            type="button"
                            className={[styles.iconButton, styles.iconButtonDanger].join(' ')}
                            title="Delete row"
                            disabled={savingKey === row.key}
                            onClick={() => void handleDeleteRow(row)}
                          >
                            <Trash2 size={15} />
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className={styles.addRowBar}>
            <Button type="button" variant="secondary" onClick={addRow}>
              <Plus size={16} />
              Add Row
            </Button>
          </div>
        </div>
      )}

      <div className={styles.footerBar}>
        <p className={styles.hint}>
          Each day opens as a new cash book. Entries are recorded here only and
          are not synced from sales, purchases, or expenses.
        </p>
      </div>
    </div>
  )
}

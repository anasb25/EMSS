import { useCallback, useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, Save, Trash2 } from 'lucide-react'
import {
  createBankEntry,
  deleteBankEntry,
  fetchBankDaySummary,
  updateBankEntry,
} from '@/api/bank'
import { createLedgerAccount, fetchLedgerAccounts } from '@/api/ledger-accounts'
import { fetchCustomers } from '@/api/customers'
import { fetchVendors } from '@/api/vendors'
import { Button } from '@/components/ui/Button'
import type { LedgerAccount } from '@/api/ledger-accounts'
import type { Customer } from '@/types/customer'
import type { Vendor } from '@/types/vendor'
import {
  bankAccountTypeLabel,
  bankEntryTypeLabel,
  emptyBankEntryForm,
  entryAccountId,
  formatBankDate,
  formatBankMoney,
  type BankAccountType,
  type BankDaySummary,
  type BankEntry,
  type BankEntryFormData,
} from '@/types/bank'
import styles from './BankBookSheet.module.css'

interface BankBookSheetProps {
  selectedDate: string
  onDateChange: (date: string) => void
}

interface SheetRow {
  key: string
  manualId?: number
  form: BankEntryFormData
  balance: number
  isOpening?: boolean
  isDraft?: boolean
  isReadOnly?: boolean
  entryType?: BankEntry['type']
}

const EMPTY_DAY: BankDaySummary = {
  date: '',
  openingBalance: 0,
  totalIn: 0,
  totalOut: 0,
  closingBalance: 0,
  entries: [],
}

function createDraftRow(date: string): SheetRow {
  return {
    key: `draft-${crypto.randomUUID()}`,
    form: emptyBankEntryForm(date),
    balance: 0,
    isDraft: true,
  }
}

function entryToForm(entry: BankEntry): BankEntryFormData {
  return {
    entryDate: entry.entryDate,
    description: entry.description,
    bankIn: entry.bankIn > 0 ? String(entry.bankIn) : '',
    bankOut: entry.bankOut > 0 ? String(entry.bankOut) : '',
    accountType: entry.accountType ?? '',
    accountId: entryAccountId(entry),
    salesPersonName: entry.salesPersonName ?? '',
    remarks: entry.remarks ?? '',
  }
}

function hasRowContent(form: BankEntryFormData): boolean {
  return Boolean(
    form.description.trim() ||
      Number(form.bankIn) > 0 ||
      Number(form.bankOut) > 0 ||
      form.salesPersonName.trim() ||
      form.remarks.trim(),
  )
}

function shiftDate(date: string, days: number): string {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next.toISOString().slice(0, 10)
}

export function BankBookSheet({ selectedDate, onDateChange }: BankBookSheetProps) {
  const [daySummary, setDaySummary] = useState<BankDaySummary>(EMPTY_DAY)
  const [rows, setRows] = useState<SheetRow[]>([])
  const [ledgerAccounts, setLedgerAccounts] = useState<LedgerAccount[]>([])
  const [vendors, setVendors] = useState<Vendor[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [savingKey, setSavingKey] = useState<string | null>(null)

  const buildRows = useCallback((summary: BankDaySummary): SheetRow[] => {
    const sheetRows: SheetRow[] = [
      {
        key: 'opening',
        form: {
          ...emptyBankEntryForm(summary.date),
          description: 'Opening Balance',
          bankIn:
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
        manualId: Number(entry.id),
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

      const bankIn = Number(row.form.bankIn || 0)
      const bankOut = Number(row.form.bankOut || 0)
      const shouldAffectBalance = Boolean(row.manualId) || hasRowContent(row.form)

      if (shouldAffectBalance) {
        runningBalance += bankIn - bankOut
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
          fetchBankDaySummary(selectedDate),
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
          : 'Failed to load bank book.',
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

  function updateRow(key: string, patch: Partial<BankEntryFormData>) {
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
      if (row.manualId) {
        await updateBankEntry(row.manualId, row.form)
      } else {
        await createBankEntry(row.form)
      }
      await loadSheet()
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Failed to save bank book row.',
      )
    } finally {
      setSavingKey(null)
    }
  }

  async function handleDeleteRow(row: SheetRow) {
    if (!row.manualId || row.isReadOnly) {
      return
    }

    if (!window.confirm('Delete this bank book row?')) {
      return
    }

    setSavingKey(row.key)
    setError('')

    try {
      await deleteBankEntry(row.manualId)
      await loadSheet()
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : 'Failed to delete bank book row.',
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
      accountOptions[row.form.accountType as BankAccountType] ?? []

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
              ? `No ${bankAccountTypeLabel(row.form.accountType)} found`
              : `Select ${bankAccountTypeLabel(row.form.accountType)}`}
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
          <span className={styles.hint}>{formatBankDate(selectedDate)}</span>
        </div>
      </div>

      <section className={styles.summaryGrid}>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Opening Balance</span>
          <strong className={styles.summaryValue}>
            {formatBankMoney(daySummary.openingBalance)}
          </strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Bank In</span>
          <strong className={[styles.summaryValue, styles.positive].join(' ')}>
            {formatBankMoney(daySummary.totalIn)}
          </strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Bank Out</span>
          <strong className={[styles.summaryValue, styles.negative].join(' ')}>
            {formatBankMoney(daySummary.totalOut)}
          </strong>
        </article>
        <article className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Closing Balance</span>
          <strong className={styles.summaryValue}>
            {formatBankMoney(daySummary.closingBalance)}
          </strong>
        </article>
      </section>

      {isLoading ? (
        <div className={styles.loading}>Loading bank book...</div>
      ) : (
        <div className={styles.tableScroll}>
          <table className={styles.sheetTable}>
            <thead>
              <tr>
                <th>S.No</th>
                <th>Date</th>
                <th>Description</th>
                <th>Bank In</th>
                <th>Bank Out</th>
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
                            {bankEntryTypeLabel(row.entryType)}
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
                      value={row.form.bankIn}
                      disabled={row.isReadOnly || row.isOpening}
                      placeholder="0.00"
                      onChange={(event) =>
                        updateRow(row.key, {
                          bankIn: event.target.value,
                          bankOut:
                            Number(event.target.value) > 0 ? '' : row.form.bankOut,
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
                      value={row.form.bankOut}
                      disabled={row.isReadOnly || row.isOpening}
                      placeholder="0.00"
                      onChange={(event) =>
                        updateRow(row.key, {
                          bankOut: event.target.value,
                          bankIn:
                            Number(event.target.value) > 0 ? '' : row.form.bankIn,
                        })
                      }
                    />
                  </td>
                  <td className={styles.balanceCell}>
                    {formatBankMoney(row.balance)}
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
                            accountType: event.target.value as BankEntryFormData['accountType'],
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
                        {row.manualId ? (
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
          Each day opens as a new bank book. Entries are recorded here only and
          are not synced from sales, purchases, or expenses.
        </p>
      </div>
    </div>
  )
}

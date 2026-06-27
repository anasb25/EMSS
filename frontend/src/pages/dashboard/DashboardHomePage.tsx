import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BarChart3,
  ClipboardList,
  FileText,
  HandCoins,
  Plus,
  Receipt,
  Scale,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { fetchMainDashboard } from '@/api/reports'
import { ModulePage } from '@/components/common/ModulePage'
import { Card } from '@/components/ui/Card'
import { ROUTES } from '@/config/routes'
import { useAuth } from '@/hooks/useAuth'
import {
  formatDashboardCompact,
  formatDashboardMoneyExact,
  getDashboardChartColors,
  LEGEND_STYLE,
  TOOLTIP_STYLE,
} from '@/types/accounting-dashboard'
import {
  formatMainDashboardMoney,
  formatMainDashboardWhen,
  mainDashboardActivityLabel,
  type MainDashboard,
  type MainDashboardActivity,
} from '@/types/main-dashboard'
import styles from './DashboardHomePage.module.css'

interface KpiCardConfig {
  label: string
  value: string
  hint: string
  icon: LucideIcon
  tone: 'primary' | 'amber' | 'success' | 'slate'
  to?: string
}

interface QuickAction {
  label: string
  description: string
  to: string
  icon: LucideIcon
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: 'New job card',
    description: 'Start a shipment or service job',
    to: ROUTES.jobCards,
    icon: ClipboardList,
  },
  {
    label: 'Create invoice',
    description: 'Bill from an existing job card',
    to: ROUTES.invoices,
    icon: FileText,
  },
  // {
  //   label: 'Sales analytics',
  //   description: 'Invoiced vs collected performance',
  //   to: ROUTES.sales.analytics,
  //   icon: TrendingUp,
  // },
  // {
  //   label: 'Purchases analytics',
  //   description: 'Bills, expenses, and vendor spend',
  //   to: ROUTES.purchases.analytics,
  //   icon: TrendingDown,
  // },
]

function activityPath(activity: MainDashboardActivity): string {
  if (activity.type === 'invoice') {
    return `${ROUTES.invoices}/${activity.id}`
  }

  return ROUTES.jobCards
}

function buildOperationsKpis(dashboard: MainDashboard): KpiCardConfig[] {
  const { kpis } = dashboard

  return [
    {
      label: 'Active customers',
      value: String(kpis.activeCustomers),
      hint: 'Registered clients',
      icon: Users,
      tone: 'primary',
      to: ROUTES.customers,
    },
    {
      label: 'Open job cards',
      value: String(kpis.openJobCards),
      hint:
        kpis.jobCardsOpenedToday > 0
          ? `${kpis.jobCardsOpenedToday} opened today`
          : 'In progress',
      icon: ClipboardList,
      tone: 'amber',
      to: ROUTES.jobCards,
    },
    {
      label: 'Receivables due',
      value: formatMainDashboardMoney(kpis.arOutstanding),
      hint:
        kpis.arUnpaidCount > 0
          ? `${kpis.arUnpaidCount} unpaid invoice${kpis.arUnpaidCount === 1 ? '' : 's'}`
          : 'All collected',
      icon: HandCoins,
      tone: kpis.arUnpaidCount > 0 ? 'amber' : 'success',
      to: ROUTES.accounting.accountsReceivable,
    },
    {
      label: 'Payables due',
      value: formatMainDashboardMoney(kpis.apOutstanding),
      hint:
        kpis.apUnpaidCount > 0
          ? `${kpis.apUnpaidCount} unpaid bill${kpis.apUnpaidCount === 1 ? '' : 's'}`
          : 'All paid',
      icon: Wallet,
      tone: kpis.apUnpaidCount > 0 ? 'amber' : 'success',
      to: ROUTES.accounting.accountsPayable,
    },
  ]
}

function buildFinanceKpis(dashboard: MainDashboard): KpiCardConfig[] {
  const { kpis, monthLabel } = dashboard

  return [
    {
      label: `${monthLabel} sales`,
      value: formatMainDashboardMoney(kpis.monthRevenue),
      hint: `${kpis.monthInvoiceCount} invoices · ex VAT`,
      icon: TrendingUp,
      tone: 'success',
      to: ROUTES.invoices,
    },
    {
      label: `${monthLabel} purchases`,
      value: formatMainDashboardMoney(kpis.monthTotalSpend),
      hint: `${formatMainDashboardMoney(kpis.monthPurchases)} bills + ${formatMainDashboardMoney(kpis.monthOperatingExpenses)} expenses`,
      icon: TrendingDown,
      tone: 'amber',
      to: ROUTES.bills,
    },
    {
      label: 'Net profit',
      value: formatMainDashboardMoney(kpis.monthNetProfit),
      hint: `${monthLabel} accrual`,
      icon: Scale,
      tone: kpis.monthNetProfit >= 0 ? 'success' : 'amber',
      to: ROUTES.reports.profit,
    },
    {
      label: 'Cash book balance',
      value: formatMainDashboardMoney(kpis.cashBalance),
      hint: `Collected ${formatMainDashboardMoney(kpis.monthCollections)} this month`,
      icon: Wallet,
      tone: 'slate',
      to: ROUTES.books.cash,
    },
  ]
}

function greetingName(username: string): string {
  if (!username) {
    return 'there'
  }

  return username.charAt(0).toUpperCase() + username.slice(1)
}

function KpiGrid({ cards }: { cards: KpiCardConfig[] }) {
  return (
    <section className={styles.kpiGrid}>
      {cards.map((kpi) => {
        const Icon = kpi.icon
        const content = (
          <>
            <div className={styles.kpiTop}>
              <div className={[styles.iconWrap, styles[kpi.tone]].join(' ')}>
                <Icon size={18} strokeWidth={2} />
              </div>
              {kpi.to ? (
                <ArrowRight size={16} strokeWidth={2} className={styles.kpiArrow} />
              ) : null}
            </div>
            <p className={styles.kpiLabel}>{kpi.label}</p>
            <p className={styles.kpiValue}>{kpi.value}</p>
            <p className={styles.kpiHint}>{kpi.hint}</p>
          </>
        )

        if (kpi.to) {
          return (
            <Link key={kpi.label} to={kpi.to} className={styles.kpiLink}>
              <Card interactive className={styles.kpiCard}>
                {content}
              </Card>
            </Link>
          )
        }

        return (
          <Card key={kpi.label} className={styles.kpiCard}>
            {content}
          </Card>
        )
      })}
    </section>
  )
}

export function DashboardHomePage() {
  const { user } = useAuth()
  const [dashboard, setDashboard] = useState<MainDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const colors = useMemo(() => getDashboardChartColors(), [])

  useEffect(() => {
    let cancelled = false

    async function loadDashboard() {
      setIsLoading(true)
      setError('')

      try {
        const data = await fetchMainDashboard()
        if (!cancelled) {
          setDashboard(data)
        }
      } catch {
        if (!cancelled) {
          setError('Could not load dashboard. Please try again.')
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      cancelled = true
    }
  }, [])

  const operationsKpis = dashboard ? buildOperationsKpis(dashboard) : []
  const financeKpis = dashboard ? buildFinanceKpis(dashboard) : []
  const trendData =
    dashboard?.salesPurchasesTrend.map((point) => ({
      label: point.label,
      Sales: point.sales,
      Purchases: point.purchases,
    })) ?? []

  return (
    <ModulePage
      title="Dashboard"
      description="Combined operations and finance insights for sales, purchases, and cash."
    >
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.heroEyebrow}>Welcome back</p>
            <h2 className={styles.heroTitle}>
              Hello, {greetingName(user?.username ?? '')}
            </h2>
            <p className={styles.heroText}>
              Track sales, purchases, profit, and cash in one place. Open dedicated
              analytics for deeper sales or purchases views.
            </p>
          </div>
          <Link to={ROUTES.accounting.overview} className={styles.heroLink}>
            <BarChart3 size={18} strokeWidth={2} />
            <span>Full accounting overview</span>
            <ArrowRight size={16} strokeWidth={2} />
          </Link>
        </section>

        {error ? <p className={styles.error}>{error}</p> : null}

        {isLoading ? (
          <p className={styles.stateText}>Loading dashboard…</p>
        ) : dashboard ? (
          <>
            <div className={styles.sectionHeading}>
              <h3 className={styles.sectionHeadingTitle}>Operations</h3>
              <p className={styles.sectionHeadingText}>Customers, jobs, and balances due</p>
            </div>
            <KpiGrid cards={operationsKpis} />

            <div className={styles.sectionHeading}>
              <h3 className={styles.sectionHeadingTitle}>Finance · {dashboard.monthLabel}</h3>
              <p className={styles.sectionHeadingText}>
                Combined sales and purchases insights
              </p>
            </div>
            <KpiGrid cards={financeKpis} />

            <Card padding="lg" className={styles.trendCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <h3 className={styles.sectionTitle}>Sales vs purchases</h3>
                  <p className={styles.sectionSubtitle}>
                    {dashboard.monthLabel} performance · amounts exclude VAT
                  </p>
                </div>
                {/* <div className={styles.trendLinks}>
                  <Link to={ROUTES.sales.analytics} className={styles.trendLink}>
                    Sales analytics
                  </Link>
                  <Link to={ROUTES.purchases.analytics} className={styles.trendLink}>
                    Purchases analytics
                  </Link>
                </div> */}
              </div>
              <div className={styles.trendChart}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-subtle)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={formatDashboardCompact} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={TOOLTIP_STYLE}
                      formatter={(value) => formatDashboardMoneyExact(Number(value ?? 0))}
                    />
                    <Legend wrapperStyle={LEGEND_STYLE} />
                    <Bar dataKey="Sales" fill={colors.revenue} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Purchases" fill={colors.expenses} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <div className={styles.mainGrid}>
              <Card padding="lg" className={styles.activityCard}>
                <div className={styles.sectionHeader}>
                  <div>
                    <h3 className={styles.sectionTitle}>Recent activity</h3>
                    <p className={styles.sectionSubtitle}>
                      Latest job cards and invoices
                    </p>
                  </div>
                </div>

                {dashboard.recentActivity.length === 0 ? (
                  <p className={styles.emptyText}>
                    No activity yet. Create a job card or invoice to get started.
                  </p>
                ) : (
                  <ul className={styles.activityList}>
                    {dashboard.recentActivity.map((activity) => {
                      const Icon =
                        activity.type === 'job_card' ? ClipboardList : Receipt

                      return (
                        <li key={`${activity.type}-${activity.id}`}>
                          <Link
                            to={activityPath(activity)}
                            className={styles.activityItem}
                          >
                            <div
                              className={[
                                styles.activityIcon,
                                activity.type === 'invoice'
                                  ? styles.activityIconInvoice
                                  : styles.activityIconJob,
                              ].join(' ')}
                            >
                              <Icon size={16} strokeWidth={2} />
                            </div>
                            <div className={styles.activityBody}>
                              <p className={styles.activityTitle}>{activity.title}</p>
                              <p className={styles.activityMeta}>
                                {mainDashboardActivityLabel(activity.type)} ·{' '}
                                {activity.subtitle}
                              </p>
                            </div>
                            <div className={styles.activityAside}>
                              {activity.amount !== null ? (
                                <span className={styles.activityAmount}>
                                  {formatMainDashboardMoney(activity.amount)}
                                </span>
                              ) : null}
                              <span className={styles.activityWhen}>
                                {formatMainDashboardWhen(activity.occurredAt)}
                              </span>
                            </div>
                          </Link>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </Card>

              <div className={styles.sideColumn}>
                <Card padding="lg" className={styles.actionsCard}>
                  <div className={styles.sectionHeader}>
                    <div>
                      <h3 className={styles.sectionTitle}>Quick actions</h3>
                      <p className={styles.sectionSubtitle}>
                        Jump straight to common tasks
                      </p>
                    </div>
                  </div>
                  <div className={styles.actions}>
                    {QUICK_ACTIONS.map((action) => {
                      const Icon = action.icon

                      return (
                        <Link key={action.label} to={action.to} className={styles.actionLink}>
                          <span className={styles.actionIcon}>
                            <Icon size={16} strokeWidth={2} />
                          </span>
                          <span className={styles.actionCopy}>
                            <span className={styles.actionLabel}>{action.label}</span>
                            <span className={styles.actionDescription}>
                              {action.description}
                            </span>
                          </span>
                          <Plus size={14} strokeWidth={2} className={styles.actionPlus} />
                        </Link>
                      )
                    })}
                  </div>
                </Card>

                <Card padding="lg" className={styles.financeCard}>
                  <h3 className={styles.sectionTitle}>Combined finance snapshot</h3>
                  <p className={styles.sectionSubtitle}>
                    {dashboard.monthLabel} · accrual amounts ex VAT
                  </p>
                  <dl className={styles.financeList}>
                    <div className={styles.financeRow}>
                      <dt>Sales (invoiced)</dt>
                      <dd>{formatMainDashboardMoney(dashboard.kpis.monthRevenue)}</dd>
                    </div>
                    <div className={styles.financeRow}>
                      <dt>Collections</dt>
                      <dd>{formatMainDashboardMoney(dashboard.kpis.monthCollections)}</dd>
                    </div>
                    <div className={styles.financeRow}>
                      <dt>Purchases & expenses</dt>
                      <dd>{formatMainDashboardMoney(dashboard.kpis.monthTotalSpend)}</dd>
                    </div>
                    <div className={styles.financeRow}>
                      <dt>Net profit</dt>
                      <dd>{formatMainDashboardMoney(dashboard.kpis.monthNetProfit)}</dd>
                    </div>
                    <div className={styles.financeRow}>
                      <dt>Net VAT payable</dt>
                      <dd>{formatMainDashboardMoney(dashboard.kpis.monthNetVat)}</dd>
                    </div>
                    <div className={styles.financeRow}>
                      <dt>Cash book balance</dt>
                      <dd>{formatMainDashboardMoney(dashboard.kpis.cashBalance)}</dd>
                    </div>
                  </dl>
                  <Link to={ROUTES.accounting.overview} className={styles.financeLink}>
                    View full accounting analytics
                    <ArrowRight size={14} strokeWidth={2} />
                  </Link>
                </Card>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </ModulePage>
  )
}

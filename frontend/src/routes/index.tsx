import { Navigate, Route, Routes } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { ROUTES } from '@/config/routes'
import { LoginPage } from '@/pages/auth/LoginPage'
import { DashboardHomePage } from '@/pages/dashboard/DashboardHomePage'
import { CustomerLedgerPage } from '@/pages/customers/CustomerLedgerPage'
// import { CustomerLedgersPage } from '@/pages/customers/CustomerLedgersPage'
import { CustomersPage } from '@/pages/customers/CustomersPage'
import { VendorsPage } from '@/pages/vendors/VendorsPage'
import { JobCardsPage } from '@/pages/job-cards/JobCardsPage'
import { ProductsPage } from '@/pages/products/ProductsPage'
import { BillsPage } from '@/pages/bills/BillsPage'
import { BillViewPage } from '@/pages/bills/BillViewPage'
import { InvoicesPage } from '@/pages/invoices/InvoicesPage'
import { InvoiceViewPage } from '@/pages/invoices/InvoiceViewPage'
import { InvoiceEditPage } from '@/pages/invoices/InvoiceEditPage'
import { AccountingOverviewPage } from '@/pages/accounting/AccountingOverviewPage'
import { BankBookPage } from '@/pages/books/BankBookPage'
import { CashPage } from '@/pages/accounting/CashPage'
import { SalesPage } from '@/pages/accounting/SalesPage'
import { AccountsPayablePage } from '@/pages/accounting/AccountsPayablePage'
import { AccountsReceivablePage } from '@/pages/accounting/AccountsReceivablePage'
// import { ReceiptVouchersPage } from '@/pages/accounting/ReceiptVouchersPage'
import { ExpensesPage } from '@/pages/accounting/ExpensesPage'
import { ProfitPage } from '@/pages/accounting/ProfitPage'
import { VatPage } from '@/pages/accounting/VatPage'
// import { SalesAnalyticsPage } from '@/pages/sales/SalesAnalyticsPage'
// import { PurchasesAnalyticsPage } from '@/pages/purchases/PurchasesAnalyticsPage'
import { BalanceSheetPage } from '@/pages/reports/BalanceSheetPage'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { AdminRoute } from '@/routes/AdminRoute'
import { SettingsLayout } from '@/pages/settings/SettingsLayout'
import { UsersPage } from '@/pages/settings/UsersPage'

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path={ROUTES.login} element={<LoginPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path={ROUTES.dashboard} element={<DashboardHomePage />} />
          <Route
            path={ROUTES.customerLedgers}
            element={<Navigate to={ROUTES.customers} replace />}
          />
          <Route path={ROUTES.customerLedger} element={<CustomerLedgerPage />} />
          <Route path={ROUTES.customers} element={<CustomersPage />} />
          <Route path={ROUTES.vendors} element={<VendorsPage />} />
          <Route path={ROUTES.jobCards} element={<JobCardsPage />} />
          <Route path={ROUTES.products} element={<ProductsPage />} />
          <Route path={ROUTES.invoices} element={<InvoicesPage />} />
          <Route path={ROUTES.invoiceEdit} element={<InvoiceEditPage />} />
          <Route path={ROUTES.invoiceDetail} element={<InvoiceViewPage />} />
          <Route path={ROUTES.bills} element={<BillsPage />} />
          <Route path={ROUTES.billDetail} element={<BillViewPage />} />
          <Route path={ROUTES.books.cash} element={<CashPage />} />
          <Route path={ROUTES.books.bank} element={<BankBookPage />} />
          <Route
            path="/accounting/cash"
            element={<Navigate to={ROUTES.books.cash} replace />}
          />
          {/* <Route path={ROUTES.sales.analytics} element={<SalesAnalyticsPage />} /> */}
          {/* <Route path={ROUTES.purchases.analytics} element={<PurchasesAnalyticsPage />} /> */}
          <Route path={ROUTES.accounting.overview} element={<AccountingOverviewPage />} />
          <Route path={ROUTES.accounting.sales} element={<SalesPage />} />
          <Route path={ROUTES.accounting.accountsPayable} element={<AccountsPayablePage />} />
          <Route
            path={ROUTES.accounting.accountsReceivable}
            element={<AccountsReceivablePage />}
          />
          <Route
            path={ROUTES.accounting.receiptVouchers}
            element={<Navigate to={ROUTES.accounting.accountsReceivable} replace />}
          />
          <Route path={ROUTES.accounting.expenses} element={<ExpensesPage />} />
          <Route path={ROUTES.reports.profit} element={<ProfitPage />} />
          <Route path={ROUTES.reports.vat} element={<VatPage />} />
          <Route path={ROUTES.reports.balanceSheet} element={<BalanceSheetPage />} />
          <Route
            path="/accounting/profit"
            element={<Navigate to={ROUTES.reports.profit} replace />}
          />
          <Route
            path="/accounting/vat"
            element={<Navigate to={ROUTES.reports.vat} replace />}
          />
          <Route
            path={ROUTES.books.root}
            element={<Navigate to={ROUTES.books.cash} replace />}
          />
          <Route
            path={ROUTES.reports.root}
            element={<Navigate to={ROUTES.reports.profit} replace />}
          />
          <Route
            path={ROUTES.accounting.root}
            element={<Navigate to={ROUTES.accounting.overview} replace />}
          />
          <Route element={<AdminRoute />}>
            <Route path={ROUTES.settings.root} element={<SettingsLayout />}>
              <Route index element={<Navigate to={ROUTES.settings.users} replace />} />
              <Route path="users" element={<UsersPage />} />
            </Route>
          </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to={ROUTES.dashboard} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
    </Routes>
  )
}

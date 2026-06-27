import {
  Banknote,
  BookOpen,
  ClipboardList,
  FileText,
  Landmark,
  LayoutDashboard,
  Layers,
  Package,
  PieChart,
  Receipt,
  Scale,
  Settings,
  TrendingUp,
  Truck,
  UserCog,
  Users,
  Wallet,
  // BarChart3,
} from 'lucide-react'
import type { NavItem } from '@/types/navigation'
import { ROUTES } from '@/config/routes'
import { RoleName } from '@/types/user'

export const mainNavigation: NavItem[] = [
  {
    label: 'Dashboard',
    path: ROUTES.dashboard,
    icon: LayoutDashboard,
  },
  {
    label: 'Items',
    path: ROUTES.products,
    icon: Layers,
    children: [
      {
        label: 'Products',
        path: ROUTES.products,
        icon: Package,
      },
    ],
  },
  {
    label: 'Sales',
    path: ROUTES.customers,
    icon: TrendingUp,
    children: [
      {
        label: 'Customers',
        path: ROUTES.customers,
        icon: Users,
      },
      {
        label: 'Job Cards',
        path: ROUTES.jobCards,
        icon: ClipboardList,
      },
      {
        label: 'Invoices',
        path: ROUTES.invoices,
        icon: FileText,
      },
      {
        label: 'Payments Receivable',
        path: ROUTES.accounting.accountsReceivable,
        icon: Banknote,
      },
      // {
      //   label: 'Sales Analytics',
      //   path: ROUTES.sales.analytics,
      //   icon: BarChart3,
      // },
    ],
  },
  {
    label: 'Purchases',
    path: ROUTES.vendors,
    icon: Truck,
    children: [
      {
        label: 'Vendors',
        path: ROUTES.vendors,
        icon: Truck,
      },
      {
        label: 'Bills',
        path: ROUTES.bills,
        icon: Receipt,
      },
      {
        label: 'Payments Made',
        path: ROUTES.accounting.accountsPayable,
        icon: Receipt,
      },
      // {
      //   label: 'Purchases Analytics',
      //   path: ROUTES.purchases.analytics,
      //   icon: BarChart3,
      // },
    ],
  },
  {
    label: 'Books',
    path: ROUTES.books.cash,
    icon: BookOpen,
    children: [
      {
        label: 'Cash Book',
        path: ROUTES.books.cash,
        icon: Wallet,
      },
      {
        label: 'Bank Book',
        path: ROUTES.books.bank,
        icon: Landmark,
      },
    ],
  },
  {
    label: 'Reports',
    path: ROUTES.reports.root,
    icon: PieChart,
    children: [
      {
        label: 'Profit & Loss',
        path: ROUTES.reports.profit,
        icon: TrendingUp,
      },
      {
        label: 'VAT',
        path: ROUTES.reports.vat,
        icon: FileText,
      },
      {
        label: 'Balance Sheet',
        path: ROUTES.reports.balanceSheet,
        icon: Scale,
      },
    ],
  },
  {
    label: 'Settings',
    path: ROUTES.settings.root,
    icon: Settings,
    roles: [RoleName.ADMIN],
    children: [
      {
        label: 'User Management',
        path: ROUTES.settings.users,
        icon: UserCog,
        roles: [RoleName.ADMIN],
      },
    ],
  },
]

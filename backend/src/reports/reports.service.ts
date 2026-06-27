import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BankEntry } from '../bank/entities/bank-entry.entity';
import { Bill } from '../bills/entities/bill.entity';
import {
  CashEntry,
  CashEntryType,
} from '../cash/entities/cash-entry.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { JobCard } from '../job-cards/entities/job-card.entity';
import { Payable, PayableStatus } from '../payables/entities/payable.entity';
import {
  Receivable,
  ReceivableStatus,
} from '../receivables/entities/receivable.entity';
import { SalesEntry } from '../sales/entities/sales-entry.entity';
import { QueryAccountingDashboardDto } from './dto/query-accounting-dashboard.dto';
import { QueryBalanceSheetDto } from './dto/query-balance-sheet.dto';
import { QueryDateRangeDto } from './dto/query-date-range.dto';
import { QueryProfitLossDto } from './dto/query-profit-loss.dto';
import { QueryVatReportDto } from './dto/query-vat-report.dto';
import {
  BalanceSheetColumn,
  BalanceSheetLine,
  BalanceSheetReport,
} from './interfaces/balance-sheet-report.interface';
import {
  AccountingCashFlowPoint,
  AccountingCategoryPoint,
  AccountingDashboard,
  AccountingStatusBreakdown,
  AccountingTrendPoint,
} from './interfaces/accounting-dashboard.interface';
import {
  MainDashboard,
  MainDashboardActivity,
  MainDashboardTrendPoint,
} from './interfaces/main-dashboard.interface';
import {
  PurchasesAnalytics,
  PurchasesAnalyticsTrendPoint,
} from './interfaces/purchases-analytics.interface';
import {
  ProfitLossBasis,
  ProfitLossLine,
  ProfitLossReport,
  ProfitLossSection,
} from './interfaces/profit-loss-report.interface';
import {
  AnalyticsPartyPoint,
  SalesAnalytics,
  SalesAnalyticsTrendPoint,
} from './interfaces/sales-analytics.interface';
import {
  VatReport,
  VatReportFilter,
  VatReportLine,
} from './interfaces/vat-report.interface';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    @InjectRepository(Bill)
    private readonly billsRepository: Repository<Bill>,
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(SalesEntry)
    private readonly salesEntriesRepository: Repository<SalesEntry>,
    @InjectRepository(Payable)
    private readonly payablesRepository: Repository<Payable>,
    @InjectRepository(Receivable)
    private readonly receivablesRepository: Repository<Receivable>,
    @InjectRepository(CashEntry)
    private readonly cashEntriesRepository: Repository<CashEntry>,
    @InjectRepository(BankEntry)
    private readonly bankEntriesRepository: Repository<BankEntry>,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectRepository(JobCard)
    private readonly jobCardsRepository: Repository<JobCard>,
  ) {}

  async getMainDashboard(): Promise<MainDashboard> {
    const { dateFrom, dateTo, label } = this.getCurrentMonthRange();
    const today = this.formatIsoDate(new Date());

    const [
      activeCustomers,
      openJobCards,
      jobCardsOpenedToday,
      receivablesStatus,
      payablesStatus,
      monthProfitLoss,
      monthVat,
      monthInvoiceCount,
      monthCollections,
      monthBillPurchases,
      cashBalance,
      salesPurchasesTrend,
      recentJobCards,
      recentInvoices,
    ] = await Promise.all([
      this.customersRepository.count({ where: { isActive: true } }),
      this.jobCardsRepository.count({ where: { isOpen: true } }),
      this.jobCardsRepository
        .createQueryBuilder('jobCard')
        .where('DATE(jobCard.created_at) = :today', { today })
        .getCount(),
      this.getReceivablesStatus(),
      this.getPayablesStatus(),
      this.getProfitLoss({ dateFrom, dateTo, basis: 'accrual' }),
      this.getVatReport({ dateFrom, dateTo, filter: 'all' }),
      this.countInvoices(dateFrom, dateTo),
      this.sumSalesCollections(dateFrom, dateTo),
      this.sumBillSubtotals(dateFrom, dateTo),
      this.getCashBookBalance(dateTo),
      this.buildSalesPurchasesTrend(dateFrom, dateTo),
      this.jobCardsRepository.find({
        relations: { customer: true },
        order: { createdAt: 'DESC' },
        take: 6,
      }),
      this.invoicesRepository.find({
        order: { createdAt: 'DESC' },
        take: 6,
      }),
    ]);

    const monthOperatingExpenses = monthProfitLoss.operatingExpenses.total;
    const recentActivity = this.buildMainDashboardActivity(
      recentJobCards,
      recentInvoices,
    );

    return {
      monthLabel: label,
      dateFrom,
      dateTo,
      kpis: {
        activeCustomers,
        openJobCards,
        jobCardsOpenedToday,
        monthRevenue: monthProfitLoss.income.total,
        monthInvoiceCount,
        monthCollections,
        monthPurchases: monthBillPurchases,
        monthOperatingExpenses,
        monthTotalSpend: monthBillPurchases + monthOperatingExpenses,
        monthNetProfit: monthProfitLoss.netProfit,
        monthNetVat: monthVat.summary.netVatPayable,
        cashBalance,
        arOutstanding: receivablesStatus.unpaidAmount,
        arUnpaidCount: receivablesStatus.unpaidCount,
        apOutstanding: payablesStatus.unpaidAmount,
        apUnpaidCount: payablesStatus.unpaidCount,
      },
      salesPurchasesTrend,
      recentActivity,
    };
  }

  async getSalesAnalytics(query: QueryDateRangeDto): Promise<SalesAnalytics> {
    const trendGranularity = this.resolveTrendGranularity(
      query.dateFrom,
      query.dateTo,
    );

    const [
      invoicedRevenue,
      collectedRevenue,
      invoiceCount,
      collectionCount,
      receivablesStatus,
      invoicedTrend,
      collectedTrend,
      topCustomers,
    ] = await Promise.all([
      this.sumInvoiceSubtotal(query.dateFrom, query.dateTo),
      this.sumSalesCollections(query.dateFrom, query.dateTo),
      this.countInvoices(query.dateFrom, query.dateTo),
      this.countSalesEntries(query.dateFrom, query.dateTo),
      this.getReceivablesStatus(),
      this.groupInvoicesByPeriod(
        query.dateFrom,
        query.dateTo,
        trendGranularity,
      ),
      this.groupSalesByPeriod(query.dateFrom, query.dateTo, trendGranularity),
      this.groupInvoicesByCustomer(query.dateFrom, query.dateTo),
    ]);

    const invoicedMap = new Map(
      invoicedTrend.map((row) => [row.period, Number(row.total)]),
    );
    const collectedMap = new Map(
      collectedTrend.map((row) => [row.period, Number(row.total)]),
    );

    const trend: SalesAnalyticsTrendPoint[] = this.enumeratePeriods(
      query.dateFrom,
      query.dateTo,
      trendGranularity,
    ).map((period) => ({
      period,
      label: this.formatTrendLabel(period, trendGranularity),
      invoiced: invoicedMap.get(period) ?? 0,
      collected: collectedMap.get(period) ?? 0,
    }));

    return {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      trendGranularity,
      kpis: {
        invoicedRevenue,
        collectedRevenue,
        collectionGap: invoicedRevenue - collectedRevenue,
        invoiceCount,
        collectionCount,
        arOutstanding: receivablesStatus.unpaidAmount,
        arUnpaidCount: receivablesStatus.unpaidCount,
      },
      trend,
      topCustomers,
    };
  }

  async getPurchasesAnalytics(
    query: QueryDateRangeDto,
  ): Promise<PurchasesAnalytics> {
    const trendGranularity = this.resolveTrendGranularity(
      query.dateFrom,
      query.dateTo,
    );

    const [
      billPurchases,
      expenseLines,
      billCount,
      expenseCount,
      payablesStatus,
      billTrend,
      expenseTrend,
      topVendors,
    ] = await Promise.all([
      this.sumBillSubtotals(query.dateFrom, query.dateTo),
      this.groupExpensesByCategory(query.dateFrom, query.dateTo),
      this.countBills(query.dateFrom, query.dateTo),
      this.countExpenses(query.dateFrom, query.dateTo),
      this.getPayablesStatus(),
      this.groupBillsByPeriod(query.dateFrom, query.dateTo, trendGranularity),
      this.groupExpenseTotalsByPeriod(
        query.dateFrom,
        query.dateTo,
        trendGranularity,
      ),
      this.groupBillsByVendor(query.dateFrom, query.dateTo),
    ]);

    const operatingExpenses = expenseLines.reduce(
      (sum, line) => sum + line.amount,
      0,
    );
    const billMap = new Map(
      billTrend.map((row) => [row.period, Number(row.total)]),
    );
    const expenseMap = new Map(
      expenseTrend.map((row) => [row.period, Number(row.total)]),
    );

    const trend: PurchasesAnalyticsTrendPoint[] = this.enumeratePeriods(
      query.dateFrom,
      query.dateTo,
      trendGranularity,
    ).map((period) => ({
      period,
      label: this.formatTrendLabel(period, trendGranularity),
      bills: billMap.get(period) ?? 0,
      expenses: expenseMap.get(period) ?? 0,
    }));

    return {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      trendGranularity,
      kpis: {
        billPurchases,
        operatingExpenses,
        totalSpend: billPurchases + operatingExpenses,
        billCount,
        expenseCount,
        apOutstanding: payablesStatus.unpaidAmount,
        apUnpaidCount: payablesStatus.unpaidCount,
      },
      trend,
      topVendors,
      expensesByCategory: expenseLines.map((line) => ({
        period: line.key,
        label: line.label,
        amount: line.amount,
      })),
    };
  }

  async getAccountingDashboard(
    query: QueryAccountingDashboardDto,
  ): Promise<AccountingDashboard> {
    const basis = query.basis ?? 'accrual';
    const trendGranularity = this.resolveTrendGranularity(
      query.dateFrom,
      query.dateTo,
    );

    const [
      profitLoss,
      vatReport,
      expenseLines,
      revenueExpenseTrend,
      cashFlowTrend,
      receivablesStatus,
      payablesStatus,
      cashTotals,
      invoiceCount,
      billCount,
      expenseCount,
    ] = await Promise.all([
      this.getProfitLoss({ ...query, basis }),
      this.getVatReport({ ...query, filter: 'all' }),
      this.groupExpensesByCategory(query.dateFrom, query.dateTo),
      this.buildRevenueExpenseTrend(
        query.dateFrom,
        query.dateTo,
        basis,
        trendGranularity,
      ),
      this.buildCashFlowTrend(
        query.dateFrom,
        query.dateTo,
        trendGranularity,
      ),
      this.getReceivablesStatus(),
      this.getPayablesStatus(),
      this.sumCashMovements(query.dateFrom, query.dateTo),
      this.countInvoices(query.dateFrom, query.dateTo),
      this.countBills(query.dateFrom, query.dateTo),
      this.countExpenses(query.dateFrom, query.dateTo),
    ]);

    const operatingExpenses = profitLoss.operatingExpenses.total;
    const purchases = profitLoss.purchases?.total ?? 0;
    const expenses =
      basis === 'accrual' ? purchases + operatingExpenses : operatingExpenses;

    const expenseByCategory: AccountingCategoryPoint[] = expenseLines
      .map((line) => ({
        label: line.label,
        amount: line.amount,
      }))
      .filter((line) => line.amount > 0)
      .sort((left, right) => right.amount - left.amount);

    return {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      basis,
      trendGranularity,
      kpis: {
        revenue: profitLoss.income.total,
        expenses,
        netProfit: profitLoss.netProfit,
        grossProfit: profitLoss.grossProfit ?? null,
        outputVat: vatReport.summary.outputVat,
        inputVat: vatReport.summary.inputVat,
        netVat: vatReport.summary.netVatPayable,
        cashIn: cashTotals.cashIn,
        cashOut: cashTotals.cashOut,
        cashNet: cashTotals.cashIn - cashTotals.cashOut,
        arOutstanding: receivablesStatus.unpaidAmount,
        apOutstanding: payablesStatus.unpaidAmount,
        arUnpaidCount: receivablesStatus.unpaidCount,
        apUnpaidCount: payablesStatus.unpaidCount,
        invoiceCount,
        billCount,
        expenseCount,
      },
      revenueExpenseTrend,
      expenseByCategory,
      cashFlowTrend,
      receivablesStatus,
      payablesStatus,
    };
  }

  async getProfitLoss(query: QueryProfitLossDto): Promise<ProfitLossReport> {
    const basis: ProfitLossBasis = query.basis ?? 'accrual';

    if (basis === 'cash') {
      return this.buildCashReport(query.dateFrom, query.dateTo);
    }

    return this.buildAccrualReport(query.dateFrom, query.dateTo);
  }

  async getBalanceSheet(
    query: QueryBalanceSheetDto,
  ): Promise<BalanceSheetReport> {
    const asOfDate = query.asOfDate ?? this.formatIsoDate(new Date());
    const yearStart = `${asOfDate.slice(0, 4)}-01-01`;

    const [
      cashBalance,
      bankBalance,
      accountsReceivable,
      accountsPayable,
      cumulativeVat,
      currentYearEarnings,
    ] = await Promise.all([
      this.getCashBookBalance(asOfDate),
      this.getBankBookBalance(asOfDate),
      this.sumOutstandingReceivables(asOfDate),
      this.sumOutstandingPayables(asOfDate),
      this.getCumulativeNetVat(asOfDate),
      this.getAccrualNetProfit(yearStart, asOfDate),
    ]);

    const vatRecoverable = cumulativeVat < 0 ? Math.abs(cumulativeVat) : 0;
    const vatPayable = cumulativeVat > 0 ? cumulativeVat : 0;

    const currentAssetsTotal =
      cashBalance + bankBalance + accountsReceivable + vatRecoverable;
    const totalAssets = currentAssetsTotal;

    const currentLiabilitiesTotal = accountsPayable + vatPayable;
    const retainedEarnings =
      totalAssets - currentLiabilitiesTotal - currentYearEarnings;
    const totalEquity = currentYearEarnings + retainedEarnings;
    const totalLiabilitiesAndEquity = currentLiabilitiesTotal + totalEquity;

    const assetLines: BalanceSheetLine[] = [
      {
        key: 'current-assets',
        label: 'Current Assets',
        amount: 0,
        indent: 0,
        isSection: true,
      },
      {
        key: 'cash',
        label: 'Cash',
        amount: cashBalance,
        indent: 1,
      },
      {
        key: 'bank',
        label: 'Bank',
        amount: bankBalance,
        indent: 1,
      },
      {
        key: 'accounts-receivable',
        label: 'Accounts Receivable',
        amount: accountsReceivable,
        indent: 1,
      },
    ];

    if (vatRecoverable > 0) {
      assetLines.push({
        key: 'vat-recoverable',
        label: 'VAT Recoverable',
        amount: vatRecoverable,
        indent: 1,
      });
    }

    assetLines.push(
      {
        key: 'total-current-assets',
        label: 'Total for Current Assets',
        amount: currentAssetsTotal,
        indent: 0,
        isTotal: true,
      },
      {
        key: 'total-assets',
        label: 'Total Assets',
        amount: totalAssets,
        indent: 0,
        isTotal: true,
      },
    );

    const liabilityEquityLines: BalanceSheetLine[] = [
      {
        key: 'liabilities',
        label: 'Liabilities',
        amount: 0,
        indent: 0,
        isSection: true,
      },
      {
        key: 'current-liabilities',
        label: 'Current Liabilities',
        amount: 0,
        indent: 0,
        isSection: true,
      },
      {
        key: 'accounts-payable',
        label: 'Accounts Payable',
        amount: accountsPayable,
        indent: 1,
      },
    ];

    if (vatPayable > 0) {
      liabilityEquityLines.push({
        key: 'vat-payable',
        label: 'VAT Payable',
        amount: vatPayable,
        indent: 1,
      });
    }

    liabilityEquityLines.push(
      {
        key: 'total-current-liabilities',
        label: 'Total for Current Liabilities',
        amount: currentLiabilitiesTotal,
        indent: 0,
        isTotal: true,
      },
      {
        key: 'equity',
        label: 'Equity',
        amount: 0,
        indent: 0,
        isSection: true,
      },
      {
        key: 'current-year-earnings',
        label: 'Current Year Earnings',
        amount: currentYearEarnings,
        indent: 1,
      },
      {
        key: 'retained-earnings',
        label: 'Retained Earnings',
        amount: retainedEarnings,
        indent: 1,
      },
      {
        key: 'total-equity',
        label: 'Total for Equity',
        amount: totalEquity,
        indent: 0,
        isTotal: true,
      },
      {
        key: 'total-liabilities-equity',
        label: 'Total Liabilities & Equity',
        amount: totalLiabilitiesAndEquity,
        indent: 0,
        isTotal: true,
      },
    );

    const assets: BalanceSheetColumn = {
      title: 'Assets',
      lines: assetLines,
      total: totalAssets,
    };

    const liabilitiesAndEquity: BalanceSheetColumn = {
      title: 'Liabilities & Equity',
      lines: liabilityEquityLines,
      total: totalLiabilitiesAndEquity,
    };

    return {
      asOfDate,
      assets,
      liabilitiesAndEquity,
      balanced:
        Math.abs(totalAssets - totalLiabilitiesAndEquity) < 0.01,
    };
  }

  async getVatReport(query: QueryVatReportDto): Promise<VatReport> {
    const filter: VatReportFilter = query.filter ?? 'all';
    const sales = await this.fetchSalesVatLines(query.dateFrom, query.dateTo);
    const purchases = await this.fetchPurchaseVatLines(
      query.dateFrom,
      query.dateTo,
    );
    const payNowExpenses = await this.fetchPayNowVatLines(
      query.dateFrom,
      query.dateTo,
    );

    const filteredSales = filter === 'all' || filter === 'sales' ? sales : [];
    const filteredPurchases =
      filter === 'all' || filter === 'purchases' ? purchases : [];
    const filteredPayNow =
      filter === 'all' || filter === 'paynow' ? payNowExpenses : [];

    const outputVat = filteredSales.reduce(
      (sum, line) => sum + line.vatAmount,
      0,
    );
    const outputTaxable = filteredSales.reduce(
      (sum, line) => sum + line.taxableAmount,
      0,
    );
    const inputVat =
      filteredPurchases.reduce((sum, line) => sum + line.vatAmount, 0) +
      filteredPayNow.reduce((sum, line) => sum + line.vatAmount, 0);
    const inputTaxable =
      filteredPurchases.reduce((sum, line) => sum + line.taxableAmount, 0) +
      filteredPayNow.reduce((sum, line) => sum + line.taxableAmount, 0);

    const lines = [...filteredSales, ...filteredPurchases, ...filteredPayNow]
      .sort((left, right) => right.date.localeCompare(left.date));

    return {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      filter,
      summary: {
        outputVat,
        outputTaxable,
        inputVat,
        inputTaxable,
        netVatPayable: outputVat - inputVat,
      },
      sales: filteredSales,
      purchases: filteredPurchases,
      payNowExpenses: filteredPayNow,
      lines,
    };
  }

  private async fetchSalesVatLines(
    dateFrom: string,
    dateTo: string,
  ): Promise<VatReportLine[]> {
    const invoices = await this.invoicesRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.jobCard', 'jobCard')
      .leftJoinAndSelect('jobCard.customer', 'customer')
      .where('DATE(invoice.created_at) >= :dateFrom', { dateFrom })
      .andWhere('DATE(invoice.created_at) <= :dateTo', { dateTo })
      .orderBy('invoice.created_at', 'DESC')
      .getMany();

    return invoices.map((invoice) => ({
      id: invoice.id,
      type: 'sales',
      date: invoice.createdAt.toISOString().slice(0, 10),
      documentNumber: invoice.invoiceNumber,
      partyName: invoice.jobCard?.customer?.name ?? 'Customer',
      description: `Invoice ${invoice.invoiceNumber}`,
      taxableAmount: Number(invoice.subtotal),
      vatAmount: Number(invoice.vatTotal),
      totalAmount: Number(invoice.grandTotal),
      vatPercent: Number(invoice.subtotal) > 0
        ? Math.round((Number(invoice.vatTotal) / Number(invoice.subtotal)) * 10000) / 100
        : 0,
    }));
  }

  private async fetchPurchaseVatLines(
    dateFrom: string,
    dateTo: string,
  ): Promise<VatReportLine[]> {
    const bills = await this.billsRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.vendor', 'vendor')
      .where('bill.billDate >= :dateFrom', { dateFrom })
      .andWhere('bill.billDate <= :dateTo', { dateTo })
      .orderBy('bill.billDate', 'DESC')
      .addOrderBy('bill.createdAt', 'DESC')
      .getMany();

    return bills.map((bill) => ({
      id: bill.id,
      type: 'purchase',
      date: bill.billDate,
      documentNumber: bill.billNumber,
      partyName: bill.vendor?.name ?? 'Vendor',
      description: bill.vendorReference
        ? `Bill ${bill.billNumber} (${bill.vendorReference})`
        : `Bill ${bill.billNumber}`,
      taxableAmount: Number(bill.subtotal),
      vatAmount: Number(bill.vatTotal),
      totalAmount: Number(bill.grandTotal),
      vatPercent: Number(bill.subtotal) > 0
        ? Math.round((Number(bill.vatTotal) / Number(bill.subtotal)) * 10000) / 100
        : 0,
    }));
  }

  private async fetchPayNowVatLines(
    dateFrom: string,
    dateTo: string,
  ): Promise<VatReportLine[]> {
    const expenses = await this.expensesRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.category', 'category')
      .leftJoinAndSelect('expense.vendor', 'vendor')
      .where('expense.expenseDate >= :dateFrom', { dateFrom })
      .andWhere('expense.expenseDate <= :dateTo', { dateTo })
      .andWhere('expense.include_vat = true')
      .andWhere('expense.vat_amount > 0')
      .orderBy('expense.expenseDate', 'DESC')
      .addOrderBy('expense.id', 'DESC')
      .getMany();

    return expenses.map((expense) => ({
      id: String(expense.id),
      type: 'paynow',
      date: expense.expenseDate,
      documentNumber: `EXP-${expense.id}`,
      partyName: expense.vendor?.name ?? expense.category?.name ?? 'Expense',
      description: expense.description,
      taxableAmount: Number(expense.subtotal),
      vatAmount: Number(expense.vatAmount),
      totalAmount: Number(expense.amount),
      vatPercent: Number(expense.vatPercent),
    }));
  }

  private async buildAccrualReport(
    dateFrom: string,
    dateTo: string,
  ): Promise<ProfitLossReport> {
    const invoiceIncome = await this.sumInvoiceSubtotal(dateFrom, dateTo);
    const billPurchases = await this.sumBillSubtotals(dateFrom, dateTo);
    const expenseLines = await this.groupExpensesByCategory(dateFrom, dateTo);

    const income = this.buildSection([
      {
        key: 'invoice-sales',
        label: 'Sales (Invoices)',
        amount: invoiceIncome,
      },
    ]);

    const purchases = this.buildSection([
      {
        key: 'vendor-bills',
        label: 'Vendor Bills (Purchases)',
        amount: billPurchases,
      },
    ]);

    const operatingExpenses = this.buildSection(expenseLines);
    const grossProfit = income.total - purchases.total;
    const netProfit = grossProfit - operatingExpenses.total;

    return {
      dateFrom,
      dateTo,
      basis: 'accrual',
      income,
      purchases,
      grossProfit,
      operatingExpenses,
      netProfit,
    };
  }

  private async buildCashReport(
    dateFrom: string,
    dateTo: string,
  ): Promise<ProfitLossReport> {
    const salesIncome = await this.sumSalesCollections(dateFrom, dateTo);
    const expenseLines = await this.groupExpensesByCategory(dateFrom, dateTo);
    const vendorPayments = await this.sumPaidPayables(dateFrom, dateTo);

    const income = this.buildSection([
      {
        key: 'sales-collections',
        label: 'Sales Collections',
        amount: salesIncome,
      },
    ]);

    const operatingExpenses = this.buildSection([
      ...expenseLines,
      {
        key: 'vendor-payments',
        label: 'Vendor Payments',
        amount: vendorPayments,
      },
    ]);

    const netProfit = income.total - operatingExpenses.total;

    return {
      dateFrom,
      dateTo,
      basis: 'cash',
      income,
      operatingExpenses,
      netProfit,
    };
  }

  private buildSection(lines: ProfitLossLine[]): ProfitLossSection {
    const nonZeroLines = lines.filter((line) => line.amount !== 0);
    const total = lines.reduce((sum, line) => sum + line.amount, 0);

    return {
      lines: nonZeroLines.length ? nonZeroLines : lines,
      total,
    };
  }

  private async sumInvoiceSubtotal(
    dateFrom: string,
    dateTo: string,
  ): Promise<number> {
    const result = await this.invoicesRepository
      .createQueryBuilder('invoice')
      .select('COALESCE(SUM(invoice.subtotal), 0)', 'total')
      .where('DATE(invoice.created_at) >= :dateFrom', { dateFrom })
      .andWhere('DATE(invoice.created_at) <= :dateTo', { dateTo })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }

  private async sumBillSubtotals(
    dateFrom: string,
    dateTo: string,
  ): Promise<number> {
    const result = await this.billsRepository
      .createQueryBuilder('bill')
      .select('COALESCE(SUM(bill.subtotal), 0)', 'total')
      .where('bill.billDate >= :dateFrom', { dateFrom })
      .andWhere('bill.billDate <= :dateTo', { dateTo })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }

  private async sumSalesCollections(
    dateFrom: string,
    dateTo: string,
  ): Promise<number> {
    const result = await this.salesEntriesRepository
      .createQueryBuilder('entry')
      .select('COALESCE(SUM(entry.amount), 0)', 'total')
      .where('entry.saleDate >= :dateFrom', { dateFrom })
      .andWhere('entry.saleDate <= :dateTo', { dateTo })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }

  private async sumPaidPayables(
    dateFrom: string,
    dateTo: string,
  ): Promise<number> {
    const result = await this.payablesRepository
      .createQueryBuilder('payable')
      .select('COALESCE(SUM(payable.amount), 0)', 'total')
      .where('payable.status = :status', { status: PayableStatus.PAID })
      .andWhere('DATE(payable.paid_at) >= :dateFrom', { dateFrom })
      .andWhere('DATE(payable.paid_at) <= :dateTo', { dateTo })
      .getRawOne<{ total: string }>();

    return Number(result?.total ?? 0);
  }

  private async groupExpensesByCategory(
    dateFrom: string,
    dateTo: string,
  ): Promise<ProfitLossLine[]> {
    const rows = await this.expensesRepository
      .createQueryBuilder('expense')
      .leftJoin('expense.category', 'category')
      .select('category.id', 'categoryId')
      .addSelect('category.name', 'label')
      .addSelect('COALESCE(SUM(expense.subtotal), 0)', 'amount')
      .where('expense.expenseDate >= :dateFrom', { dateFrom })
      .andWhere('expense.expenseDate <= :dateTo', { dateTo })
      .groupBy('category.id')
      .addGroupBy('category.name')
      .orderBy('category.name', 'ASC')
      .getRawMany<{ categoryId: string; label: string; amount: string }>();

    return rows.map((row) => ({
      key: `expense-${row.categoryId}`,
      categoryId: Number(row.categoryId),
      label: row.label,
      amount: Number(row.amount),
    }));
  }

  private async buildSalesPurchasesTrend(
    dateFrom: string,
    dateTo: string,
  ): Promise<MainDashboardTrendPoint[]> {
    const granularity = this.resolveTrendGranularity(dateFrom, dateTo);
    const [salesRows, billRows, expenseRows] = await Promise.all([
      this.groupInvoicesByPeriod(dateFrom, dateTo, granularity),
      this.groupBillsByPeriod(dateFrom, dateTo, granularity),
      this.groupExpenseTotalsByPeriod(dateFrom, dateTo, granularity),
    ]);
    const salesMap = new Map(
      salesRows.map((row) => [row.period, Number(row.total)]),
    );
    const purchasesMap = this.mergePeriodTotals(billRows, expenseRows);

    return this.enumeratePeriods(dateFrom, dateTo, granularity).map(
      (period) => ({
        period,
        label: this.formatTrendLabel(period, granularity),
        sales: salesMap.get(period) ?? 0,
        purchases: purchasesMap.get(period) ?? 0,
      }),
    );
  }

  private async groupInvoicesByCustomer(
    dateFrom: string,
    dateTo: string,
  ): Promise<AnalyticsPartyPoint[]> {
    const rows = await this.invoicesRepository
      .createQueryBuilder('invoice')
      .leftJoin('invoice.jobCard', 'jobCard')
      .leftJoin('jobCard.customer', 'customer')
      .select('customer.id', 'id')
      .addSelect('customer.name', 'name')
      .addSelect('COUNT(*)', 'documentCount')
      .addSelect('COALESCE(SUM(invoice.subtotal), 0)', 'amount')
      .where('DATE(invoice.created_at) >= :dateFrom', { dateFrom })
      .andWhere('DATE(invoice.created_at) <= :dateTo', { dateTo })
      .groupBy('customer.id')
      .addGroupBy('customer.name')
      .orderBy('amount', 'DESC')
      .limit(8)
      .getRawMany<{
        id: string;
        name: string;
        documentCount: string;
        amount: string;
      }>();

    return rows.map((row) => ({
      id: row.id,
      name: row.name ?? 'Customer',
      documentCount: Number(row.documentCount),
      amount: Number(row.amount),
    }));
  }

  private async groupBillsByVendor(
    dateFrom: string,
    dateTo: string,
  ): Promise<AnalyticsPartyPoint[]> {
    const rows = await this.billsRepository
      .createQueryBuilder('bill')
      .leftJoin('bill.vendor', 'vendor')
      .select('vendor.id', 'id')
      .addSelect('vendor.name', 'name')
      .addSelect('COUNT(*)', 'documentCount')
      .addSelect('COALESCE(SUM(bill.subtotal), 0)', 'amount')
      .where('bill.billDate >= :dateFrom', { dateFrom })
      .andWhere('bill.billDate <= :dateTo', { dateTo })
      .groupBy('vendor.id')
      .addGroupBy('vendor.name')
      .orderBy('amount', 'DESC')
      .limit(8)
      .getRawMany<{
        id: string;
        name: string;
        documentCount: string;
        amount: string;
      }>();

    return rows.map((row) => ({
      id: row.id,
      name: row.name ?? 'Vendor',
      documentCount: Number(row.documentCount),
      amount: Number(row.amount),
    }));
  }

  private async countSalesEntries(
    dateFrom: string,
    dateTo: string,
  ): Promise<number> {
    return this.salesEntriesRepository
      .createQueryBuilder('entry')
      .where('entry.saleDate >= :dateFrom', { dateFrom })
      .andWhere('entry.saleDate <= :dateTo', { dateTo })
      .getCount();
  }

  private resolveTrendGranularity(
    dateFrom: string,
    dateTo: string,
  ): 'day' | 'week' | 'month' {
    const from = new Date(`${dateFrom}T00:00:00`);
    const to = new Date(`${dateTo}T00:00:00`);
    const days =
      Math.floor((to.getTime() - from.getTime()) / 86_400_000) + 1;

    if (days <= 31) {
      return 'day';
    }

    if (days <= 92) {
      return 'week';
    }

    return 'month';
  }

  private formatTrendLabel(
    period: string,
    granularity: 'day' | 'week' | 'month',
  ): string {
    const date = new Date(`${period}T00:00:00`);

    if (granularity === 'month') {
      return new Intl.DateTimeFormat('en-GB', {
        month: 'short',
        year: '2-digit',
      }).format(date);
    }

    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
    }).format(date);
  }

  private enumeratePeriods(
    dateFrom: string,
    dateTo: string,
    granularity: 'day' | 'week' | 'month',
  ): string[] {
    const periods: string[] = [];
    const end = new Date(`${dateTo}T00:00:00`);
    const cursor = new Date(`${dateFrom}T00:00:00`);

    if (granularity === 'month') {
      cursor.setDate(1);
      while (cursor <= end) {
        periods.push(
          `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}-01`,
        );
        cursor.setMonth(cursor.getMonth() + 1);
      }
      return periods;
    }

    if (granularity === 'week') {
      const day = cursor.getDay();
      const diff = cursor.getDate() - day + (day === 0 ? -6 : 1);
      cursor.setDate(diff);
    }

    while (cursor <= end) {
      periods.push(cursor.toISOString().slice(0, 10));

      if (granularity === 'day') {
        cursor.setDate(cursor.getDate() + 1);
      } else {
        cursor.setDate(cursor.getDate() + 7);
      }
    }

    return periods;
  }

  private normalizePeriodKey(
    value: string | Date,
    granularity: 'day' | 'week' | 'month',
  ): string {
    const date =
      value instanceof Date ? value : new Date(`${String(value).slice(0, 10)}T00:00:00`);

    if (granularity === 'month') {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
    }

    if (granularity === 'week') {
      const day = date.getDay();
      const diff = date.getDate() - day + (day === 0 ? -6 : 1);
      const weekStart = new Date(date);
      weekStart.setDate(diff);
      return weekStart.toISOString().slice(0, 10);
    }

    return date.toISOString().slice(0, 10);
  }

  private async buildRevenueExpenseTrend(
    dateFrom: string,
    dateTo: string,
    basis: ProfitLossBasis,
    granularity: 'day' | 'week' | 'month',
  ): Promise<AccountingTrendPoint[]> {
    const revenueRows =
      basis === 'cash'
        ? await this.groupSalesByPeriod(dateFrom, dateTo, granularity)
        : await this.groupInvoicesByPeriod(dateFrom, dateTo, granularity);

    const operatingExpenseRows = await this.groupExpenseTotalsByPeriod(
      dateFrom,
      dateTo,
      granularity,
    );

    const expenseRowSets =
      basis === 'accrual'
        ? [
            operatingExpenseRows,
            await this.groupBillsByPeriod(dateFrom, dateTo, granularity),
          ]
        : [
            operatingExpenseRows,
            await this.groupPaidPayablesByPeriod(dateFrom, dateTo, granularity),
          ];

    const revenueMap = new Map(
      revenueRows.map((row) => [row.period, Number(row.total)]),
    );
    const expenseMap = this.mergePeriodTotals(...expenseRowSets);

    return this.enumeratePeriods(dateFrom, dateTo, granularity).map(
      (period) => ({
        period,
        label: this.formatTrendLabel(period, granularity),
        revenue: revenueMap.get(period) ?? 0,
        expenses: expenseMap.get(period) ?? 0,
      }),
    );
  }

  private mergePeriodTotals(
    ...rowSets: Array<Array<{ period: string; total: string }>>
  ): Map<string, number> {
    const totals = new Map<string, number>();

    for (const rows of rowSets) {
      for (const row of rows) {
        totals.set(row.period, (totals.get(row.period) ?? 0) + Number(row.total));
      }
    }

    return totals;
  }

  private async buildCashFlowTrend(
    dateFrom: string,
    dateTo: string,
    granularity: 'day' | 'week' | 'month',
  ): Promise<AccountingCashFlowPoint[]> {
    const rows = await this.groupCashByPeriod(dateFrom, dateTo, granularity);
    const inMap = new Map(
      rows.map((row) => [row.period, Number(row.cashIn)]),
    );
    const outMap = new Map(
      rows.map((row) => [row.period, Number(row.cashOut)]),
    );

    return this.enumeratePeriods(dateFrom, dateTo, granularity).map(
      (period) => ({
        period,
        label: this.formatTrendLabel(period, granularity),
        cashIn: inMap.get(period) ?? 0,
        cashOut: outMap.get(period) ?? 0,
      }),
    );
  }

  private async groupInvoicesByPeriod(
    dateFrom: string,
    dateTo: string,
    granularity: 'day' | 'week' | 'month',
  ): Promise<Array<{ period: string; total: string }>> {
    const periodExpr =
      granularity === 'month'
        ? `to_char(DATE(invoice.created_at), 'YYYY-MM-01')`
        : granularity === 'week'
          ? `date_trunc('week', invoice.created_at)::date`
          : `DATE(invoice.created_at)`;

    const rows = await this.invoicesRepository
      .createQueryBuilder('invoice')
      .select(periodExpr, 'bucket')
      .addSelect('COALESCE(SUM(invoice.subtotal), 0)', 'total')
      .where('DATE(invoice.created_at) >= :dateFrom', { dateFrom })
      .andWhere('DATE(invoice.created_at) <= :dateTo', { dateTo })
      .groupBy('bucket')
      .orderBy('bucket', 'ASC')
      .getRawMany<{ bucket: string | Date; total: string }>();

    return rows.map((row) => ({
      period: this.normalizePeriodKey(row.bucket, granularity),
      total: row.total,
    }));
  }

  private async groupSalesByPeriod(
    dateFrom: string,
    dateTo: string,
    granularity: 'day' | 'week' | 'month',
  ): Promise<Array<{ period: string; total: string }>> {
    const periodExpr =
      granularity === 'month'
        ? `to_char(entry.sale_date::date, 'YYYY-MM-01')`
        : granularity === 'week'
          ? `date_trunc('week', entry.sale_date::timestamp)::date`
          : `entry.sale_date`;

    const rows = await this.salesEntriesRepository
      .createQueryBuilder('entry')
      .select(periodExpr, 'bucket')
      .addSelect('COALESCE(SUM(entry.amount), 0)', 'total')
      .where('entry.saleDate >= :dateFrom', { dateFrom })
      .andWhere('entry.saleDate <= :dateTo', { dateTo })
      .groupBy('bucket')
      .orderBy('bucket', 'ASC')
      .getRawMany<{ bucket: string | Date; total: string }>();

    return rows.map((row) => ({
      period: this.normalizePeriodKey(row.bucket, granularity),
      total: row.total,
    }));
  }

  private async groupBillsByPeriod(
    dateFrom: string,
    dateTo: string,
    granularity: 'day' | 'week' | 'month',
  ): Promise<Array<{ period: string; total: string }>> {
    const periodExpr =
      granularity === 'month'
        ? `to_char(bill.bill_date::date, 'YYYY-MM-01')`
        : granularity === 'week'
          ? `date_trunc('week', bill.bill_date::timestamp)::date`
          : `bill.bill_date`;

    const rows = await this.billsRepository
      .createQueryBuilder('bill')
      .select(periodExpr, 'bucket')
      .addSelect('COALESCE(SUM(bill.subtotal), 0)', 'total')
      .where('bill.billDate >= :dateFrom', { dateFrom })
      .andWhere('bill.billDate <= :dateTo', { dateTo })
      .groupBy('bucket')
      .orderBy('bucket', 'ASC')
      .getRawMany<{ bucket: string | Date; total: string }>();

    return rows.map((row) => ({
      period: this.normalizePeriodKey(row.bucket, granularity),
      total: row.total,
    }));
  }

  private async groupPaidPayablesByPeriod(
    dateFrom: string,
    dateTo: string,
    granularity: 'day' | 'week' | 'month',
  ): Promise<Array<{ period: string; total: string }>> {
    const periodExpr =
      granularity === 'month'
        ? `to_char(payable.paid_at::date, 'YYYY-MM-01')`
        : granularity === 'week'
          ? `date_trunc('week', payable.paid_at::timestamp)::date`
          : `DATE(payable.paid_at)`;

    const rows = await this.payablesRepository
      .createQueryBuilder('payable')
      .select(periodExpr, 'bucket')
      .addSelect('COALESCE(SUM(payable.amount), 0)', 'total')
      .where('payable.status = :status', { status: PayableStatus.PAID })
      .andWhere('DATE(payable.paid_at) >= :dateFrom', { dateFrom })
      .andWhere('DATE(payable.paid_at) <= :dateTo', { dateTo })
      .groupBy('bucket')
      .orderBy('bucket', 'ASC')
      .getRawMany<{ bucket: string | Date; total: string }>();

    return rows.map((row) => ({
      period: this.normalizePeriodKey(row.bucket, granularity),
      total: row.total,
    }));
  }

  private async groupExpenseTotalsByPeriod(
    dateFrom: string,
    dateTo: string,
    granularity: 'day' | 'week' | 'month',
  ): Promise<Array<{ period: string; total: string }>> {
    const periodExpr =
      granularity === 'month'
        ? `to_char(expense.expense_date::date, 'YYYY-MM-01')`
        : granularity === 'week'
          ? `date_trunc('week', expense.expense_date::timestamp)::date`
          : `expense.expense_date`;

    const rows = await this.expensesRepository
      .createQueryBuilder('expense')
      .select(periodExpr, 'bucket')
      .addSelect('COALESCE(SUM(expense.subtotal), 0)', 'total')
      .where('expense.expenseDate >= :dateFrom', { dateFrom })
      .andWhere('expense.expenseDate <= :dateTo', { dateTo })
      .groupBy('bucket')
      .orderBy('bucket', 'ASC')
      .getRawMany<{ bucket: string | Date; total: string }>();

    return rows.map((row) => ({
      period: this.normalizePeriodKey(row.bucket, granularity),
      total: row.total,
    }));
  }

  private async groupCashByPeriod(
    dateFrom: string,
    dateTo: string,
    granularity: 'day' | 'week' | 'month',
  ): Promise<Array<{ period: string; cashIn: string; cashOut: string }>> {
    const periodExpr =
      granularity === 'month'
        ? `to_char(entry.entry_date::date, 'YYYY-MM-01')`
        : granularity === 'week'
          ? `date_trunc('week', entry.entry_date::timestamp)::date`
          : `entry.entry_date`;

    const rows = await this.cashEntriesRepository
      .createQueryBuilder('entry')
      .select(periodExpr, 'bucket')
      .addSelect('COALESCE(SUM(entry.cash_in), 0)', 'cashIn')
      .addSelect('COALESCE(SUM(entry.cash_out), 0)', 'cashOut')
      .where('entry.entryDate >= :dateFrom', { dateFrom })
      .andWhere('entry.entryDate <= :dateTo', { dateTo })
      .andWhere('entry.type IN (:...types)', {
        types: [CashEntryType.MANUAL, CashEntryType.OPENING_ADJUSTMENT],
      })
      .groupBy('bucket')
      .orderBy('bucket', 'ASC')
      .getRawMany<{ bucket: string | Date; cashIn: string; cashOut: string }>();

    return rows.map((row) => ({
      period: this.normalizePeriodKey(row.bucket, granularity),
      cashIn: row.cashIn,
      cashOut: row.cashOut,
    }));
  }

  private async sumCashMovements(
    dateFrom: string,
    dateTo: string,
  ): Promise<{ cashIn: number; cashOut: number }> {
    const result: { cashIn: string | null; cashOut: string | null } | undefined =
      await this.cashEntriesRepository
        .createQueryBuilder('entry')
        .select('COALESCE(SUM(entry.cash_in), 0)', 'cashIn')
        .addSelect('COALESCE(SUM(entry.cash_out), 0)', 'cashOut')
        .where('entry.entryDate >= :dateFrom', { dateFrom })
        .andWhere('entry.entryDate <= :dateTo', { dateTo })
        .andWhere('entry.type IN (:...types)', {
          types: [CashEntryType.MANUAL, CashEntryType.OPENING_ADJUSTMENT],
        })
        .getRawOne();

    return {
      cashIn: Number(result?.cashIn ?? 0),
      cashOut: Number(result?.cashOut ?? 0),
    };
  }

  private async getReceivablesStatus(): Promise<AccountingStatusBreakdown> {
    const rows = await this.receivablesRepository
      .createQueryBuilder('receivable')
      .select('receivable.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(receivable.amount), 0)', 'amount')
      .groupBy('receivable.status')
      .getRawMany<{ status: string; count: string; amount: string }>();

    return this.mapStatusBreakdown(rows);
  }

  private async getPayablesStatus(): Promise<AccountingStatusBreakdown> {
    const rows = await this.payablesRepository
      .createQueryBuilder('payable')
      .select('payable.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .addSelect('COALESCE(SUM(payable.amount), 0)', 'amount')
      .groupBy('payable.status')
      .getRawMany<{ status: string; count: string; amount: string }>();

    return this.mapStatusBreakdown(rows);
  }

  private mapStatusBreakdown(
    rows: Array<{ status: string; count: string; amount: string }>,
  ): AccountingStatusBreakdown {
    const paidRow = rows.find((row) => row.status === 'paid');
    const unpaidRow = rows.find((row) => row.status === 'unpaid');

    return {
      paidCount: Number(paidRow?.count ?? 0),
      unpaidCount: Number(unpaidRow?.count ?? 0),
      paidAmount: Number(paidRow?.amount ?? 0),
      unpaidAmount: Number(unpaidRow?.amount ?? 0),
    };
  }

  private async countInvoices(
    dateFrom: string,
    dateTo: string,
  ): Promise<number> {
    return this.invoicesRepository
      .createQueryBuilder('invoice')
      .where('DATE(invoice.created_at) >= :dateFrom', { dateFrom })
      .andWhere('DATE(invoice.created_at) <= :dateTo', { dateTo })
      .getCount();
  }

  private async countBills(dateFrom: string, dateTo: string): Promise<number> {
    return this.billsRepository
      .createQueryBuilder('bill')
      .where('bill.billDate >= :dateFrom', { dateFrom })
      .andWhere('bill.billDate <= :dateTo', { dateTo })
      .getCount();
  }

  private async countExpenses(
    dateFrom: string,
    dateTo: string,
  ): Promise<number> {
    return this.expensesRepository
      .createQueryBuilder('expense')
      .where('expense.expenseDate >= :dateFrom', { dateFrom })
      .andWhere('expense.expenseDate <= :dateTo', { dateTo })
      .getCount();
  }

  private getCurrentMonthRange(reference = new Date()): {
    dateFrom: string;
    dateTo: string;
    label: string;
  } {
    const year = reference.getFullYear();
    const month = reference.getMonth();
    const dateFrom = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const dateTo = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const label = reference.toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    return { dateFrom, dateTo, label };
  }

  private async getCashBookBalance(asOfDate: string): Promise<number> {
    const result: { balance: string | null } | undefined =
      await this.cashEntriesRepository
        .createQueryBuilder('entry')
        .select(
          `COALESCE(SUM(entry.cash_in), 0) - COALESCE(SUM(entry.cash_out), 0)`,
          'balance',
        )
        .where('entry.entryDate <= :asOfDate', { asOfDate })
        .andWhere('entry.type IN (:...types)', {
          types: [CashEntryType.MANUAL, CashEntryType.OPENING_ADJUSTMENT],
        })
        .getRawOne();

    return Number(result?.balance ?? 0);
  }

  private async getBankBookBalance(asOfDate: string): Promise<number> {
    const result: { balance: string | null } | undefined =
      await this.bankEntriesRepository
        .createQueryBuilder('entry')
        .select(
          `COALESCE(SUM(entry.bank_in), 0) - COALESCE(SUM(entry.bank_out), 0)`,
          'balance',
        )
        .where('entry.entryDate <= :asOfDate', { asOfDate })
        .getRawOne();

    return Number(result?.balance ?? 0);
  }

  private async sumOutstandingReceivables(asOfDate: string): Promise<number> {
    const result: { total: string | null } | undefined =
      await this.receivablesRepository
        .createQueryBuilder('receivable')
        .select('COALESCE(SUM(receivable.amount), 0)', 'total')
        .where('receivable.status = :status', {
          status: ReceivableStatus.UNPAID,
        })
        .andWhere('DATE(receivable.created_at) <= :asOfDate', { asOfDate })
        .getRawOne();

    return Number(result?.total ?? 0);
  }

  private async sumOutstandingPayables(asOfDate: string): Promise<number> {
    const result: { total: string | null } | undefined =
      await this.payablesRepository
        .createQueryBuilder('payable')
        .select('COALESCE(SUM(payable.amount), 0)', 'total')
        .where('payable.status = :status', { status: PayableStatus.UNPAID })
        .andWhere('DATE(payable.created_at) <= :asOfDate', { asOfDate })
        .getRawOne();

    return Number(result?.total ?? 0);
  }

  private async getCumulativeNetVat(asOfDate: string): Promise<number> {
    const [outputVat, inputVat] = await Promise.all([
      this.sumInvoiceVatUpTo(asOfDate),
      this.sumInputVatUpTo(asOfDate),
    ]);

    return outputVat - inputVat;
  }

  private async sumInvoiceVatUpTo(asOfDate: string): Promise<number> {
    const result: { total: string | null } | undefined =
      await this.invoicesRepository
        .createQueryBuilder('invoice')
        .select('COALESCE(SUM(invoice.vat_total), 0)', 'total')
        .where('DATE(invoice.created_at) <= :asOfDate', { asOfDate })
        .getRawOne();

    return Number(result?.total ?? 0);
  }

  private async sumInputVatUpTo(asOfDate: string): Promise<number> {
    const [billVat, expenseVat] = await Promise.all([
      this.billsRepository
        .createQueryBuilder('bill')
        .select('COALESCE(SUM(bill.vat_total), 0)', 'total')
        .where('bill.billDate <= :asOfDate', { asOfDate })
        .getRawOne<{ total: string | null }>(),
      this.expensesRepository
        .createQueryBuilder('expense')
        .select('COALESCE(SUM(expense.vat_amount), 0)', 'total')
        .where('expense.expenseDate <= :asOfDate', { asOfDate })
        .andWhere('expense.include_vat = true')
        .getRawOne<{ total: string | null }>(),
    ]);

    return Number(billVat?.total ?? 0) + Number(expenseVat?.total ?? 0);
  }

  private async getAccrualNetProfit(
    dateFrom: string,
    dateTo: string,
  ): Promise<number> {
    const report = await this.buildAccrualReport(dateFrom, dateTo);
    return report.netProfit;
  }

  private formatIsoDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private buildMainDashboardActivity(
    jobCards: JobCard[],
    invoices: Invoice[],
  ): MainDashboardActivity[] {
    const jobCardActivity: MainDashboardActivity[] = jobCards.map(
      (jobCard) => ({
        id: jobCard.id,
        type: 'job_card',
        title: jobCard.jobCardNumber ?? 'Job card',
        subtitle: jobCard.customer?.name ?? 'Customer',
        amount: null,
        occurredAt: jobCard.createdAt.toISOString(),
      }),
    );

    const invoiceActivity: MainDashboardActivity[] = invoices.map((invoice) => ({
      id: invoice.id,
      type: 'invoice',
      title: invoice.invoiceNumber,
      subtitle: 'Invoice issued',
      amount: invoice.grandTotal,
      occurredAt: invoice.createdAt.toISOString(),
    }));

    return [...jobCardActivity, ...invoiceActivity]
      .sort(
        (left, right) =>
          new Date(right.occurredAt).getTime() -
          new Date(left.occurredAt).getTime(),
      )
      .slice(0, 8);
  }
}

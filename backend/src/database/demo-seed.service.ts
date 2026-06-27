import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { Bill } from '../bills/entities/bill.entity';
import { BillItem } from '../bills/entities/bill-item.entity';
import {
  CashEntry,
  CashEntryDirection,
  CashEntryType,
} from '../cash/entities/cash-entry.entity';
import { Customer } from '../customers/entities/customer.entity';
import {
  formatEmssNumber,
  getCurrentEmssYear,
} from '../common/utils/emss-number.util';
import { calculateLinePricing } from '../common/utils/pricing.util';
import { ExpenseCategory } from '../expenses/entities/expense-category.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { InvoiceItem } from '../invoices/entities/invoice-item.entity';
import { JobCard } from '../job-cards/entities/job-card.entity';
import { JobCardProduct } from '../job-cards/entities/job-card-product.entity';
import {
  Payable,
  PayableStatus,
} from '../payables/entities/payable.entity';
import { Product } from '../products/entities/product.entity';
import { ReceiptVoucher } from '../receipt-vouchers/entities/receipt-voucher.entity';
import { PaymentMethod } from '../receivables/entities/payment-method.entity';
import {
  Receivable,
  ReceivableStatus,
} from '../receivables/entities/receivable.entity';
import { SalesEntry } from '../sales/entities/sales-entry.entity';
import { User } from '../users/entities/user.entity';
import { Vendor } from '../vendors/entities/vendor.entity';

const DEFAULT_PAYMENT_METHODS = ['Cash', 'Online', 'Cheque'] as const;

const DEFAULT_CATEGORIES = [
  'Fuel / Mileage',
  'Meals & Entertainment',
  'Office Supplies',
  'Repairs & Maintenance',
  'Rent',
  'Utilities',
  'Advertising',
  'Miscellaneous',
] as const;

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatDate(d);
}

function daysFromNow(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return formatDate(d);
}

function timestampForDate(dateStr: string): Date {
  return new Date(`${dateStr}T12:00:00.000Z`);
}

interface LineInput {
  quantity: number;
  unitPrice: number;
  includeVat: boolean;
}

function sumLines(lines: LineInput[]) {
  let subtotal = 0;
  let vatTotal = 0;
  let grandTotal = 0;

  for (const line of lines) {
    const pricing = calculateLinePricing(
      line.quantity,
      line.unitPrice,
      line.includeVat,
    );
    subtotal += pricing.subtotal;
    vatTotal += pricing.vatAmount;
    grandTotal += pricing.lineTotal;
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    vatTotal: Math.round(vatTotal * 100) / 100,
    grandTotal: Math.round(grandTotal * 100) / 100,
  };
}

@Injectable()
export class DemoSeedService {
  private readonly logger = new Logger(DemoSeedService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async run(): Promise<void> {
    this.logger.log('Clearing business data…');
    await this.clearBusinessData();

    const admin = await this.dataSource.getRepository(User).findOne({
      where: { username: 'admin' },
    });
    if (!admin) {
      throw new Error('Admin user not found. Start the app once to create it.');
    }

    const paymentMethods = await this.ensurePaymentMethods();
    const categories = await this.ensureCategories();
    const cashMethod = paymentMethods.get('Cash')!;
    const onlineMethod = paymentMethods.get('Online')!;

    const customers = await this.seedCustomers();
    const vendors = await this.seedVendors();
    const products = await this.seedProducts();

    await this.seedOpeningBalance(admin.id, daysAgo(45));

    await this.seedSalesFlow({
      adminId: admin.id,
      customers,
      products,
      cashMethod,
      onlineMethod,
    });

    await this.seedBillsFlow({
      adminId: admin.id,
      vendors,
      cashMethod,
      onlineMethod,
    });

    await this.seedExpenses({
      adminId: admin.id,
      categories,
      vendors,
      cashMethod,
      onlineMethod,
    });

    this.logger.log('Demo data seeded successfully.');
    this.logger.log('Login: admin / admin123');
  }

  private repo<T extends ObjectLiteral>(entity: EntityTarget<T>): Repository<T> {
    return this.dataSource.getRepository(entity);
  }

  private async clearBusinessData(): Promise<void> {
    await this.dataSource.query(`
      TRUNCATE TABLE
        sales_entries,
        cash_entries,
        expenses,
        payables,
        bill_items,
        bills,
        receipt_vouchers,
        receivables,
        invoice_items,
        invoices,
        job_card_products,
        job_cards,
        products,
        vendors,
        customers,
        expense_categories,
        payment_methods
      RESTART IDENTITY CASCADE
    `);
  }

  private async ensurePaymentMethods(): Promise<Map<string, PaymentMethod>> {
    const repo = this.repo(PaymentMethod);
    const map = new Map<string, PaymentMethod>();

    for (const name of DEFAULT_PAYMENT_METHODS) {
      const method = await repo.save(repo.create({ name }));
      map.set(name, method);
    }

    return map;
  }

  private async ensureCategories(): Promise<Map<string, ExpenseCategory>> {
    const repo = this.repo(ExpenseCategory);
    const map = new Map<string, ExpenseCategory>();

    for (const name of DEFAULT_CATEGORIES) {
      const category = await repo.save(repo.create({ name }));
      map.set(name, category);
    }

    return map;
  }

  private async seedCustomers(): Promise<Customer[]> {
    const repo = this.repo(Customer);
    const rows = [
      {
        name: 'Marina Yard LLC',
        email: 'accounts@marinayard.ae',
        phoneNumber: '+971 4 123 4567',
        country: 'UAE',
        trnNumber: '100123456700003',
        address: 'Jebel Ali Free Zone, Dubai',
      },
      {
        name: 'Falcon Trading FZE',
        email: 'finance@falcontrading.ae',
        phoneNumber: '+971 4 234 5678',
        country: 'UAE',
        trnNumber: '100234567800003',
        address: 'Sharjah Industrial Area 10',
      },
      {
        name: 'Gulf Supplies Co.',
        email: 'billing@gulfsupplies.ae',
        phoneNumber: '+971 4 345 6789',
        country: 'UAE',
        trnNumber: '100345678900003',
        address: 'Al Quoz, Dubai',
      },
      {
        name: 'Al Noor Construction',
        email: 'ap@alnoor.ae',
        phoneNumber: '+971 4 456 7890',
        country: 'UAE',
        trnNumber: '100456789000003',
        address: 'Abu Dhabi Mussafah',
      },
      {
        name: 'Blue Horizon Logistics',
        email: 'ops@bluehorizon.ae',
        phoneNumber: '+971 4 567 8901',
        country: 'UAE',
        trnNumber: '100567890100003',
        address: 'Dubai Logistics City',
      },
    ];

    return repo.save(rows.map((row) => repo.create(row)));
  }

  private async seedVendors(): Promise<Vendor[]> {
    const repo = this.repo(Vendor);
    const rows = [
      {
        name: 'Steel Works LLC',
        email: 'sales@steelworks.ae',
        phoneNumber: '+971 4 111 2222',
        country: 'UAE',
        address: 'Ras Al Khor Industrial, Dubai',
      },
      {
        name: 'Paint Depot',
        email: 'orders@paintdepot.ae',
        phoneNumber: '+971 4 222 3333',
        country: 'UAE',
        address: 'Al Qusais, Dubai',
      },
      {
        name: 'Freight Co Gulf',
        email: 'billing@freightco.ae',
        phoneNumber: '+971 4 333 4444',
        country: 'UAE',
        address: 'JAFZA, Dubai',
      },
      {
        name: 'Office Mart',
        email: 'accounts@officemart.ae',
        phoneNumber: '+971 4 444 5555',
        country: 'UAE',
        address: 'Deira, Dubai',
      },
    ];

    return repo.save(rows.map((row) => repo.create(row)));
  }

  private async seedProducts(): Promise<Product[]> {
    const repo = this.repo(Product);
    const names = [
      'Steel Pipes (6")',
      'Safety Helmets',
      'Welding Rods',
      'Industrial Paint 20L',
      'Copper Wire Roll',
      'Scaffold Planks',
    ];

    return repo.save(names.map((name) => repo.create({ name })));
  }

  private async seedOpeningBalance(
    adminId: string,
    entryDate: string,
  ): Promise<void> {
    await this.repo(CashEntry).save(
      this.repo(CashEntry).create({
        entryDate,
        type: CashEntryType.OPENING_ADJUSTMENT,
        direction: CashEntryDirection.IN,
        amount: 25000,
        description: 'Opening cash balance',
        createdById: adminId,
      }),
    );
  }

  private async seedSalesFlow(params: {
    adminId: string;
    customers: Customer[];
    products: Product[];
    cashMethod: PaymentMethod;
    onlineMethod: PaymentMethod;
  }): Promise<void> {
    const year = getCurrentEmssYear();
    const scenarios = [
      {
        customer: params.customers[0],
        jobCardNumber: `JC/${1001}/${year}`,
        invoiceSeq: 1001,
        invoiceDate: daysAgo(18),
        dueDate: daysAgo(4),
        paid: true,
        paymentMethod: params.cashMethod,
        lines: [
          { product: params.products[0], qty: 10, price: 450, vat: true },
          { product: params.products[1], qty: 20, price: 35, vat: true },
        ],
      },
      {
        customer: params.customers[1],
        jobCardNumber: `JC/${1002}/${year}`,
        invoiceSeq: 1002,
        invoiceDate: daysAgo(10),
        dueDate: daysAgo(0),
        paid: true,
        paymentMethod: params.onlineMethod,
        transactionReference: 'TRF-2026-88421',
        lines: [
          { product: params.products[2], qty: 50, price: 12, vat: true },
          { product: params.products[3], qty: 8, price: 280, vat: true },
        ],
      },
      {
        customer: params.customers[2],
        jobCardNumber: `JC/${1003}/${year}`,
        invoiceSeq: 1003,
        invoiceDate: daysAgo(6),
        dueDate: daysFromNow(14),
        paid: false,
        lines: [
          { product: params.products[4], qty: 15, price: 95, vat: true },
        ],
      },
      {
        customer: params.customers[3],
        jobCardNumber: `JC/${1004}/${year}`,
        invoiceSeq: 1004,
        invoiceDate: daysAgo(2),
        dueDate: daysFromNow(28),
        paid: false,
        lines: [
          { product: params.products[5], qty: 30, price: 65, vat: true },
          { product: params.products[0], qty: 5, price: 450, vat: true },
        ],
      },
    ];

    let voucherSeq = 2001;

    for (const scenario of scenarios) {
      const lineInputs: LineInput[] = scenario.lines.map((l) => ({
        quantity: l.qty,
        unitPrice: l.price,
        includeVat: l.vat,
      }));
      const totals = sumLines(lineInputs);

      const jobCard = await this.repo(JobCard).save(
        this.repo(JobCard).create({
          jobCardNumber: scenario.jobCardNumber,
          customerId: scenario.customer.id,
          description: `Supply order for ${scenario.customer.name}`,
          isOpen: false,
          transport: true,
          createdById: params.adminId,
        }),
      );

      for (const line of scenario.lines) {
        const pricing = calculateLinePricing(
          line.qty,
          line.price,
          line.vat,
        );
        await this.repo(JobCardProduct).save(
          this.repo(JobCardProduct).create({
            jobCardId: jobCard.id,
            productId: line.product.id,
            quantity: line.qty,
            unitPrice: line.price,
            includeVat: line.vat,
            vatPercent: 5,
            subtotal: pricing.subtotal,
            vatAmount: pricing.vatAmount,
            lineTotal: pricing.lineTotal,
          }),
        );
      }

      const invoiceNumber = formatEmssNumber(scenario.invoiceSeq, year);
      const invoice = await this.repo(Invoice).save(
        this.repo(Invoice).create({
          invoiceNumber,
          jobCardId: jobCard.id,
          subtotal: totals.subtotal,
          vatTotal: totals.vatTotal,
          grandTotal: totals.grandTotal,
          dueDate: scenario.dueDate,
          createdById: params.adminId,
        }),
      );

      await this.dataSource.query(
        `UPDATE invoices SET created_at = $1, updated_at = $1 WHERE id = $2`,
        [timestampForDate(scenario.invoiceDate), invoice.id],
      );

      for (const line of scenario.lines) {
        const pricing = calculateLinePricing(
          line.qty,
          line.price,
          line.vat,
        );
        await this.repo(InvoiceItem).save(
          this.repo(InvoiceItem).create({
            invoiceId: invoice.id,
            productId: line.product.id,
            productName: line.product.name,
            quantity: line.qty,
            unitPrice: line.price,
            includeVat: line.vat,
            vatPercent: 5,
            subtotal: pricing.subtotal,
            vatAmount: pricing.vatAmount,
            lineTotal: pricing.lineTotal,
          }),
        );
      }

      const receivable = await this.repo(Receivable).save(
        this.repo(Receivable).create({
          customerId: scenario.customer.id,
          invoiceId: invoice.id,
          amount: totals.grandTotal,
          dueDate: scenario.dueDate,
          status: scenario.paid
            ? ReceivableStatus.PAID
            : ReceivableStatus.UNPAID,
          paymentMethodId: scenario.paid ? scenario.paymentMethod!.id : null,
          transactionReference: scenario.transactionReference ?? null,
          paidAt: scenario.paid
            ? timestampForDate(scenario.invoiceDate)
            : null,
          createdById: params.adminId,
        }),
      );

      if (scenario.paid && scenario.paymentMethod) {
        const voucherNumber = formatEmssNumber(voucherSeq++, year).replace(
          'EMSS/',
          'RV/',
        );

        const voucherInsert = await this.dataSource.query(
          `INSERT INTO receipt_vouchers (
            voucher_number,
            receivable_id,
            customer_id,
            invoice_id,
            amount,
            payment_method_id,
            transaction_reference,
            created_by_id
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          RETURNING id`,
          [
            voucherNumber,
            receivable.id,
            scenario.customer.id,
            invoice.id,
            totals.grandTotal,
            scenario.paymentMethod.id,
            scenario.transactionReference ?? null,
            params.adminId,
          ],
        );

        const voucher = await this.repo(ReceiptVoucher).findOneOrFail({
          where: { id: Number(voucherInsert[0].id) },
        });

        await this.dataSource.query(
          `UPDATE receipt_vouchers SET created_at = $1, updated_at = $1 WHERE id = $2`,
          [timestampForDate(scenario.invoiceDate), voucher.id],
        );

        const salesEntry = await this.repo(SalesEntry).save(
          this.repo(SalesEntry).create({
            saleDate: scenario.invoiceDate,
            receiptVoucherId: voucher.id,
            receivableId: receivable.id,
            customerId: scenario.customer.id,
            invoiceId: invoice.id,
            paymentMethodId: scenario.paymentMethod.id,
            amount: totals.grandTotal,
            description: `Receipt ${voucherNumber} — ${scenario.customer.name}`,
            createdById: params.adminId,
          }),
        );

        await this.dataSource.query(
          `UPDATE sales_entries SET created_at = $1, updated_at = $1 WHERE id = $2`,
          [timestampForDate(scenario.invoiceDate), salesEntry.id],
        );
      }
    }
  }

  private async seedBillsFlow(params: {
    adminId: string;
    vendors: Vendor[];
    cashMethod: PaymentMethod;
    onlineMethod: PaymentMethod;
  }): Promise<void> {
    const year = getCurrentEmssYear();
    const scenarios = [
      {
        vendor: params.vendors[0],
        billSeq: 3001,
        billDate: daysAgo(22),
        dueDate: daysAgo(8),
        paid: true,
        paymentMethod: params.cashMethod,
        reference: 'SW-INV-8841',
        lines: [
          { desc: 'Steel pipes bulk order', qty: 20, price: 420, vat: true },
        ],
      },
      {
        vendor: params.vendors[1],
        billSeq: 3002,
        billDate: daysAgo(14),
        dueDate: daysAgo(0),
        paid: true,
        paymentMethod: params.onlineMethod,
        reference: 'PD-2026-119',
        transactionReference: 'TRF-2026-55201',
        lines: [
          { desc: 'Industrial paint drums', qty: 12, price: 260, vat: true },
          { desc: 'Primer 20L', qty: 6, price: 180, vat: true },
        ],
      },
      {
        vendor: params.vendors[2],
        billSeq: 3003,
        billDate: daysAgo(9),
        dueDate: daysFromNow(21),
        paid: false,
        reference: 'FCG-FRT-441',
        lines: [
          { desc: 'Container freight Jebel Ali', qty: 1, price: 3500, vat: true },
        ],
      },
      {
        vendor: params.vendors[3],
        billSeq: 3004,
        billDate: daysAgo(4),
        dueDate: daysFromNow(26),
        paid: false,
        reference: 'OM-8844',
        lines: [
          { desc: 'Office stationery pack', qty: 1, price: 850, vat: false },
          { desc: 'Printer toner cartridges', qty: 4, price: 120, vat: true },
        ],
      },
    ];

    for (const scenario of scenarios) {
      const lineInputs: LineInput[] = scenario.lines.map((l) => ({
        quantity: l.qty,
        unitPrice: l.price,
        includeVat: l.vat,
      }));
      const totals = sumLines(lineInputs);
      const billNumber = formatEmssNumber(scenario.billSeq, year).replace(
        'EMSS/',
        'BILL/',
      );

      const bill = await this.repo(Bill).save(
        this.repo(Bill).create({
          billNumber,
          vendorId: scenario.vendor.id,
          vendorReference: scenario.reference,
          billDate: scenario.billDate,
          dueDate: scenario.dueDate,
          subtotal: totals.subtotal,
          vatTotal: totals.vatTotal,
          grandTotal: totals.grandTotal,
          notes: `Vendor bill from ${scenario.vendor.name}`,
          createdById: params.adminId,
        }),
      );

      await this.dataSource.query(
        `UPDATE bills SET created_at = $1, updated_at = $1 WHERE id = $2`,
        [timestampForDate(scenario.billDate), bill.id],
      );

      for (const line of scenario.lines) {
        const pricing = calculateLinePricing(
          line.qty,
          line.price,
          line.vat,
        );
        await this.repo(BillItem).save(
          this.repo(BillItem).create({
            billId: bill.id,
            description: line.desc,
            quantity: line.qty,
            unitPrice: line.price,
            includeVat: line.vat,
            vatPercent: 5,
            subtotal: pricing.subtotal,
            vatAmount: pricing.vatAmount,
            lineTotal: pricing.lineTotal,
          }),
        );
      }

      const payable = await this.repo(Payable).save(
        this.repo(Payable).create({
          vendorId: scenario.vendor.id,
          billId: bill.id,
          amount: totals.grandTotal,
          dueDate: scenario.dueDate,
          status: scenario.paid ? PayableStatus.PAID : PayableStatus.UNPAID,
          paymentMethodId: scenario.paid ? scenario.paymentMethod!.id : null,
          transactionReference: scenario.transactionReference ?? null,
          paidAt: scenario.paid
            ? timestampForDate(scenario.billDate)
            : null,
          createdById: params.adminId,
        }),
      );

      if (scenario.paid && scenario.paymentMethod?.name === 'Cash') {
        await this.repo(CashEntry).save(
          this.repo(CashEntry).create({
            entryDate: scenario.billDate,
            type: CashEntryType.VENDOR_PAYMENT,
            direction: CashEntryDirection.OUT,
            amount: totals.grandTotal,
            description: `Payment to ${scenario.vendor.name} — ${billNumber}`,
            payableId: payable.id,
            createdById: params.adminId,
          }),
        );
      }
    }
  }

  private async seedExpenses(params: {
    adminId: string;
    categories: Map<string, ExpenseCategory>;
    vendors: Vendor[];
    cashMethod: PaymentMethod;
    onlineMethod: PaymentMethod;
  }): Promise<void> {
    const scenarios = [
      {
        date: daysAgo(0),
        description: 'Stationery and printer paper',
        category: 'Office Supplies',
        vendor: params.vendors[3],
        paymentMethod: params.cashMethod,
        amount: 150,
        includeVat: false,
        cash: true,
      },
      {
        date: daysAgo(0),
        description: 'Diesel for delivery van',
        category: 'Fuel / Mileage',
        vendor: null,
        paymentMethod: params.onlineMethod,
        subtotal: 500,
        includeVat: true,
        cash: false,
      },
      {
        date: daysAgo(3),
        description: 'Workshop equipment repair',
        category: 'Repairs & Maintenance',
        vendor: params.vendors[0],
        paymentMethod: params.cashMethod,
        subtotal: 800,
        includeVat: true,
        cash: true,
      },
      {
        date: daysAgo(8),
        description: 'Client lunch meeting',
        category: 'Meals & Entertainment',
        vendor: null,
        paymentMethod: params.onlineMethod,
        amount: 320,
        includeVat: false,
        cash: false,
      },
      {
        date: daysAgo(15),
        description: 'Google Ads campaign',
        category: 'Advertising',
        vendor: null,
        paymentMethod: params.onlineMethod,
        subtotal: 1000,
        includeVat: true,
        cash: false,
      },
      {
        date: daysAgo(35),
        description: 'Warehouse rent — previous month',
        category: 'Rent',
        vendor: null,
        paymentMethod: params.onlineMethod,
        subtotal: 4500,
        includeVat: true,
        cash: false,
      },
    ];

    for (const scenario of scenarios) {
      let subtotal: number;
      let vatAmount: number;
      let amount: number;

      if (scenario.includeVat && scenario.subtotal != null) {
        const pricing = calculateLinePricing(
          1,
          scenario.subtotal,
          true,
        );
        subtotal = pricing.subtotal;
        vatAmount = pricing.vatAmount;
        amount = pricing.lineTotal;
      } else {
        amount = scenario.amount!;
        subtotal = amount;
        vatAmount = 0;
      }

      const expense = await this.repo(Expense).save(
        this.repo(Expense).create({
          expenseDate: scenario.date,
          amount,
          subtotal,
          vatAmount,
          includeVat: scenario.includeVat,
          vatPercent: 5,
          description: scenario.description,
          categoryId: params.categories.get(scenario.category)!.id,
          paymentMethodId: scenario.paymentMethod.id,
          vendorId: scenario.vendor?.id ?? null,
          createdById: params.adminId,
        }),
      );

      await this.dataSource.query(
        `UPDATE expenses SET created_at = $1, updated_at = $1 WHERE id = $2`,
        [timestampForDate(scenario.date), expense.id],
      );

      if (scenario.cash) {
        await this.repo(CashEntry).save(
          this.repo(CashEntry).create({
            entryDate: scenario.date,
            type: CashEntryType.EXPENSE,
            direction: CashEntryDirection.OUT,
            amount,
            description: scenario.description,
            expenseId: expense.id,
            createdById: params.adminId,
          }),
        );
      }
    }
  }
}

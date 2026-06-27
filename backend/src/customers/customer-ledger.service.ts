import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Receivable, ReceivableStatus } from '../receivables/entities/receivable.entity';
import { QueryCustomerLedgerDto } from './dto/query-customer-ledger.dto';
import { QueryCustomerLedgerSummaryDto } from './dto/query-customer-ledger-summary.dto';
import { Customer } from './entities/customer.entity';
import {
  CustomerLedger,
  CustomerLedgerEntry,
  CustomerLedgerEntryType,
  CustomerLedgerListItem,
  CustomerLedgerListResult,
  CustomerLedgerSummary,
} from './interfaces/customer-ledger.interface';
import { CustomersService } from './customers.service';

interface LedgerLineDraft {
  sortTimestamp: number;
  sortKey: string;
  date: string;
  type: CustomerLedgerEntryType;
  reference: string;
  description: string;
  debit: number | null;
  credit: number | null;
  status: 'paid' | 'unpaid';
  receivableId: number | null;
  invoiceId: string | null;
  receiptVoucherId: number | null;
  dueDate: string | null;
}

@Injectable()
export class CustomerLedgerService {
  constructor(
    private readonly customersService: CustomersService,
    @InjectRepository(Receivable)
    private readonly receivablesRepository: Repository<Receivable>,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
  ) {}

  async getLedger(
    customerId: string,
    query: QueryCustomerLedgerDto,
  ): Promise<CustomerLedger> {
    const customer = await this.customersService.findOne(customerId);
    const receivables = await this.receivablesRepository
      .createQueryBuilder('receivable')
      .leftJoinAndSelect('receivable.invoice', 'invoice')
      .leftJoinAndSelect('receivable.receiptVoucher', 'receiptVoucher')
      .where('receivable.customerId = :customerId', { customerId })
      .orderBy('receivable.createdAt', 'ASC')
      .addOrderBy('receivable.id', 'ASC')
      .getMany();

    const drafts = this.buildLedgerDrafts(receivables);
    const allEntries = this.toLedgerEntries(drafts);
    const globalSummary = this.buildSummary(receivables);
    const filteredEntries = this.filterEntries(allEntries, query);
    const openingBalance = this.computeOpeningBalance(allEntries, query.dateFrom);
    const entriesWithBalance = this.applyRunningBalance(
      filteredEntries,
      openingBalance,
    );
    const periodCharges = entriesWithBalance.reduce(
      (sum, entry) => sum + (entry.debit ?? 0),
      0,
    );
    const periodPayments = entriesWithBalance.reduce(
      (sum, entry) => sum + (entry.credit ?? 0),
      0,
    );

    return {
      customer,
      summary: {
        ...globalSummary,
        openingBalance: query.dateFrom ? openingBalance : 0,
        totalCharges: query.dateFrom || query.dateTo ? periodCharges : globalSummary.totalCharges,
        totalPayments: query.dateFrom || query.dateTo ? periodPayments : globalSummary.totalPayments,
      },
      entries: entriesWithBalance,
    };
  }

  async getLedgerSummary(
    query: QueryCustomerLedgerSummaryDto,
  ): Promise<CustomerLedgerListResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const status = query.status ?? 'all';

    const qb = this.customersRepository
      .createQueryBuilder('customer')
      .leftJoin(
        'receivables',
        'receivable',
        'receivable.customer_id = customer.id',
      )
      .select('customer.id', 'customerId')
      .addSelect('customer.name', 'customerName')
      .addSelect('customer.email', 'email')
      .addSelect('customer.is_active', 'isActive')
      .addSelect(
        `COALESCE(SUM(CASE WHEN receivable.status = :unpaid THEN receivable.amount ELSE 0 END), 0)`,
        'outstanding',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN receivable.status = :paid THEN receivable.amount ELSE 0 END), 0)`,
        'totalPaid',
      )
      .addSelect(
        `COALESCE(SUM(CASE WHEN receivable.status = :unpaid THEN 1 ELSE 0 END), 0)`,
        'unpaidCount',
      )
      .addSelect('MAX(receivable.created_at)', 'lastActivity')
      .groupBy('customer.id')
      .addGroupBy('customer.name')
      .addGroupBy('customer.email')
      .addGroupBy('customer.is_active')
      .setParameters({
        unpaid: ReceivableStatus.UNPAID,
        paid: ReceivableStatus.PAID,
      });

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        `(customer.name ILIKE :search
          OR customer.email ILIKE :search
          OR customer.trnNumber ILIKE :search)`,
        { search },
      );
    }

    if (status === 'active') {
      qb.andWhere('customer.isActive = :isActive', { isActive: true });
    }

    if (status === 'inactive') {
      qb.andWhere('customer.isActive = :isActive', { isActive: false });
    }

    if (status === 'with_balance') {
      qb.having(
        `COALESCE(SUM(CASE WHEN receivable.status = :unpaid THEN receivable.amount ELSE 0 END), 0) > 0`,
      );
    }

    qb.orderBy('customer.name', 'ASC');

    const total = (await qb.clone().getRawMany()).length;
    qb.offset((page - 1) * limit).limit(limit);

    const rows = await qb.getRawMany<{
      customerId: string;
      customerName: string;
      email: string | null;
      isActive: boolean;
      outstanding: string;
      totalPaid: string;
      unpaidCount: string;
      lastActivity: string | null;
    }>();

    const data: CustomerLedgerListItem[] = rows.map((row) => ({
      customerId: row.customerId,
      customerName: row.customerName,
      email: row.email,
      isActive: row.isActive,
      outstanding: Number(row.outstanding),
      totalPaid: Number(row.totalPaid),
      unpaidCount: Number(row.unpaidCount),
      lastActivity: row.lastActivity,
    }));

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  private buildLedgerDrafts(receivables: Receivable[]): LedgerLineDraft[] {
    const drafts: LedgerLineDraft[] = [];

    for (const receivable of receivables) {
      const chargeType: CustomerLedgerEntryType = receivable.invoiceId
        ? 'invoice'
        : 'manual_receivable';
      const chargeReference =
        receivable.invoice?.invoiceNumber ?? `REC-${receivable.id}`;
      const chargeDescription = receivable.invoice
        ? `Invoice ${receivable.invoice.invoiceNumber}`
        : `Manual receivable #${receivable.id}`;

      drafts.push({
        sortTimestamp: new Date(receivable.createdAt).getTime(),
        sortKey: `charge-${receivable.id}`,
        date: this.toDateString(receivable.createdAt),
        type: chargeType,
        reference: chargeReference,
        description: chargeDescription,
        debit: receivable.amount,
        credit: null,
        status:
          receivable.status === ReceivableStatus.PAID ? 'paid' : 'unpaid',
        receivableId: receivable.id,
        invoiceId: receivable.invoiceId,
        receiptVoucherId: null,
        dueDate: receivable.dueDate,
      });

      if (
        receivable.status === ReceivableStatus.PAID &&
        receivable.receiptVoucher
      ) {
        const paidAt = receivable.paidAt ?? receivable.receiptVoucher.createdAt;
        drafts.push({
          sortTimestamp: new Date(paidAt).getTime() + 1,
          sortKey: `payment-${receivable.id}`,
          date: this.toDateString(paidAt),
          type: 'payment',
          reference: receivable.receiptVoucher.voucherNumber,
          description: `Payment for ${chargeReference}`,
          debit: null,
          credit: receivable.amount,
          status: 'paid',
          receivableId: receivable.id,
          invoiceId: receivable.invoiceId,
          receiptVoucherId: receivable.receiptVoucher.id,
          dueDate: null,
        });
      }
    }

    return drafts.sort((left, right) => {
      if (left.sortTimestamp !== right.sortTimestamp) {
        return left.sortTimestamp - right.sortTimestamp;
      }

      return left.sortKey.localeCompare(right.sortKey);
    });
  }

  private toLedgerEntries(drafts: LedgerLineDraft[]): CustomerLedgerEntry[] {
    const today = this.toDateString(new Date());

    return drafts.map((draft) => ({
      id: draft.sortKey,
      date: draft.date,
      type: draft.type,
      reference: draft.reference,
      description: draft.description,
      debit: draft.debit,
      credit: draft.credit,
      runningBalance: 0,
      status: draft.status,
      receivableId: draft.receivableId,
      invoiceId: draft.invoiceId,
      receiptVoucherId: draft.receiptVoucherId,
      dueDate: draft.dueDate,
      isOverdue:
        draft.status === 'unpaid' &&
        draft.dueDate !== null &&
        draft.dueDate < today,
    }));
  }

  private buildSummary(receivables: Receivable[]): CustomerLedgerSummary {
    const today = this.toDateString(new Date());
    let totalCharges = 0;
    let totalPayments = 0;
    let closingBalance = 0;
    let overdueAmount = 0;
    let unpaidCount = 0;
    let paidCount = 0;

    for (const receivable of receivables) {
      totalCharges += receivable.amount;

      if (receivable.status === ReceivableStatus.PAID) {
        totalPayments += receivable.amount;
        paidCount += 1;
      } else {
        closingBalance += receivable.amount;
        unpaidCount += 1;

        if (receivable.dueDate && receivable.dueDate < today) {
          overdueAmount += receivable.amount;
        }
      }
    }

    return {
      openingBalance: 0,
      totalCharges,
      totalPayments,
      closingBalance,
      overdueAmount,
      unpaidCount,
      paidCount,
    };
  }

  private filterEntries(
    entries: CustomerLedgerEntry[],
    query: QueryCustomerLedgerDto,
  ): CustomerLedgerEntry[] {
    const status = query.status ?? 'all';
    const type = query.type ?? 'all';
    const search = query.search?.trim().toLowerCase();

    return entries.filter((entry) => {
      if (status === 'unpaid' && entry.status !== 'unpaid') {
        return false;
      }

      if (status === 'paid' && entry.status !== 'paid') {
        return false;
      }

      if (type !== 'all' && entry.type !== type) {
        return false;
      }

      if (query.dateFrom && entry.date < query.dateFrom) {
        return false;
      }

      if (query.dateTo && entry.date > query.dateTo) {
        return false;
      }

      if (search) {
        const haystack = `${entry.reference} ${entry.description}`.toLowerCase();
        if (!haystack.includes(search)) {
          return false;
        }
      }

      return true;
    });
  }

  private computeOpeningBalance(
    entries: CustomerLedgerEntry[],
    dateFrom?: string,
  ): number {
    if (!dateFrom) {
      return 0;
    }

    return entries
      .filter((entry) => entry.date < dateFrom)
      .reduce(
        (balance, entry) =>
          balance + (entry.debit ?? 0) - (entry.credit ?? 0),
        0,
      );
  }

  private applyRunningBalance(
    entries: CustomerLedgerEntry[],
    openingBalance: number,
  ): CustomerLedgerEntry[] {
    let balance = openingBalance;

    return entries.map((entry) => {
      balance += (entry.debit ?? 0) - (entry.credit ?? 0);

      return {
        ...entry,
        runningBalance: balance,
      };
    });
  }

  private toDateString(value: Date | string): string {
    return new Date(value).toISOString().slice(0, 10);
  }
}

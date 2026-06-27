import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { ReceiptVoucher } from '../receipt-vouchers/entities/receipt-voucher.entity';
import { SalesEntry } from './entities/sales-entry.entity';
import { SalesDaySummary } from './interfaces/sales-day-summary.interface';
import { SalesPeriodSummary } from './interfaces/sales-period-summary.interface';

function toDateString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

@Injectable()
export class SalesService implements OnModuleInit {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    @InjectRepository(SalesEntry)
    private readonly salesEntriesRepository: Repository<SalesEntry>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.backfillFromReceiptVouchers();
  }

  async getDaySummary(date: string): Promise<SalesDaySummary> {
    const summary = await this.getSummary({ dateFrom: date, dateTo: date });

    return {
      date,
      totalSales: summary.totalSales,
      entryCount: summary.entryCount,
      entries: summary.entries,
    };
  }

  async getSummary(query: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<SalesPeriodSummary> {
    const today = toDateString(new Date());

    const qb = this.salesEntriesRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.receiptVoucher', 'receiptVoucher')
      .leftJoinAndSelect('entry.customer', 'customer')
      .leftJoinAndSelect('entry.invoice', 'invoice')
      .leftJoinAndSelect('entry.paymentMethod', 'paymentMethod')
      .leftJoin('entry.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.username']);

    if (query.dateFrom) {
      qb.andWhere('entry.saleDate >= :dateFrom', { dateFrom: query.dateFrom });
    }

    if (query.dateTo) {
      qb.andWhere('entry.saleDate <= :dateTo', { dateTo: query.dateTo });
    }

    const entries = await qb
      .orderBy('entry.saleDate', 'ASC')
      .addOrderBy('entry.createdAt', 'ASC')
      .addOrderBy('entry.id', 'ASC')
      .getMany();

    const totalSales = entries.reduce(
      (sum, entry) => sum + Number(entry.amount),
      0,
    );

    const todayEntries = entries.filter((entry) => entry.saleDate === today);
    const todayTotal = todayEntries.reduce(
      (sum, entry) => sum + Number(entry.amount),
      0,
    );

    return {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      todayTotal,
      todayCount: todayEntries.length,
      totalSales,
      entryCount: entries.length,
      entries,
    };
  }

  async findOne(id: number): Promise<SalesEntry> {
    const entry = await this.salesEntriesRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.receiptVoucher', 'receiptVoucher')
      .leftJoinAndSelect('entry.customer', 'customer')
      .leftJoinAndSelect('entry.invoice', 'invoice')
      .leftJoinAndSelect('entry.paymentMethod', 'paymentMethod')
      .leftJoin('entry.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.username'])
      .where('entry.id = :id', { id })
      .getOne();

    if (!entry) {
      throw new NotFoundException(`Sales entry #${id} not found`);
    }

    return entry;
  }

  async createFromReceiptVoucher(
    manager: EntityManager,
    voucher: ReceiptVoucher,
    customerName?: string,
    receivableId?: number,
  ): Promise<void> {
    const repository = manager.getRepository(SalesEntry);
    const existing = await repository.findOne({
      where: { receiptVoucherId: voucher.id },
    });

    if (existing) {
      return;
    }

    const name = customerName ?? voucher.customer?.name ?? 'Customer';
    const resolvedReceivableId =
      receivableId ?? voucher.receivableId ?? voucher.receivable?.id;

    if (!resolvedReceivableId) {
      throw new InternalServerErrorException(
        `Cannot create sales entry for receipt voucher ${voucher.voucherNumber}: missing receivable.`,
      );
    }

    await repository.save(
      repository.create({
        saleDate: toDateString(voucher.createdAt ?? new Date()),
        receiptVoucherId: voucher.id,
        receivableId: resolvedReceivableId,
        customerId: voucher.customerId,
        invoiceId: voucher.invoiceId,
        paymentMethodId: voucher.paymentMethodId,
        amount: voucher.amount,
        description: `Receipt ${voucher.voucherNumber} — ${name}`,
        createdById: voucher.createdById,
      }),
    );
  }

  private async backfillFromReceiptVouchers(): Promise<void> {
    const vouchers = await this.salesEntriesRepository.manager
      .getRepository(ReceiptVoucher)
      .createQueryBuilder('voucher')
      .leftJoinAndSelect('voucher.customer', 'customer')
      .leftJoin('sales_entries', 'entry', 'entry.receipt_voucher_id = voucher.id')
      .where('entry.id IS NULL')
      .getMany();

    if (!vouchers.length) {
      return;
    }

    for (const voucher of vouchers) {
      await this.createFromReceiptVoucher(
        this.salesEntriesRepository.manager,
        voucher,
      );
    }

    this.logger.log(
      `Backfilled ${vouchers.length} sales entry(ies) from receipt vouchers`,
    );
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  formatEmssNumber,
  getCurrentEmssYear,
} from '../common/utils/emss-number.util';
import {
  applyCreatedDateRangeFilter,
} from '../common/utils/date-range-query.util';
import { Invoice } from '../invoices/entities/invoice.entity';
import { SalesService } from '../sales/sales.service';
import { ReceiptVoucher } from '../receipt-vouchers/entities/receipt-voucher.entity';
import { CreateReceivableDto } from './dto/create-receivable.dto';
import { QueryReceivablesDto } from './dto/query-receivables.dto';
import { RecordReceiptDto } from './dto/record-receipt.dto';
import { Receivable, ReceivableStatus } from './entities/receivable.entity';
import { ReceivablesPaginatedResult } from './interfaces/receivables-paginated-result.interface';
import { PaymentMethodsService } from './payment-methods.service';

const RECEIPT_VOUCHER_SEQUENCE_START = 1000;
const DEFAULT_DUE_DAYS = 30;

interface CreateFromInvoiceInput {
  customerId: string;
  invoiceId: string;
  amount: number;
  dueDate: string;
  createdById: string;
}

function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().slice(0, 10);
}

@Injectable()
export class ReceivablesService implements OnModuleInit {
  private readonly logger = new Logger(ReceivablesService.name);

  constructor(
    @InjectRepository(Receivable)
    private readonly receivablesRepository: Repository<Receivable>,
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    @InjectRepository(ReceiptVoucher)
    private readonly receiptVouchersRepository: Repository<ReceiptVoucher>,
    private readonly paymentMethodsService: PaymentMethodsService,
    private readonly salesService: SalesService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.paymentMethodsService.ensurePaymentMethodsExist();
    await this.cleanupBrokenReceiptVouchers();
    await this.migrateReceivableFields();
    await this.assignCreatedByFromInvoices();
    await this.backfillFromInvoices();
  }

  async findAll(query: QueryReceivablesDto): Promise<ReceivablesPaginatedResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const status = query.status ?? 'all';

    const qb = this.receivablesRepository
      .createQueryBuilder('receivable')
      .leftJoinAndSelect('receivable.customer', 'customer')
      .leftJoinAndSelect('receivable.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('receivable.invoice', 'invoice')
      .leftJoinAndSelect('receivable.receiptVoucher', 'receiptVoucher')
      .leftJoin('receivable.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.username']);

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        `(customer.name ILIKE :search
          OR paymentMethod.name ILIKE :search
          OR invoice.invoiceNumber ILIKE :search
          OR CAST(receivable.id AS TEXT) ILIKE :search)`,
        { search },
      );
    }

    if (status === 'unpaid') {
      qb.andWhere('receivable.status = :status', {
        status: ReceivableStatus.UNPAID,
      });
    }

    if (status === 'paid') {
      qb.andWhere('receivable.status = :status', {
        status: ReceivableStatus.PAID,
      });
    }

    applyCreatedDateRangeFilter(
      qb,
      'receivable',
      query.dateFrom,
      query.dateTo,
    );

    qb.orderBy('receivable.id', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

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

  async findOne(id: number): Promise<Receivable> {
    const receivable = await this.receivablesRepository
      .createQueryBuilder('receivable')
      .leftJoinAndSelect('receivable.customer', 'customer')
      .leftJoinAndSelect('receivable.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('receivable.invoice', 'invoice')
      .leftJoinAndSelect('receivable.receiptVoucher', 'receiptVoucher')
      .leftJoin('receivable.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.username'])
      .where('receivable.id = :id', { id })
      .getOne();

    if (!receivable) {
      throw new NotFoundException(`Receivable with id ${id} not found`);
    }

    return receivable;
  }

  async create(
    createReceivableDto: CreateReceivableDto,
    createdById: string,
  ): Promise<Receivable> {
    if (createReceivableDto.paymentMethodId) {
      const paymentMethod = await this.paymentMethodsService.findOne(
        createReceivableDto.paymentMethodId,
      );
      if (!paymentMethod) {
        throw new BadRequestException(
          `Payment method with id ${createReceivableDto.paymentMethodId} not found`,
        );
      }
    }

    const receivable = this.receivablesRepository.create({
      customerId: createReceivableDto.customerId,
      paymentMethodId: createReceivableDto.paymentMethodId ?? null,
      amount: createReceivableDto.amount,
      dueDate:
        createReceivableDto.dueDate ?? addDays(new Date(), DEFAULT_DUE_DAYS),
      status: ReceivableStatus.UNPAID,
      bankDetail: createReceivableDto.bankDetail?.trim() || null,
      chequeNumber: createReceivableDto.chequeNumber?.trim() || null,
      chequeDate: createReceivableDto.chequeDate || null,
      transactionReference:
        createReceivableDto.transactionReference?.trim() || null,
      notes: createReceivableDto.notes?.trim() || null,
      createdById,
    });

    const saved = await this.receivablesRepository.save(receivable);
    return this.findOne(saved.id);
  }

  async createFromInvoice(
    manager: EntityManager,
    input: CreateFromInvoiceInput,
  ): Promise<Receivable> {
    const receivable = manager.getRepository(Receivable).create({
      customerId: input.customerId,
      invoiceId: input.invoiceId,
      amount: input.amount,
      dueDate: input.dueDate,
      paymentMethodId: null,
      status: ReceivableStatus.UNPAID,
      createdById: input.createdById,
    });

    return manager.getRepository(Receivable).save(receivable);
  }

  async recordReceipt(
    id: number,
    recordReceiptDto: RecordReceiptDto,
    createdById: string,
  ): Promise<Receivable> {
    const receivable = await this.findOne(id);

    if (receivable.status === ReceivableStatus.PAID) {
      throw new ConflictException(`Receivable #${id} is already paid.`);
    }

    const paymentMethod = await this.paymentMethodsService.findOne(
      recordReceiptDto.paymentMethodId,
    );
    if (!paymentMethod) {
      throw new BadRequestException(
        `Payment method with id ${recordReceiptDto.paymentMethodId} not found`,
      );
    }

    await this.receivablesRepository.manager.transaction(async (manager) => {
      const voucherNumber = await this.generateNextVoucherNumber(manager);
      const receivableId = receivable.id;

      const insertedRows: Array<{ id: string; receivable_id: number | null }> =
        await manager.query(
        `INSERT INTO receipt_vouchers (
          voucher_number,
          receivable_id,
          customer_id,
          invoice_id,
          amount,
          payment_method_id,
          bank_detail,
          cheque_number,
          cheque_date,
          transaction_reference,
          notes,
          created_by_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING id, receivable_id`,
        [
          voucherNumber,
          receivableId,
          receivable.customerId,
          receivable.invoiceId,
          receivable.amount,
          recordReceiptDto.paymentMethodId,
          recordReceiptDto.bankDetail?.trim() || null,
          recordReceiptDto.chequeNumber?.trim() || null,
          recordReceiptDto.chequeDate || null,
          recordReceiptDto.transactionReference?.trim() || null,
          recordReceiptDto.notes?.trim() || null,
          createdById,
        ],
      );

      if (!insertedRows[0]?.receivable_id) {
        throw new Error(
          `Receipt voucher was created without receivable_id for receivable #${receivableId}`,
        );
      }

      const voucherId = Number(insertedRows[0]?.id);
      const voucher = {
        id: voucherId,
        voucherNumber,
        receivableId,
        customerId: receivable.customerId,
        invoiceId: receivable.invoiceId,
        amount: receivable.amount,
        paymentMethodId: recordReceiptDto.paymentMethodId,
        createdById,
        createdAt: new Date(),
      } as ReceiptVoucher;

      await this.salesService.createFromReceiptVoucher(
        manager,
        voucher,
        receivable.customer?.name,
        receivable.id,
      );

      await manager.getRepository(Receivable).update(receivableId, {
        paymentMethodId: recordReceiptDto.paymentMethodId,
        bankDetail: recordReceiptDto.bankDetail?.trim() || null,
        chequeNumber: recordReceiptDto.chequeNumber?.trim() || null,
        chequeDate: recordReceiptDto.chequeDate || null,
        transactionReference:
          recordReceiptDto.transactionReference?.trim() || null,
        ...(recordReceiptDto.notes?.trim()
          ? { notes: recordReceiptDto.notes.trim() }
          : {}),
        status: ReceivableStatus.PAID,
        paidAt: new Date(),
      });
    });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const receivable = await this.findOne(id);

    if (receivable.invoiceId) {
      throw new BadRequestException(
        'Cannot delete a receivable linked to an invoice.',
      );
    }

    if (receivable.status === ReceivableStatus.PAID) {
      throw new BadRequestException(
        'Cannot delete a paid receivable. It has a receipt voucher.',
      );
    }

    await this.receivablesRepository.remove(receivable);
  }

  private async generateNextVoucherNumber(
    manager: EntityManager,
  ): Promise<string> {
    const year = getCurrentEmssYear();
    const result: Array<{ next_seq: string }> = await manager.query(
      `SELECT COALESCE(
        MAX(CAST(SPLIT_PART(voucher_number, '/', 2) AS INTEGER)),
        $2
      ) + 1 AS next_seq
      FROM receipt_vouchers
      WHERE voucher_number LIKE $1`,
      [`RV/%/${year}`, RECEIPT_VOUCHER_SEQUENCE_START - 1],
    );

    const nextSequence = Number(
      result[0]?.next_seq ?? RECEIPT_VOUCHER_SEQUENCE_START,
    );
    return formatEmssNumber(nextSequence, year).replace('EMSS/', 'RV/');
  }

  private async cleanupBrokenReceiptVouchers(): Promise<void> {
    await this.receivablesRepository.query(`
      DELETE FROM sales_entries
      WHERE receipt_voucher_id IN (
        SELECT id FROM receipt_vouchers WHERE receivable_id IS NULL
      )
    `);

    const deleted = await this.receivablesRepository.query(`
      DELETE FROM receipt_vouchers
      WHERE receivable_id IS NULL
      RETURNING id
    `);

    await this.receivablesRepository.query(`
      UPDATE receivables r
      SET
        status = 'unpaid',
        paid_at = NULL,
        payment_method_id = NULL,
        bank_detail = NULL,
        cheque_number = NULL,
        cheque_date = NULL,
        transaction_reference = NULL
      WHERE r.status = 'paid'
        AND NOT EXISTS (
          SELECT 1 FROM receipt_vouchers rv WHERE rv.receivable_id = r.id
        )
    `);

    if (deleted.length > 0) {
      this.logger.warn(
        `Removed ${deleted.length} broken receipt voucher(s) missing receivable_id`,
      );
    }
  }

  private async migrateReceivableFields(): Promise<void> {
    await this.receivablesRepository.query(`
      UPDATE receivables
      SET status = 'unpaid'
      WHERE status IS NULL
    `);

    await this.receivablesRepository.query(`
      UPDATE receivables r
      SET due_date = (r.created_at::date + INTERVAL '${DEFAULT_DUE_DAYS} days')::date
      WHERE r.due_date IS NULL
    `);

    await this.receivablesRepository.query(`
      UPDATE receivables
      SET payment_method_id = NULL
      WHERE status = 'unpaid' AND paid_at IS NULL
    `);

    await this.invoicesRepository.query(`
      UPDATE invoices
      SET due_date = (created_at::date + INTERVAL '${DEFAULT_DUE_DAYS} days')::date
      WHERE due_date IS NULL
    `);

    this.logger.log('Receivable and invoice field migration completed');
  }

  private async assignCreatedByFromInvoices(): Promise<void> {
    const result = await this.receivablesRepository.query(`
      UPDATE receivables r
      SET created_by_id = i.created_by_id
      FROM invoices i
      WHERE r.invoice_id = i.id
        AND r.created_by_id IS NULL
        AND i.created_by_id IS NOT NULL
    `);

    const affected = Number(result?.[1] ?? 0);
    if (affected) {
      this.logger.log(
        `Assigned creator to ${affected} invoice receivable(s) from invoices`,
      );
    }
  }

  private async backfillFromInvoices(): Promise<void> {
    const invoices = await this.invoicesRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.jobCard', 'jobCard')
      .leftJoin('receivables', 'receivable', 'receivable.invoice_id = invoice.id')
      .where('receivable.id IS NULL')
      .getMany();

    if (!invoices.length) {
      return;
    }

    for (const invoice of invoices) {
      const customerId = invoice.jobCard?.customerId;
      if (!customerId) {
        continue;
      }

      const dueDate =
        invoice.dueDate ?? addDays(invoice.createdAt, DEFAULT_DUE_DAYS);

      await this.receivablesRepository.save(
        this.receivablesRepository.create({
          customerId,
          invoiceId: invoice.id,
          amount: invoice.grandTotal,
          dueDate,
          status: ReceivableStatus.UNPAID,
          createdById: invoice.createdById,
        }),
      );
    }

    this.logger.log(
      `Backfilled ${invoices.length} receivable(s) from existing invoices`,
    );
  }
}

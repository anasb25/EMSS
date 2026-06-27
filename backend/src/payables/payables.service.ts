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
import { Bill } from '../bills/entities/bill.entity';
import {
  applyCreatedDateRangeFilter,
} from '../common/utils/date-range-query.util';
import { PaymentMethodsService } from '../receivables/payment-methods.service';
import { CreatePayableDto } from './dto/create-payable.dto';
import { QueryPayablesDto } from './dto/query-payables.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { Payable, PayableStatus } from './entities/payable.entity';
import { PayablesPaginatedResult } from './interfaces/payables-paginated-result.interface';

interface CreateFromBillInput {
  vendorId: string;
  billId: string;
  amount: number;
  dueDate: string;
  createdById: string;
}

@Injectable()
export class PayablesService implements OnModuleInit {
  private readonly logger = new Logger(PayablesService.name);

  constructor(
    @InjectRepository(Payable)
    private readonly payablesRepository: Repository<Payable>,
    @InjectRepository(Bill)
    private readonly billsRepository: Repository<Bill>,
    private readonly paymentMethodsService: PaymentMethodsService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.backfillFromBills();
    await this.clearBillPayablePaymentMethodDefaults();
  }

  async findAll(query: QueryPayablesDto): Promise<PayablesPaginatedResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const status = query.status ?? 'all';

    const qb = this.payablesRepository
      .createQueryBuilder('payable')
      .leftJoinAndSelect('payable.vendor', 'vendor')
      .leftJoinAndSelect('payable.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('payable.bill', 'bill')
      .leftJoin('payable.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.username']);

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        `(vendor.name ILIKE :search
          OR paymentMethod.name ILIKE :search
          OR bill.billNumber ILIKE :search
          OR bill.vendorReference ILIKE :search
          OR CAST(payable.id AS TEXT) ILIKE :search)`,
        { search },
      );
    }

    if (status === 'unpaid') {
      qb.andWhere('payable.status = :status', { status: PayableStatus.UNPAID });
    }

    if (status === 'paid') {
      qb.andWhere('payable.status = :status', { status: PayableStatus.PAID });
    }

    applyCreatedDateRangeFilter(
      qb,
      'payable',
      query.dateFrom,
      query.dateTo,
    );

    qb.orderBy('payable.id', 'DESC');
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

  async findOne(id: number): Promise<Payable> {
    const payable = await this.payablesRepository
      .createQueryBuilder('payable')
      .leftJoinAndSelect('payable.vendor', 'vendor')
      .leftJoinAndSelect('payable.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('payable.bill', 'bill')
      .leftJoin('payable.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.username'])
      .where('payable.id = :id', { id })
      .getOne();

    if (!payable) {
      throw new NotFoundException(`Payable with id ${id} not found`);
    }

    return payable;
  }

  async create(
    createPayableDto: CreatePayableDto,
    createdById: string,
  ): Promise<Payable> {
    let paymentMethodId: number | null = null;

    if (createPayableDto.paymentMethodId) {
      const paymentMethod = await this.paymentMethodsService.findOne(
        createPayableDto.paymentMethodId,
      );
      if (!paymentMethod) {
        throw new BadRequestException(
          `Payment method with id ${createPayableDto.paymentMethodId} not found`,
        );
      }
      paymentMethodId = createPayableDto.paymentMethodId;
    }

    const payable = this.payablesRepository.create({
      vendorId: createPayableDto.vendorId,
      paymentMethodId,
      amount: createPayableDto.amount,
      dueDate: createPayableDto.dueDate || null,
      status: PayableStatus.UNPAID,
      bankDetail: createPayableDto.bankDetail?.trim() || null,
      chequeNumber: createPayableDto.chequeNumber?.trim() || null,
      chequeDate: createPayableDto.chequeDate || null,
      transactionReference:
        createPayableDto.transactionReference?.trim() || null,
      notes: createPayableDto.notes?.trim() || null,
      createdById,
    });

    const saved = await this.payablesRepository.save(payable);
    return this.findOne(saved.id);
  }

  async createFromBill(
    manager: EntityManager,
    input: CreateFromBillInput,
  ): Promise<Payable> {
    const payable = manager.getRepository(Payable).create({
      vendorId: input.vendorId,
      billId: input.billId,
      amount: input.amount,
      dueDate: input.dueDate,
      paymentMethodId: null,
      status: PayableStatus.UNPAID,
      createdById: input.createdById,
    });

    return manager.getRepository(Payable).save(payable);
  }

  async recordPayment(
    id: number,
    recordPaymentDto: RecordPaymentDto,
  ): Promise<Payable> {
    const payable = await this.findOne(id);

    if (payable.status === PayableStatus.PAID) {
      throw new ConflictException(`Payable #${id} is already paid.`);
    }

    const paymentMethod = await this.paymentMethodsService.findOne(
      recordPaymentDto.paymentMethodId,
    );
    if (!paymentMethod) {
      throw new BadRequestException(
        `Payment method with id ${recordPaymentDto.paymentMethodId} not found`,
      );
    }

    await this.payablesRepository.manager.transaction(async (manager) => {
      payable.paymentMethodId = recordPaymentDto.paymentMethodId;
      payable.bankDetail = recordPaymentDto.bankDetail?.trim() || null;
      payable.chequeNumber = recordPaymentDto.chequeNumber?.trim() || null;
      payable.chequeDate = recordPaymentDto.chequeDate || null;
      payable.transactionReference =
        recordPaymentDto.transactionReference?.trim() || null;
      if (recordPaymentDto.notes?.trim()) {
        payable.notes = recordPaymentDto.notes.trim();
      }
      payable.status = PayableStatus.PAID;
      payable.paidAt = new Date();

      await manager.getRepository(Payable).save(payable);
    });

    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const payable = await this.findOne(id);

    if (payable.billId) {
      throw new BadRequestException(
        'Cannot delete a payable linked to a bill. Delete the bill instead.',
      );
    }

    await this.payablesRepository.remove(payable);
  }

  private async backfillFromBills(): Promise<void> {
    const bills = await this.billsRepository
      .createQueryBuilder('bill')
      .leftJoin('payables', 'payable', 'payable.bill_id = bill.id')
      .where('payable.id IS NULL')
      .getMany();

    if (!bills.length) {
      return;
    }

    for (const bill of bills) {
      await this.payablesRepository.save(
        this.payablesRepository.create({
          vendorId: bill.vendorId,
          billId: bill.id,
          amount: bill.grandTotal,
          dueDate: bill.dueDate,
          paymentMethodId: null,
          status: PayableStatus.UNPAID,
          createdById: bill.createdById,
        }),
      );
    }

    this.logger.log(
      `Backfilled ${bills.length} payable(s) from existing bills`,
    );
  }

  private async clearBillPayablePaymentMethodDefaults(): Promise<void> {
    const cashMethod = await this.paymentMethodsService.findByName('Cash');
    if (!cashMethod) {
      return;
    }

    const result = await this.payablesRepository
      .createQueryBuilder()
      .update(Payable)
      .set({ paymentMethodId: null })
      .where('status = :status', { status: PayableStatus.UNPAID })
      .andWhere('bill_id IS NOT NULL')
      .andWhere('payment_method_id = :cashMethodId', {
        cashMethodId: cashMethod.id,
      })
      .execute();

    if (result.affected) {
      this.logger.log(
        `Cleared default Cash payment method on ${result.affected} unpaid bill payable(s)`,
      );
    }
  }
}

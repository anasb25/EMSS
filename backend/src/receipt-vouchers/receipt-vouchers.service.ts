import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryReceiptVouchersDto } from './dto/query-receipt-vouchers.dto';
import { ReceiptVoucher } from './entities/receipt-voucher.entity';
import { ReceiptVouchersPaginatedResult } from './interfaces/receipt-vouchers-paginated-result.interface';

@Injectable()
export class ReceiptVouchersService {
  constructor(
    @InjectRepository(ReceiptVoucher)
    private readonly receiptVouchersRepository: Repository<ReceiptVoucher>,
  ) {}

  async findAll(
    query: QueryReceiptVouchersDto,
  ): Promise<ReceiptVouchersPaginatedResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.receiptVouchersRepository
      .createQueryBuilder('voucher')
      .leftJoinAndSelect('voucher.customer', 'customer')
      .leftJoinAndSelect('voucher.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('voucher.invoice', 'invoice')
      .leftJoinAndSelect('voucher.receivable', 'receivable')
      .leftJoin('voucher.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.username']);

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        `(voucher.voucherNumber ILIKE :search
          OR customer.name ILIKE :search
          OR invoice.invoiceNumber ILIKE :search
          OR CAST(voucher.id AS TEXT) ILIKE :search)`,
        { search },
      );
    }

    qb.orderBy('voucher.id', 'DESC');
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

  async findByReceivableId(receivableId: number): Promise<ReceiptVoucher> {
    const voucher = await this.receiptVouchersRepository
      .createQueryBuilder('voucher')
      .leftJoinAndSelect('voucher.customer', 'customer')
      .leftJoinAndSelect('voucher.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('voucher.invoice', 'invoice')
      .leftJoinAndSelect('voucher.receivable', 'receivable')
      .leftJoin('voucher.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.username'])
      .where('receivable.id = :receivableId', { receivableId })
      .getOne();

    if (!voucher) {
      throw new NotFoundException(
        `Receipt voucher for receivable ${receivableId} not found`,
      );
    }

    return voucher;
  }

  async findOne(id: number): Promise<ReceiptVoucher> {
    const voucher = await this.receiptVouchersRepository
      .createQueryBuilder('voucher')
      .leftJoinAndSelect('voucher.customer', 'customer')
      .leftJoinAndSelect('voucher.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('voucher.invoice', 'invoice')
      .leftJoinAndSelect('voucher.receivable', 'receivable')
      .leftJoin('voucher.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.username'])
      .where('voucher.id = :id', { id })
      .getOne();

    if (!voucher) {
      throw new NotFoundException(`Receipt voucher with id ${id} not found`);
    }

    return voucher;
  }
}

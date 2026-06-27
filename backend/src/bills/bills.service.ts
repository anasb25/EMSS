import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import {
  formatEmssNumber,
  getCurrentEmssYear,
} from '../common/utils/emss-number.util';
import { calculateLinePricing } from '../common/utils/pricing.util';
import {
  applyDateRangeFilter,
} from '../common/utils/date-range-query.util';
import { PayablesService } from '../payables/payables.service';
import { Vendor } from '../vendors/entities/vendor.entity';
import { CreateBillDto } from './dto/create-bill.dto';
import { QueryBillsDto } from './dto/query-bills.dto';
import { BillItem } from './entities/bill-item.entity';
import { Bill } from './entities/bill.entity';
import { BillsPaginatedResult } from './interfaces/bills-paginated-result.interface';

const BILL_SEQUENCE_START = 1000;

@Injectable()
export class BillsService {
  constructor(
    @InjectRepository(Bill)
    private readonly billsRepository: Repository<Bill>,
    @InjectRepository(Vendor)
    private readonly vendorsRepository: Repository<Vendor>,
    private readonly payablesService: PayablesService,
  ) {}

  async findAll(query: QueryBillsDto): Promise<BillsPaginatedResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.billsRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.vendor', 'vendor')
      .leftJoinAndSelect('bill.items', 'items')
      .leftJoin('bill.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.username']);

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        `(bill.billNumber ILIKE :search
          OR bill.vendorReference ILIKE :search
          OR vendor.name ILIKE :search)`,
        { search },
      );
    }

    applyDateRangeFilter(qb, 'bill.billDate', query.dateFrom, query.dateTo);

    qb.orderBy('bill.createdAt', 'DESC');
    qb.addOrderBy('items.createdAt', 'ASC');
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

  async findOne(id: string): Promise<Bill> {
    const bill = await this.billsRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.vendor', 'vendor')
      .leftJoinAndSelect('bill.items', 'items')
      .leftJoin('bill.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.username'])
      .where('bill.id = :id', { id })
      .orderBy('items.createdAt', 'ASC')
      .getOne();

    if (!bill) {
      throw new NotFoundException(`Bill with id ${id} not found`);
    }

    return bill;
  }

  async create(
    createBillDto: CreateBillDto,
    createdById: string,
  ): Promise<Bill> {
    const vendor = await this.vendorsRepository.findOne({
      where: { id: createBillDto.vendorId },
    });
    if (!vendor) {
      throw new NotFoundException(
        `Vendor with id ${createBillDto.vendorId} not found`,
      );
    }

    if (!createBillDto.items?.length) {
      throw new BadRequestException(
        'Bill must have at least one line item.',
      );
    }

    const savedId = await this.billsRepository.manager.transaction(
      async (manager) => {
        const pricedItems = createBillDto.items.map((item) => {
          const pricing = calculateLinePricing(
            item.quantity,
            item.unitPrice,
            item.includeVat ?? false,
            item.vatPercent ?? 5,
          );

          return manager.getRepository(BillItem).create({
            description: item.description.trim(),
            note: item.note?.trim() || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            includeVat: item.includeVat ?? false,
            vatPercent: pricing.vatPercent,
            subtotal: pricing.subtotal,
            vatAmount: pricing.vatAmount,
            lineTotal: pricing.lineTotal,
          });
        });

        const subtotal = pricedItems.reduce(
          (sum, item) => sum + Number(item.subtotal),
          0,
        );
        const vatTotal = pricedItems.reduce(
          (sum, item) => sum + Number(item.vatAmount),
          0,
        );
        const grandTotal = pricedItems.reduce(
          (sum, item) => sum + Number(item.lineTotal),
          0,
        );

        const billNumber = await this.generateNextBillNumber(manager);

        const bill = manager.getRepository(Bill).create({
          billNumber,
          vendorId: createBillDto.vendorId,
          vendorReference: createBillDto.vendorReference?.trim() || null,
          billDate: createBillDto.billDate,
          dueDate: createBillDto.dueDate,
          subtotal,
          vatTotal,
          grandTotal,
          notes: createBillDto.notes?.trim() || null,
          createdById,
          items: pricedItems,
        });

        const saved = await manager.getRepository(Bill).save(bill);

        await this.payablesService.createFromBill(manager, {
          vendorId: createBillDto.vendorId,
          billId: saved.id,
          amount: grandTotal,
          dueDate: createBillDto.dueDate,
          createdById,
        });

        return saved.id;
      },
    );

    return this.findOne(savedId);
  }

  private async generateNextBillNumber(
    manager: EntityManager,
  ): Promise<string> {
    const year = getCurrentEmssYear();
    const result: Array<{ next_seq: string }> = await manager.query(
      `SELECT COALESCE(
        MAX(CAST(SPLIT_PART(bill_number, '/', 2) AS INTEGER)),
        $2
      ) + 1 AS next_seq
      FROM bills
      WHERE bill_number LIKE $1`,
      [`BILL/%/${year}`, BILL_SEQUENCE_START - 1],
    );

    const nextSequence = Number(result[0]?.next_seq ?? BILL_SEQUENCE_START);
    return formatEmssNumber(nextSequence, year).replace('EMSS/', 'BILL/');
  }
}

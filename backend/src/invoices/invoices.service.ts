import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { JobCard } from '../job-cards/entities/job-card.entity';
import {
  formatEmssNumber,
  getCurrentEmssYear,
} from '../common/utils/emss-number.util';
import {
  applyCreatedDateRangeFilter,
} from '../common/utils/date-range-query.util';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { InvoiceItem } from './entities/invoice-item.entity';
import { Invoice } from './entities/invoice.entity';
import { ReceivablesService } from '../receivables/receivables.service';
import { InvoicesPaginatedResult } from './interfaces/invoices-paginated-result.interface';

const INVOICE_SEQUENCE_START = 1000;
const DEFAULT_DUE_DAYS = 30;

function addDays(date: Date, days: number): string {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result.toISOString().slice(0, 10);
}

@Injectable()
export class InvoicesService {
  constructor(
    @InjectRepository(Invoice)
    private readonly invoicesRepository: Repository<Invoice>,
    @InjectRepository(JobCard)
    private readonly jobCardsRepository: Repository<JobCard>,
    private readonly receivablesService: ReceivablesService,
  ) {}

  async findAll(query: QueryInvoicesDto): Promise<InvoicesPaginatedResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.invoicesRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.jobCard', 'jobCard')
      .leftJoinAndSelect('jobCard.customer', 'customer')
      .leftJoinAndSelect('invoice.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoin('invoice.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.username']);

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        `(invoice.invoiceNumber ILIKE :search
          OR jobCard.jobCardNumber ILIKE :search
          OR customer.name ILIKE :search)`,
        { search },
      );
    }

    applyCreatedDateRangeFilter(
      qb,
      'invoice',
      query.dateFrom,
      query.dateTo,
    );

    qb.orderBy('invoice.createdAt', 'DESC');
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

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoicesRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.jobCard', 'jobCard')
      .leftJoinAndSelect('jobCard.customer', 'customer')
      .leftJoinAndSelect('jobCard.items', 'jobCardItems')
      .leftJoinAndSelect('jobCardItems.product', 'jobCardProduct')
      .leftJoinAndSelect('invoice.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoin('invoice.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.username'])
      .leftJoin('jobCard.createdBy', 'jobCardCreatedBy')
      .addSelect(['jobCardCreatedBy.id', 'jobCardCreatedBy.username'])
      .where('invoice.id = :id', { id })
      .orderBy('items.createdAt', 'ASC')
      .getOne();

    if (!invoice) {
      throw new NotFoundException(`Invoice with id ${id} not found`);
    }

    return invoice;
  }

  async createFromJobCard(
    jobCardId: string,
    createdById: string,
  ): Promise<Invoice> {
    const savedId = await this.invoicesRepository.manager.transaction(
      async (manager) => {
        const jobCard = await manager
          .getRepository(JobCard)
          .createQueryBuilder('jobCard')
          .leftJoinAndSelect('jobCard.items', 'items')
          .leftJoinAndSelect('items.product', 'product')
          .where('jobCard.id = :jobCardId', { jobCardId })
          .orderBy('items.createdAt', 'ASC')
          .getOne();

        if (!jobCard) {
          throw new NotFoundException(
            `Job card with id ${jobCardId} not found`,
          );
        }

        this.ensureWorkflowComplete(jobCard);

        if (!jobCard.items?.length) {
          throw new BadRequestException(
            'Job card must have at least one product line to generate an invoice.',
          );
        }

        const existing = await manager.getRepository(Invoice).findOne({
          where: { jobCardId },
        });
        if (existing) {
          throw new ConflictException(
            `An invoice already exists for job card ${jobCard.jobCardNumber}.`,
          );
        }

        jobCard.isOpen = false;
        await manager.getRepository(JobCard).save(jobCard);

        const subtotal = jobCard.items.reduce(
          (sum, item) => sum + Number(item.subtotal),
          0,
        );
        const vatTotal = jobCard.items.reduce(
          (sum, item) => sum + Number(item.vatAmount),
          0,
        );
        const grandTotal = jobCard.items.reduce(
          (sum, item) => sum + Number(item.lineTotal),
          0,
        );

        const invoiceNumber = await this.generateNextInvoiceNumber(manager);

        const invoiceItems = jobCard.items.map((item) =>
          manager.getRepository(InvoiceItem).create({
            productId: item.productId,
            productName: item.product?.name ?? 'Product',
            note: item.note,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            includeVat: item.includeVat,
            vatPercent: item.vatPercent,
            subtotal: item.subtotal,
            vatAmount: item.vatAmount,
            lineTotal: item.lineTotal,
          }),
        );

        const dueDate = addDays(new Date(), DEFAULT_DUE_DAYS);

        const invoice = manager.getRepository(Invoice).create({
          invoiceNumber,
          jobCardId: jobCard.id,
          subtotal,
          vatTotal,
          grandTotal,
          dueDate,
          createdById,
          items: invoiceItems,
        });

        const saved = await manager.getRepository(Invoice).save(invoice);

        await this.receivablesService.createFromInvoice(manager, {
          customerId: jobCard.customerId,
          invoiceId: saved.id,
          amount: grandTotal,
          dueDate,
          createdById,
        });

        return saved.id;
      },
    );

    return this.findOne(savedId);
  }

  private ensureWorkflowComplete(jobCard: JobCard): void {
    const complete =
      jobCard.transport &&
      jobCard.logistics &&
      jobCard.isImport &&
      jobCard.isExport &&
      jobCard.freight;

    if (!complete) {
      throw new BadRequestException(
        'All workflow steps must be complete before generating an invoice.',
      );
    }
  }

  private async generateNextInvoiceNumber(
    manager: EntityManager,
  ): Promise<string> {
    const year = getCurrentEmssYear();
    const result: Array<{ next_seq: string }> = await manager.query(
      `SELECT COALESCE(
        MAX(CAST(SPLIT_PART(invoice_number, '/', 2) AS INTEGER)),
        $2
      ) + 1 AS next_seq
      FROM invoices
      WHERE invoice_number LIKE $1`,
      [`EMSS/%/${year}`, INVOICE_SEQUENCE_START - 1],
    );

    const nextSequence = Number(result[0]?.next_seq ?? INVOICE_SEQUENCE_START);
    return formatEmssNumber(nextSequence, year);
  }
}

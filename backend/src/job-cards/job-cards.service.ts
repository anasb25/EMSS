import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, EntityManager, Repository } from 'typeorm';
import { Customer } from '../customers/entities/customer.entity';
import { Product } from '../products/entities/product.entity';
import { CreateJobCardDto } from './dto/create-job-card.dto';
import { JobCardItemDto } from './dto/job-card-item.dto';
import { QueryJobCardsDto } from './dto/query-job-cards.dto';
import { UpdateJobCardDto } from './dto/update-job-card.dto';
import { JobCardProduct } from './entities/job-card-product.entity';
import { JobCard } from './entities/job-card.entity';
import { JobCardsPaginatedResult } from './interfaces/job-cards-paginated-result.interface';
import { calculateLinePricing } from './utils/job-card-pricing.util';
import {
  formatJobCardNumber,
  getCurrentJobCardYear,
} from './utils/job-card-number.util';

@Injectable()
export class JobCardsService {
  constructor(
    @InjectRepository(JobCard)
    private readonly jobCardsRepository: Repository<JobCard>,
    @InjectRepository(JobCardProduct)
    private readonly jobCardProductsRepository: Repository<JobCardProduct>,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async findAll(query: QueryJobCardsDto): Promise<JobCardsPaginatedResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const status = query.status ?? 'open';

    const qb = this.jobCardsRepository
      .createQueryBuilder('jobCard')
      .leftJoinAndSelect('jobCard.customer', 'customer')
      .leftJoinAndSelect('jobCard.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoin('jobCard.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.username']);

    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        `(jobCard.jobCardNumber ILIKE :search
          OR jobCard.blNumber ILIKE :search
          OR jobCard.declarationNumber ILIKE :search
          OR jobCard.containerNumber ILIKE :search
          OR customer.name ILIKE :search
          OR product.name ILIKE :search)`,
        { search },
      );
    }

    if (status === 'open') {
      qb.andWhere('jobCard.isOpen = :isOpen', { isOpen: true });
    } else if (status === 'closed') {
      qb.andWhere('jobCard.isOpen = :isOpen', { isOpen: false });
    }

    qb.orderBy('jobCard.createdAt', 'DESC');
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

  async findOne(id: string): Promise<JobCard> {
    const jobCard = await this.jobCardsRepository
      .createQueryBuilder('jobCard')
      .leftJoinAndSelect('jobCard.customer', 'customer')
      .leftJoinAndSelect('jobCard.items', 'items')
      .leftJoinAndSelect('items.product', 'product')
      .leftJoin('jobCard.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.username'])
      .where('jobCard.id = :id', { id })
      .orderBy('items.createdAt', 'ASC')
      .getOne();
    if (!jobCard) {
      throw new NotFoundException(`Job card with id ${id} not found`);
    }
    return jobCard;
  }

  async create(
    createJobCardDto: CreateJobCardDto,
    createdById: string,
  ): Promise<JobCard> {
    await this.ensureCustomerExists(createJobCardDto.customerId);

    const savedId = await this.jobCardsRepository.manager.transaction(
      async (manager) => {
        const jobCardNumber = await this.generateNextJobCardNumber(manager);
        const items = await this.buildLineItems(createJobCardDto.items, manager);

        const jobCard = manager.getRepository(JobCard).create({
          jobCardNumber,
          customerId: createJobCardDto.customerId,
          createdById,
          blNumber: createJobCardDto.blNumber ?? null,
          declarationNumber: createJobCardDto.declarationNumber ?? null,
          containerNumber: createJobCardDto.containerNumber ?? null,
          description: createJobCardDto.description ?? null,
          isOpen: true,
          transport: false,
          logistics: false,
          isImport: false,
          isExport: false,
          freight: false,
          items,
        });

        const saved = await manager.getRepository(JobCard).save(jobCard);
        return saved.id;
      },
    );

    return this.findOne(savedId);
  }

  async update(id: string, updateJobCardDto: UpdateJobCardDto): Promise<JobCard> {
    const jobCard = await this.findOne(id);

    if (updateJobCardDto.customerId) {
      await this.ensureCustomerExists(updateJobCardDto.customerId);
      jobCard.customerId = updateJobCardDto.customerId;
    }

    if (updateJobCardDto.blNumber !== undefined) {
      jobCard.blNumber = updateJobCardDto.blNumber || null;
    }

    if (updateJobCardDto.declarationNumber !== undefined) {
      jobCard.declarationNumber = updateJobCardDto.declarationNumber || null;
    }

    if (updateJobCardDto.containerNumber !== undefined) {
      jobCard.containerNumber = updateJobCardDto.containerNumber || null;
    }

    if (updateJobCardDto.description !== undefined) {
      jobCard.description = updateJobCardDto.description || null;
    }

    if (updateJobCardDto.isOpen !== undefined) {
      jobCard.isOpen = updateJobCardDto.isOpen;
    }

    if (updateJobCardDto.transport !== undefined) {
      jobCard.transport = updateJobCardDto.transport;
    }

    if (updateJobCardDto.logistics !== undefined) {
      jobCard.logistics = updateJobCardDto.logistics;
    }

    if (updateJobCardDto.isImport !== undefined) {
      jobCard.isImport = updateJobCardDto.isImport;
    }

    if (updateJobCardDto.isExport !== undefined) {
      jobCard.isExport = updateJobCardDto.isExport;
    }

    if (updateJobCardDto.freight !== undefined) {
      jobCard.freight = updateJobCardDto.freight;
    }

    if (
      jobCard.transport &&
      jobCard.logistics &&
      jobCard.isImport &&
      jobCard.isExport &&
      jobCard.freight
    ) {
      jobCard.isOpen = false;
    } else {
      jobCard.isOpen = true;
    }

    if (updateJobCardDto.items) {
      await this.jobCardProductsRepository.delete({ jobCardId: id });
      jobCard.items = await this.buildLineItems(updateJobCardDto.items);
    }

    await this.jobCardsRepository.save(jobCard);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const jobCard = await this.findOne(id);
    await this.jobCardsRepository.remove(jobCard);
  }

  private async ensureCustomerExists(customerId: string): Promise<void> {
    const customer = await this.customersRepository.findOne({
      where: { id: customerId },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with id ${customerId} not found`);
    }
  }

  private async generateNextJobCardNumber(
    manager: EntityManager,
  ): Promise<string> {
    const year = getCurrentJobCardYear();
    const result: Array<{ next_seq: string }> = await manager.query(
      `SELECT COALESCE(
        MAX(CAST(SPLIT_PART(job_card_number, '/', 2) AS INTEGER)),
        0
      ) + 1 AS next_seq
      FROM job_cards
      WHERE job_card_number LIKE $1`,
      [`EMSS/%/${year}`],
    );

    const nextSequence = Number(result[0]?.next_seq ?? 1);
    return formatJobCardNumber(nextSequence, year);
  }

  private async buildLineItems(
    itemDtos: JobCardItemDto[],
    manager?: EntityManager,
  ): Promise<JobCardProduct[]> {
    if (!itemDtos.length) {
      throw new BadRequestException('At least one product line is required.');
    }

    const jobCardProductsRepository = manager
      ? manager.getRepository(JobCardProduct)
      : this.jobCardProductsRepository;
    const productsRepository = manager
      ? manager.getRepository(Product)
      : this.productsRepository;

    const productIds = itemDtos.map((item) => item.productId);
    const uniqueIds = [...new Set(productIds)];
    if (uniqueIds.length !== productIds.length) {
      throw new BadRequestException('Duplicate products are not allowed.');
    }

    const products = await productsRepository.findBy({
      id: In(uniqueIds),
    });

    if (products.length !== uniqueIds.length) {
      throw new BadRequestException('One or more products were not found.');
    }

    const productMap = new Map(products.map((product) => [product.id, product]));

    return itemDtos.map((itemDto) => {
      const product = productMap.get(itemDto.productId);
      if (!product) {
        throw new BadRequestException(
          `Product with id ${itemDto.productId} was not found.`,
        );
      }

      const pricing = calculateLinePricing(
        itemDto.quantity,
        itemDto.unitPrice,
        itemDto.includeVat,
      );

      return jobCardProductsRepository.create({
        productId: itemDto.productId,
        product,
        note: itemDto.note?.trim() || null,
        quantity: itemDto.quantity,
        unitPrice: itemDto.unitPrice,
        includeVat: itemDto.includeVat,
        vatPercent: pricing.vatPercent,
        subtotal: pricing.subtotal,
        vatAmount: pricing.vatAmount,
        lineTotal: pricing.lineTotal,
      });
    });
  }
}

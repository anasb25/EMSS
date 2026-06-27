import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { calculateLinePricing } from '../common/utils/pricing.util';
import { PaymentMethodsService } from '../receivables/payment-methods.service';
import { VendorsService } from '../vendors/vendors.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { QueryExpensesDto } from './dto/query-expenses.dto';
import { ExpenseCategory } from './entities/expense-category.entity';
import { Expense } from './entities/expense.entity';
import { ExpensesPaginatedResult } from './interfaces/expenses-paginated-result.interface';

function toDateString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

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

@Injectable()
export class ExpensesService implements OnModuleInit {
  private readonly logger = new Logger(ExpensesService.name);

  constructor(
    @InjectRepository(Expense)
    private readonly expensesRepository: Repository<Expense>,
    @InjectRepository(ExpenseCategory)
    private readonly categoriesRepository: Repository<ExpenseCategory>,
    private readonly paymentMethodsService: PaymentMethodsService,
    private readonly vendorsService: VendorsService,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.paymentMethodsService.ensurePaymentMethodsExist();
    await this.ensureCategoriesExist();
    await this.migrateLegacyCashExpenses();
    await this.migrateExpenseVatFields();
  }

  findAllCategories(): Promise<ExpenseCategory[]> {
    return this.categoriesRepository.find({ order: { name: 'ASC' } });
  }

  async findAll(query: QueryExpensesDto): Promise<ExpensesPaginatedResult> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const qb = this.expensesRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.category', 'category')
      .leftJoinAndSelect('expense.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('expense.vendor', 'vendor')
      .leftJoin('expense.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.username']);

    this.applyFilters(qb, query);

    qb.orderBy('expense.expenseDate', 'DESC');
    qb.addOrderBy('expense.id', 'DESC');
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    const summary = await this.computeSummary(query);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
      summary,
    };
  }

  async findOne(id: number): Promise<Expense> {
    const expense = await this.expensesRepository
      .createQueryBuilder('expense')
      .leftJoinAndSelect('expense.category', 'category')
      .leftJoinAndSelect('expense.paymentMethod', 'paymentMethod')
      .leftJoinAndSelect('expense.vendor', 'vendor')
      .leftJoin('expense.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.username'])
      .where('expense.id = :id', { id })
      .getOne();

    if (!expense) {
      throw new NotFoundException(`Expense #${id} not found`);
    }

    return expense;
  }

  async create(
    dto: CreateExpenseDto,
    createdById: string,
  ): Promise<Expense> {
    const category = await this.categoriesRepository.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new BadRequestException(
        `Expense category with id ${dto.categoryId} not found`,
      );
    }

    const paymentMethod = await this.paymentMethodsService.findOne(
      dto.paymentMethodId,
    );
    if (!paymentMethod) {
      throw new BadRequestException(
        `Payment method with id ${dto.paymentMethodId} not found`,
      );
    }

    if (dto.vendorId) {
      await this.vendorsService.findOne(dto.vendorId);
    }

    const includeVat = dto.includeVat ?? false;
    const vatPercent = dto.vatPercent ?? 5;
    const pricing = calculateLinePricing(1, dto.amount, includeVat, vatPercent);

    let expenseId = 0;

    await this.expensesRepository.manager.transaction(async (manager) => {
      const expense = manager.getRepository(Expense).create({
        expenseDate: dto.expenseDate,
        subtotal: pricing.subtotal,
        vatAmount: pricing.vatAmount,
        amount: pricing.lineTotal,
        includeVat,
        vatPercent: pricing.vatPercent,
        description: dto.description.trim(),
        categoryId: dto.categoryId,
        paymentMethodId: dto.paymentMethodId,
        vendorId: dto.vendorId ?? null,
        notes: dto.notes?.trim() || null,
        createdById,
      });

      const saved = await manager.getRepository(Expense).save(expense);
      expenseId = saved.id;
    });

    return this.findOne(expenseId);
  }

  async remove(id: number): Promise<void> {
    const expense = await this.findOne(id);
    await this.expensesRepository.remove(expense);
  }

  private applyFilters(
    qb: SelectQueryBuilder<Expense>,
    query: QueryExpensesDto,
  ): void {
    if (query.search?.trim()) {
      const search = `%${query.search.trim()}%`;
      qb.andWhere(
        `(expense.description ILIKE :search
          OR category.name ILIKE :search
          OR vendor.name ILIKE :search
          OR CAST(expense.id AS TEXT) ILIKE :search)`,
        { search },
      );
    }

    if (query.categoryId) {
      qb.andWhere('expense.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.dateFrom) {
      qb.andWhere('expense.expenseDate >= :dateFrom', {
        dateFrom: query.dateFrom,
      });
    }

    if (query.dateTo) {
      qb.andWhere('expense.expenseDate <= :dateTo', {
        dateTo: query.dateTo,
      });
    }
  }

  private createSummaryQuery(query: QueryExpensesDto): SelectQueryBuilder<Expense> {
    const qb = this.expensesRepository.createQueryBuilder('expense');

    if (query.search?.trim()) {
      qb.leftJoin('expense.category', 'category');
      qb.leftJoin('expense.vendor', 'vendor');
    }

    this.applyFilters(qb, query);
    return qb;
  }

  private async computeSummary(query: QueryExpensesDto) {
    const today = toDateString(new Date());

    const todayResult: { total: string | null; count: string | null } | undefined =
      await this.createSummaryQuery({
        ...query,
        dateFrom: today,
        dateTo: today,
      })
        .select('COALESCE(SUM(expense.amount), 0)', 'total')
        .addSelect('COUNT(expense.id)', 'count')
        .getRawOne();

    const filteredResult: { total: string | null; count: string | null } | undefined =
      await this.createSummaryQuery(query)
        .select('COALESCE(SUM(expense.amount), 0)', 'total')
        .addSelect('COUNT(expense.id)', 'count')
        .getRawOne();

    return {
      todayAmount: Number(todayResult?.total ?? 0),
      todayCount: Number(todayResult?.count ?? 0),
      filteredAmount: Number(filteredResult?.total ?? 0),
      filteredCount: Number(filteredResult?.count ?? 0),
    };
  }

  private async ensureCategoriesExist(): Promise<void> {
    for (const name of DEFAULT_CATEGORIES) {
      const existing = await this.categoriesRepository.findOne({
        where: { name },
      });
      if (!existing) {
        await this.categoriesRepository.save(
          this.categoriesRepository.create({ name }),
        );
      }
    }
  }

  private async migrateLegacyCashExpenses(): Promise<void> {
    const miscCategory = await this.categoriesRepository.findOne({
      where: { name: 'Miscellaneous' },
    });
    const cashMethod = await this.paymentMethodsService.findByName('Cash');

    if (!miscCategory || !cashMethod) {
      return;
    }

    try {
      const legacyEntries: Array<{
        id: number;
        entry_date: string;
        amount: string;
        description: string;
        created_by_id: string | null;
      }> = await this.expensesRepository.query(`
        SELECT id, entry_date, amount, description, created_by_id
        FROM cash_entries
        WHERE type = 'expense'
          AND expense_id IS NULL
        ORDER BY id ASC
      `);

      if (!legacyEntries.length) {
        return;
      }

      for (const entry of legacyEntries) {
        const expense = await this.expensesRepository.save(
          this.expensesRepository.create({
            expenseDate: entry.entry_date,
            subtotal: Number(entry.amount),
            vatAmount: 0,
            amount: Number(entry.amount),
            includeVat: false,
            vatPercent: 5,
            description: entry.description,
            categoryId: miscCategory.id,
            paymentMethodId: cashMethod.id,
            vendorId: null,
            notes: null,
            createdById: entry.created_by_id,
          }),
        );

        await this.expensesRepository.query(
          `UPDATE cash_entries SET expense_id = $1 WHERE id = $2`,
          [expense.id, entry.id],
        );
      }

      this.logger.log(
        `Migrated ${legacyEntries.length} legacy cash expense(s) to expenses module`,
      );
    } catch (error) {
      this.logger.warn(
        `Skipping legacy cash expense migration: ${error instanceof Error ? error.message : error}`,
      );
    }
  }

  private async migrateExpenseVatFields(): Promise<void> {
    const result: Array<{ count: string }> = await this.expensesRepository.query(`
      WITH updated AS (
        UPDATE expenses
        SET subtotal = amount,
            vat_amount = 0,
            include_vat = false,
            vat_percent = 5
        WHERE subtotal = 0
          AND amount > 0
        RETURNING id
      )
      SELECT COUNT(*)::text AS count FROM updated
    `);

    const count = Number(result[0]?.count ?? 0);
    if (count) {
      this.logger.log(`Backfilled VAT fields on ${count} existing expense(s)`);
    }
  }
}

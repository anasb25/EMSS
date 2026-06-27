import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateCashEntryDto } from './dto/create-cash-entry.dto';
import { CreateOpeningBalanceDto } from './dto/create-opening-balance.dto';
import { UpdateCashEntryDto } from './dto/update-cash-entry.dto';
import {
  CashAccountType,
  CashEntry,
  CashEntryDirection,
  CashEntryType,
} from './entities/cash-entry.entity';
import {
  CashDayEntry,
  CashDaySummary,
} from './interfaces/cash-day-summary.interface';
import { CashPeriodSummary } from './interfaces/cash-period-summary.interface';

function toDateString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function resolveAccountName(entry: CashEntry): string | null {
  if (entry.accountType === CashAccountType.ACCOUNT) {
    return entry.ledgerAccount?.name ?? null;
  }
  if (entry.accountType === CashAccountType.VENDOR) {
    return entry.vendor?.name ?? null;
  }
  if (entry.accountType === CashAccountType.CUSTOMER) {
    return entry.customer?.name ?? null;
  }
  return null;
}

function applyAmountFields(
  entry: Partial<CashEntry>,
  cashIn: number,
  cashOut: number,
): void {
  entry.cashIn = cashIn;
  entry.cashOut = cashOut;
  if (cashIn > 0) {
    entry.direction = CashEntryDirection.IN;
    entry.amount = cashIn;
  } else if (cashOut > 0) {
    entry.direction = CashEntryDirection.OUT;
    entry.amount = cashOut;
  } else {
    entry.direction = CashEntryDirection.OUT;
    entry.amount = 0;
  }
}

@Injectable()
export class CashService implements OnModuleInit {
  private readonly logger = new Logger(CashService.name);

  constructor(
    @InjectRepository(CashEntry)
    private readonly cashEntriesRepository: Repository<CashEntry>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.removeLegacyLinkedEntries();
    await this.backfillCashAmountColumns();
  }

  async getDaySummary(date: string): Promise<CashDaySummary> {
    const summary = await this.getSummary({ dateFrom: date, dateTo: date });

    return {
      date,
      openingBalance: summary.openingBalance,
      totalIn: summary.totalIn,
      totalOut: summary.totalOut,
      closingBalance: summary.closingBalance,
      hasOpeningBalance: summary.hasOpeningBalance,
      entries: summary.entries.map((entry, index) => ({
        ...entry,
        serialNo: index + 1,
        accountName: resolveAccountName(entry),
      })),
    };
  }

  async getSummary(query: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<CashPeriodSummary> {
    const today = toDateString(new Date());
    const hasOpeningBalance = await this.cashEntriesRepository.exists({
      where: { type: CashEntryType.OPENING_ADJUSTMENT },
    });

    const qb = this.createEntryQueryBuilder().andWhere('entry.type = :type', {
      type: CashEntryType.MANUAL,
    });

    if (query.dateFrom) {
      qb.andWhere('entry.entryDate >= :dateFrom', {
        dateFrom: query.dateFrom,
      });
    }

    if (query.dateTo) {
      qb.andWhere('entry.entryDate <= :dateTo', { dateTo: query.dateTo });
    }

    const entries = await qb
      .orderBy('entry.entryDate', 'ASC')
      .addOrderBy('entry.createdAt', 'ASC')
      .addOrderBy('entry.id', 'ASC')
      .getMany();

    const balanceStartDate =
      query.dateFrom ?? entries[0]?.entryDate ?? today;
    const openingBalance = await this.computeBalanceBeforeDate(balanceStartDate);

    let runningBalance = openingBalance;
    let totalIn = 0;
    let totalOut = 0;
    let todayIn = 0;
    let todayOut = 0;

    const entriesWithBalance: CashDayEntry[] = entries.map((entry) => {
      const cashIn = Number(entry.cashIn);
      const cashOut = Number(entry.cashOut);
      totalIn += cashIn;
      totalOut += cashOut;
      runningBalance += cashIn - cashOut;

      if (entry.entryDate === today) {
        todayIn += cashIn;
        todayOut += cashOut;
      }

      return {
        ...entry,
        runningBalance,
        accountName: resolveAccountName(entry),
      };
    });

    return {
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      todayIn,
      todayOut,
      openingBalance,
      totalIn,
      totalOut,
      closingBalance: openingBalance + totalIn - totalOut,
      hasOpeningBalance,
      entries: entriesWithBalance,
    };
  }

  async createManualEntry(
    dto: CreateCashEntryDto,
    createdById: string,
  ): Promise<CashEntry> {
    const cashIn = Number(dto.cashIn ?? 0);
    const cashOut = Number(dto.cashOut ?? 0);

    if ((cashIn > 0 && cashOut > 0) || (cashIn <= 0 && cashOut <= 0)) {
      throw new BadRequestException(
        'Enter either a cash in or cash out amount, not both.',
      );
    }

    const accountFields = this.resolveAccountFields(dto);
    const entry = this.cashEntriesRepository.create({
      entryDate: dto.entryDate,
      type: CashEntryType.MANUAL,
      description: dto.description.trim(),
      salesPersonName: dto.salesPersonName?.trim() || null,
      remarks: dto.remarks?.trim() || null,
      createdById,
      ...accountFields,
    });

    applyAmountFields(entry, cashIn, cashOut);

    const saved = await this.cashEntriesRepository.save(entry);
    return this.findOne(saved.id);
  }

  async updateManualEntry(
    id: number,
    dto: UpdateCashEntryDto,
  ): Promise<CashEntry> {
    const entry = await this.cashEntriesRepository.findOne({ where: { id } });

    if (!entry) {
      throw new NotFoundException(`Cash entry #${id} not found`);
    }

    if (entry.type !== CashEntryType.MANUAL) {
      throw new BadRequestException(
        'Only manual cash book rows can be edited here.',
      );
    }

    if (dto.entryDate !== undefined) {
      entry.entryDate = dto.entryDate;
    }

    if (dto.description !== undefined) {
      entry.description = dto.description.trim();
    }

    if (dto.salesPersonName !== undefined) {
      entry.salesPersonName = dto.salesPersonName.trim() || null;
    }

    if (dto.remarks !== undefined) {
      entry.remarks = dto.remarks.trim() || null;
    }

    const cashIn =
      dto.cashIn !== undefined ? Number(dto.cashIn) : Number(entry.cashIn);
    const cashOut =
      dto.cashOut !== undefined ? Number(dto.cashOut) : Number(entry.cashOut);

    if ((cashIn > 0 && cashOut > 0) || (cashIn <= 0 && cashOut <= 0)) {
      throw new BadRequestException(
        'Enter either a cash in or cash out amount, not both.',
      );
    }

    applyAmountFields(entry, cashIn, cashOut);

    if (
      dto.accountType !== undefined ||
      dto.ledgerAccountId !== undefined ||
      dto.vendorId !== undefined ||
      dto.customerId !== undefined
    ) {
      Object.assign(
        entry,
        this.resolveAccountFields({
          accountType: dto.accountType ?? entry.accountType ?? undefined,
          ledgerAccountId: dto.ledgerAccountId ?? entry.ledgerAccountId ?? undefined,
          vendorId: dto.vendorId ?? entry.vendorId ?? undefined,
          customerId: dto.customerId ?? entry.customerId ?? undefined,
        }),
      );
    }

    await this.cashEntriesRepository.save(entry);
    return this.findOne(entry.id);
  }

  async deleteManualEntry(id: number): Promise<void> {
    const entry = await this.cashEntriesRepository.findOne({ where: { id } });

    if (!entry) {
      throw new NotFoundException(`Cash entry #${id} not found`);
    }

    if (entry.type !== CashEntryType.MANUAL) {
      throw new BadRequestException(
        'Only manual cash book rows can be deleted here.',
      );
    }

    await this.cashEntriesRepository.remove(entry);
  }

  async createOpeningBalance(
    dto: CreateOpeningBalanceDto,
    createdById: string,
  ): Promise<CashEntry> {
    const existingOpening = await this.cashEntriesRepository.findOne({
      where: { type: CashEntryType.OPENING_ADJUSTMENT },
    });

    if (existingOpening) {
      throw new BadRequestException(
        'Opening balance is already set. Adjust past entries or contact an administrator.',
      );
    }

    const priorBalance = await this.computeBalanceBeforeDate(dto.entryDate);
    if (priorBalance !== 0) {
      throw new BadRequestException(
        'Cannot set opening balance when cash entries already exist before this date.',
      );
    }

    const entry = this.cashEntriesRepository.create({
      entryDate: dto.entryDate,
      type: CashEntryType.OPENING_ADJUSTMENT,
      description: dto.notes?.trim() || 'Opening balance',
      createdById,
    });

    applyAmountFields(entry, Number(dto.amount), 0);

    const saved = await this.cashEntriesRepository.save(entry);
    return this.findOne(saved.id);
  }

  private resolveAccountFields(
    dto: Pick<
      CreateCashEntryDto,
      'accountType' | 'ledgerAccountId' | 'vendorId' | 'customerId'
    >,
  ): Pick<
    CashEntry,
    'accountType' | 'ledgerAccountId' | 'vendorId' | 'customerId'
  > {
    if (!dto.accountType) {
      return {
        accountType: null,
        ledgerAccountId: null,
        vendorId: null,
        customerId: null,
      };
    }

    if (dto.accountType === CashAccountType.ACCOUNT) {
      if (!dto.ledgerAccountId) {
        throw new BadRequestException('Select an account.');
      }
      return {
        accountType: CashAccountType.ACCOUNT,
        ledgerAccountId: dto.ledgerAccountId,
        vendorId: null,
        customerId: null,
      };
    }

    if (dto.accountType === CashAccountType.VENDOR) {
      if (!dto.vendorId) {
        throw new BadRequestException('Select a vendor.');
      }
      return {
        accountType: CashAccountType.VENDOR,
        ledgerAccountId: null,
        vendorId: dto.vendorId,
        customerId: null,
      };
    }

    if (!dto.customerId) {
      throw new BadRequestException('Select a customer.');
    }

    return {
      accountType: CashAccountType.CUSTOMER,
      ledgerAccountId: null,
      vendorId: null,
      customerId: dto.customerId,
    };
  }

  private createEntryQueryBuilder() {
    return this.cashEntriesRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.ledgerAccount', 'ledgerAccount')
      .leftJoinAndSelect('entry.vendor', 'vendor')
      .leftJoinAndSelect('entry.customer', 'customer')
      .leftJoin('entry.createdBy', 'createdBy')
      .addSelect(['createdBy.id', 'createdBy.username']);
  }

  private async findOne(id: number): Promise<CashEntry> {
    const entry = await this.createEntryQueryBuilder()
      .where('entry.id = :id', { id })
      .getOne();

    if (!entry) {
      throw new NotFoundException(`Cash entry #${id} not found`);
    }

    return entry;
  }

  private async computeBalanceBeforeDate(date: string): Promise<number> {
    const result: { balance: string | null } | undefined =
      await this.cashEntriesRepository
        .createQueryBuilder('entry')
        .select(
          `COALESCE(SUM(entry.cash_in), 0) - COALESCE(SUM(entry.cash_out), 0)`,
          'balance',
        )
        .where('entry.entryDate < :date', { date })
        .andWhere('entry.type IN (:...types)', {
          types: [CashEntryType.MANUAL, CashEntryType.OPENING_ADJUSTMENT],
        })
        .getRawOne();

    return Number(result?.balance ?? 0);
  }

  private async backfillCashAmountColumns(): Promise<void> {
    await this.cashEntriesRepository.query(`
      UPDATE cash_entries
      SET
        cash_in = CASE WHEN direction = 'in' THEN amount ELSE 0 END,
        cash_out = CASE WHEN direction = 'out' THEN amount ELSE 0 END
      WHERE cash_in IS NULL OR cash_out IS NULL OR (cash_in = 0 AND cash_out = 0 AND amount > 0)
    `);
  }

  private async removeLegacyLinkedEntries(): Promise<void> {
    const result = await this.cashEntriesRepository.delete({
      type: In([
        CashEntryType.EXPENSE,
        CashEntryType.VENDOR_PAYMENT,
      ]),
    });

    if (result.affected) {
      this.logger.log(
        `Removed ${result.affected} linked cash book row(s) from sales/purchases/expenses`,
      );
    }

    await this.cashEntriesRepository.query(`
      DELETE FROM cash_entries
      WHERE type = 'receipt'
    `);
  }
}

import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBankEntryDto } from './dto/create-bank-entry.dto';
import { UpdateBankEntryDto } from './dto/update-bank-entry.dto';
import {
  BankAccountType,
  BankEntry,
  BankEntryDirection,
  BankEntryType,
} from './entities/bank-entry.entity';
import {
  BankDayEntry,
  BankDaySummary,
} from './interfaces/bank-day-summary.interface';
import { BankPeriodSummary } from './interfaces/bank-period-summary.interface';

function toDateString(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function applyAmountFields(
  entry: Partial<BankEntry>,
  bankIn: number,
  bankOut: number,
): void {
  entry.bankIn = bankIn;
  entry.bankOut = bankOut;
  if (bankIn > 0) {
    entry.direction = BankEntryDirection.IN;
    entry.amount = bankIn;
  } else if (bankOut > 0) {
    entry.direction = BankEntryDirection.OUT;
    entry.amount = bankOut;
  } else {
    entry.direction = BankEntryDirection.OUT;
    entry.amount = 0;
  }
}

@Injectable()
export class BankService {
  constructor(
    @InjectRepository(BankEntry)
    private readonly bankEntriesRepository: Repository<BankEntry>,
  ) {}

  async getDaySummary(date: string): Promise<BankDaySummary> {
    const summary = await this.getSummary({ dateFrom: date, dateTo: date });

    return {
      date,
      openingBalance: summary.openingBalance,
      totalIn: summary.totalIn,
      totalOut: summary.totalOut,
      closingBalance: summary.closingBalance,
      entries: summary.entries.map((entry, index) => ({
        ...entry,
        serialNo: index + 1,
      })),
    };
  }

  async getSummary(query: {
    dateFrom?: string;
    dateTo?: string;
  }): Promise<BankPeriodSummary> {
    const today = toDateString(new Date());
    const balanceStartDate = query.dateFrom ?? today;
    const openingBalance = await this.computeBalanceBeforeDate(balanceStartDate);
    const entries = await this.loadManualEntries(query);

    let runningBalance = openingBalance;
    let totalIn = 0;
    let totalOut = 0;
    let todayIn = 0;
    let todayOut = 0;

    const entriesWithBalance: BankDayEntry[] = entries.map((entry) => {
      const bankIn = Number(entry.bankIn);
      const bankOut = Number(entry.bankOut);
      totalIn += bankIn;
      totalOut += bankOut;
      runningBalance += bankIn - bankOut;

      if (entry.entryDate === today) {
        todayIn += bankIn;
        todayOut += bankOut;
      }

      return {
        ...entry,
        runningBalance,
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
      entries: entriesWithBalance,
    };
  }

  async createManualEntry(
    dto: CreateBankEntryDto,
    createdById: string,
  ): Promise<BankEntry> {
    const bankIn = Number(dto.bankIn ?? 0);
    const bankOut = Number(dto.bankOut ?? 0);

    if ((bankIn > 0 && bankOut > 0) || (bankIn <= 0 && bankOut <= 0)) {
      throw new BadRequestException(
        'Enter either a bank in or bank out amount, not both.',
      );
    }

    const accountFields = this.resolveAccountFields(dto);
    const entry = this.bankEntriesRepository.create({
      entryDate: dto.entryDate,
      type: BankEntryType.MANUAL,
      description: dto.description.trim(),
      salesPersonName: dto.salesPersonName?.trim() || null,
      remarks: dto.remarks?.trim() || null,
      createdById,
      ...accountFields,
    });

    applyAmountFields(entry, bankIn, bankOut);

    const saved = await this.bankEntriesRepository.save(entry);
    return this.findOne(saved.id);
  }

  async updateManualEntry(
    id: number,
    dto: UpdateBankEntryDto,
  ): Promise<BankEntry> {
    const entry = await this.bankEntriesRepository.findOne({ where: { id } });

    if (!entry) {
      throw new NotFoundException(`Bank entry #${id} not found`);
    }

    if (entry.type !== BankEntryType.MANUAL) {
      throw new BadRequestException(
        'Only manual bank book rows can be edited here.',
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

    const bankIn =
      dto.bankIn !== undefined ? Number(dto.bankIn) : Number(entry.bankIn);
    const bankOut =
      dto.bankOut !== undefined ? Number(dto.bankOut) : Number(entry.bankOut);

    if ((bankIn > 0 && bankOut > 0) || (bankIn <= 0 && bankOut <= 0)) {
      throw new BadRequestException(
        'Enter either a bank in or bank out amount, not both.',
      );
    }

    applyAmountFields(entry, bankIn, bankOut);

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

    await this.bankEntriesRepository.save(entry);
    return this.findOne(entry.id);
  }

  async deleteManualEntry(id: number): Promise<void> {
    const entry = await this.bankEntriesRepository.findOne({ where: { id } });

    if (!entry) {
      throw new NotFoundException(`Bank entry #${id} not found`);
    }

    if (entry.type !== BankEntryType.MANUAL) {
      throw new BadRequestException(
        'Only manual bank book rows can be deleted here.',
      );
    }

    await this.bankEntriesRepository.remove(entry);
  }

  private async loadManualEntries(query: {
    dateFrom?: string;
    dateTo?: string;
    beforeDate?: string;
  }): Promise<BankDayEntry[]> {
    const qb = this.bankEntriesRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.ledgerAccount', 'ledgerAccount')
      .leftJoinAndSelect('entry.vendor', 'vendor')
      .leftJoinAndSelect('entry.customer', 'customer')
      .where('entry.type = :type', { type: BankEntryType.MANUAL });

    if (query.beforeDate) {
      qb.andWhere('entry.entryDate < :beforeDate', {
        beforeDate: query.beforeDate,
      });
    } else {
      if (query.dateFrom) {
        qb.andWhere('entry.entryDate >= :dateFrom', {
          dateFrom: query.dateFrom,
        });
      }

      if (query.dateTo) {
        qb.andWhere('entry.entryDate <= :dateTo', { dateTo: query.dateTo });
      }
    }

    const entries = await qb
      .orderBy('entry.entryDate', 'ASC')
      .addOrderBy('entry.createdAt', 'ASC')
      .addOrderBy('entry.id', 'ASC')
      .getMany();

    return entries.map((entry) => this.manualEntryToDayEntry(entry));
  }

  private manualEntryToDayEntry(entry: BankEntry): BankDayEntry {
    return {
      id: entry.id,
      entryDate: entry.entryDate,
      type: 'manual',
      bankIn: Number(entry.bankIn),
      bankOut: Number(entry.bankOut),
      description: entry.description,
      accountType: entry.accountType,
      ledgerAccountId: entry.ledgerAccountId,
      vendorId: entry.vendorId,
      customerId: entry.customerId,
      ledgerAccount: entry.ledgerAccount
        ? { id: entry.ledgerAccount.id, name: entry.ledgerAccount.name }
        : null,
      vendor: entry.vendor
        ? { id: entry.vendor.id, name: entry.vendor.name }
        : null,
      customer: entry.customer
        ? { id: entry.customer.id, name: entry.customer.name }
        : null,
      salesPersonName: entry.salesPersonName,
      remarks: entry.remarks,
      paymentMethod: null,
      createdAt: entry.createdAt,
    };
  }

  private resolveAccountFields(
    dto: Pick<
      CreateBankEntryDto,
      'accountType' | 'ledgerAccountId' | 'vendorId' | 'customerId'
    >,
  ): Pick<
    BankEntry,
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

    if (dto.accountType === BankAccountType.ACCOUNT) {
      if (!dto.ledgerAccountId) {
        throw new BadRequestException('Select an account.');
      }
      return {
        accountType: BankAccountType.ACCOUNT,
        ledgerAccountId: dto.ledgerAccountId,
        vendorId: null,
        customerId: null,
      };
    }

    if (dto.accountType === BankAccountType.VENDOR) {
      if (!dto.vendorId) {
        throw new BadRequestException('Select a vendor.');
      }
      return {
        accountType: BankAccountType.VENDOR,
        ledgerAccountId: null,
        vendorId: dto.vendorId,
        customerId: null,
      };
    }

    if (!dto.customerId) {
      throw new BadRequestException('Select a customer.');
    }

    return {
      accountType: BankAccountType.CUSTOMER,
      ledgerAccountId: null,
      vendorId: null,
      customerId: dto.customerId,
    };
  }

  private async findOne(id: number): Promise<BankEntry> {
    const entry = await this.bankEntriesRepository
      .createQueryBuilder('entry')
      .leftJoinAndSelect('entry.ledgerAccount', 'ledgerAccount')
      .leftJoinAndSelect('entry.vendor', 'vendor')
      .leftJoinAndSelect('entry.customer', 'customer')
      .where('entry.id = :id', { id })
      .getOne();

    if (!entry) {
      throw new NotFoundException(`Bank entry #${id} not found`);
    }

    return entry;
  }

  private async computeBalanceBeforeDate(date: string): Promise<number> {
    const priorEntries = await this.loadManualEntries({ beforeDate: date });

    return priorEntries.reduce(
      (balance, entry) => balance + Number(entry.bankIn) - Number(entry.bankOut),
      0,
    );
  }
}

import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLedgerAccountDto } from './dto/create-ledger-account.dto';
import { LedgerAccount } from './entities/ledger-account.entity';

const DEFAULT_LEDGER_ACCOUNTS = [
  { name: 'Cash on Hand', code: 'CASH' },
  { name: 'Petty Cash', code: 'PETTY' },
  { name: 'Office Expenses', code: 'OFFICE' },
  { name: 'Travel & Transport', code: 'TRAVEL' },
  { name: 'Utilities', code: 'UTIL' },
  { name: 'Sales Income', code: 'SALES' },
  { name: 'Miscellaneous', code: 'MISC' },
] as const;

@Injectable()
export class LedgerAccountsService implements OnModuleInit {
  private readonly logger = new Logger(LedgerAccountsService.name);

  constructor(
    @InjectRepository(LedgerAccount)
    private readonly ledgerAccountsRepository: Repository<LedgerAccount>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.ensureDefaultAccounts();
  }

  findAll(): Promise<LedgerAccount[]> {
    return this.ledgerAccountsRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async create(dto: CreateLedgerAccountDto): Promise<LedgerAccount> {
    const account = this.ledgerAccountsRepository.create({
      name: dto.name.trim(),
      code: dto.code?.trim() || null,
      isActive: dto.isActive ?? true,
    });

    return this.ledgerAccountsRepository.save(account);
  }

  async findOne(id: number): Promise<LedgerAccount> {
    const account = await this.ledgerAccountsRepository.findOne({
      where: { id },
    });

    if (!account) {
      throw new NotFoundException(`Ledger account #${id} not found`);
    }

    return account;
  }

  private async ensureDefaultAccounts(): Promise<void> {
    const count = await this.ledgerAccountsRepository.count();
    if (count > 0) {
      return;
    }

    for (const account of DEFAULT_LEDGER_ACCOUNTS) {
      await this.ledgerAccountsRepository.save(
        this.ledgerAccountsRepository.create({
          name: account.name,
          code: account.code,
          isActive: true,
        }),
      );
    }

    this.logger.log(
      `Seeded ${DEFAULT_LEDGER_ACCOUNTS.length} default ledger account(s)`,
    );
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LedgerAccount } from './entities/ledger-account.entity';
import { LedgerAccountsController } from './ledger-accounts.controller';
import { LedgerAccountsService } from './ledger-accounts.service';

@Module({
  imports: [TypeOrmModule.forFeature([LedgerAccount])],
  controllers: [LedgerAccountsController],
  providers: [LedgerAccountsService],
  exports: [LedgerAccountsService],
})
export class LedgerAccountsModule {}

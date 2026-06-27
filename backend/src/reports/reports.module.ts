import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BankEntry } from '../bank/entities/bank-entry.entity';
import { Bill } from '../bills/entities/bill.entity';
import { CashEntry } from '../cash/entities/cash-entry.entity';
import { Customer } from '../customers/entities/customer.entity';
import { Expense } from '../expenses/entities/expense.entity';
import { Invoice } from '../invoices/entities/invoice.entity';
import { JobCard } from '../job-cards/entities/job-card.entity';
import { Payable } from '../payables/entities/payable.entity';
import { Receivable } from '../receivables/entities/receivable.entity';
import { SalesEntry } from '../sales/entities/sales-entry.entity';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      Bill,
      Expense,
      SalesEntry,
      Payable,
      Receivable,
      CashEntry,
      BankEntry,
      Customer,
      JobCard,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}

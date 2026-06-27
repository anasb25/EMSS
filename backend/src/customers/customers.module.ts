import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Receivable } from '../receivables/entities/receivable.entity';
import { CustomerLedgerService } from './customer-ledger.service';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Customer, Receivable])],
  controllers: [CustomersController],
  providers: [CustomersService, CustomerLedgerService],
  exports: [CustomersService],
})
export class CustomersModule {}

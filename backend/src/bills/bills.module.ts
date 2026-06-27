import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PayablesModule } from '../payables/payables.module';
import { Vendor } from '../vendors/entities/vendor.entity';
import { BillsController } from './bills.controller';
import { BillsService } from './bills.service';
import { BillItem } from './entities/bill-item.entity';
import { Bill } from './entities/bill.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Bill, BillItem, Vendor]),
    PayablesModule,
  ],
  controllers: [BillsController],
  providers: [BillsService],
  exports: [BillsService],
})
export class BillsModule {}

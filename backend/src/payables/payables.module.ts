import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Bill } from '../bills/entities/bill.entity';
import { ReceivablesModule } from '../receivables/receivables.module';
import { Payable } from './entities/payable.entity';
import { PayablesController } from './payables.controller';
import { PayablesService } from './payables.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payable, Bill]),
    ReceivablesModule,
  ],
  controllers: [PayablesController],
  providers: [PayablesService],
  exports: [PayablesService],
})
export class PayablesModule {}

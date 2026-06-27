import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Invoice } from '../invoices/entities/invoice.entity';
import { SalesModule } from '../sales/sales.module';
import { ReceiptVoucher } from '../receipt-vouchers/entities/receipt-voucher.entity';
import { PaymentMethod } from './entities/payment-method.entity';
import { Receivable } from './entities/receivable.entity';
import { PaymentMethodsService } from './payment-methods.service';
import {
  PaymentMethodsController,
  ReceivablesController,
} from './receivables.controller';
import { ReceivablesService } from './receivables.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Receivable, PaymentMethod, Invoice, ReceiptVoucher]),
    SalesModule,
  ],
  controllers: [ReceivablesController, PaymentMethodsController],
  providers: [ReceivablesService, PaymentMethodsService],
  exports: [ReceivablesService, PaymentMethodsService],
})
export class ReceivablesModule {}

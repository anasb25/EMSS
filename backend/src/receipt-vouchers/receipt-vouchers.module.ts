import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReceiptVoucher } from './entities/receipt-voucher.entity';
import { ReceiptVouchersController } from './receipt-vouchers.controller';
import { ReceiptVouchersService } from './receipt-vouchers.service';

@Module({
  imports: [TypeOrmModule.forFeature([ReceiptVoucher])],
  controllers: [ReceiptVouchersController],
  providers: [ReceiptVouchersService],
  exports: [ReceiptVouchersService],
})
export class ReceiptVouchersModule {}

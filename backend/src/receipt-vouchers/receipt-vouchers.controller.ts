import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryReceiptVouchersDto } from './dto/query-receipt-vouchers.dto';
import { ReceiptVouchersService } from './receipt-vouchers.service';

@UseGuards(JwtAuthGuard)
@Controller('receipt-vouchers')
export class ReceiptVouchersController {
  constructor(
    private readonly receiptVouchersService: ReceiptVouchersService,
  ) {}

  @Get()
  findAll(@Query() query: QueryReceiptVouchersDto) {
    return this.receiptVouchersService.findAll(query);
  }

  @Get('by-receivable/:receivableId')
  findByReceivable(@Param('receivableId', ParseIntPipe) receivableId: number) {
    return this.receiptVouchersService.findByReceivableId(receivableId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.receiptVouchersService.findOne(id);
  }
}

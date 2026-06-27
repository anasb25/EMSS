import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUserPayload } from '../auth/auth.service';
import { CreateReceivableDto } from './dto/create-receivable.dto';
import { QueryReceivablesDto } from './dto/query-receivables.dto';
import { RecordReceiptDto } from './dto/record-receipt.dto';
import { PaymentMethodsService } from './payment-methods.service';
import { ReceivablesService } from './receivables.service';

@UseGuards(JwtAuthGuard)
@Controller('receivables')
export class ReceivablesController {
  constructor(private readonly receivablesService: ReceivablesService) {}

  @Post()
  create(
    @Body() createReceivableDto: CreateReceivableDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.receivablesService.create(createReceivableDto, user.id);
  }

  @Get()
  findAll(@Query() query: QueryReceivablesDto) {
    return this.receivablesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.receivablesService.findOne(id);
  }

  @Patch(':id/record-receipt')
  recordReceipt(
    @Param('id', ParseIntPipe) id: number,
    @Body() recordReceiptDto: RecordReceiptDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.receivablesService.recordReceipt(
      id,
      recordReceiptDto,
      user.id,
    );
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.receivablesService.remove(id);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('payment-methods')
export class PaymentMethodsController {
  constructor(private readonly paymentMethodsService: PaymentMethodsService) {}

  @Get()
  findAll() {
    return this.paymentMethodsService.findAll();
  }
}

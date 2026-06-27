import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUserPayload } from '../auth/auth.service';
import { CreatePayableDto } from './dto/create-payable.dto';
import { QueryPayablesDto } from './dto/query-payables.dto';
import { RecordPaymentDto } from './dto/record-payment.dto';
import { PayablesService } from './payables.service';

@UseGuards(JwtAuthGuard)
@Controller('payables')
export class PayablesController {
  constructor(private readonly payablesService: PayablesService) {}

  @Post()
  create(
    @Body() createPayableDto: CreatePayableDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.payablesService.create(createPayableDto, user.id);
  }

  @Get()
  findAll(@Query() query: QueryPayablesDto) {
    return this.payablesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.payablesService.findOne(id);
  }

  @Patch(':id/record-payment')
  recordPayment(
    @Param('id', ParseIntPipe) id: number,
    @Body() recordPaymentDto: RecordPaymentDto,
  ) {
    return this.payablesService.recordPayment(id, recordPaymentDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.payablesService.remove(id);
  }
}

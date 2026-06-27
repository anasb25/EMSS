import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CustomerLedgerService } from './customer-ledger.service';
import { CustomersService } from './customers.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { QueryCustomerLedgerDto } from './dto/query-customer-ledger.dto';
import { QueryCustomerLedgerSummaryDto } from './dto/query-customer-ledger-summary.dto';
import { QueryCustomersDto } from './dto/query-customers.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(
    private readonly customersService: CustomersService,
    private readonly customerLedgerService: CustomerLedgerService,
  ) {}

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    return this.customersService.create(createCustomerDto);
  }

  @Get()
  findAll(@Query() query: QueryCustomersDto) {
    return this.customersService.findAll(query);
  }

  @Get('ledger-summary')
  findLedgerSummary(@Query() query: QueryCustomerLedgerSummaryDto) {
    return this.customerLedgerService.getLedgerSummary(query);
  }

  @Get(':id/ledger')
  findLedger(
    @Param('id') id: string,
    @Query() query: QueryCustomerLedgerDto,
  ) {
    return this.customerLedgerService.getLedger(id, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.customersService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCustomerDto: UpdateCustomerDto) {
    return this.customersService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.customersService.remove(id);
  }
}

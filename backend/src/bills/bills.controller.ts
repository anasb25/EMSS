import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUserPayload } from '../auth/auth.service';
import { BillsService } from './bills.service';
import { CreateBillDto } from './dto/create-bill.dto';
import { QueryBillsDto } from './dto/query-bills.dto';

@UseGuards(JwtAuthGuard)
@Controller('bills')
export class BillsController {
  constructor(private readonly billsService: BillsService) {}

  @Post()
  create(
    @Body() createBillDto: CreateBillDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.billsService.create(createBillDto, user.id);
  }

  @Get()
  findAll(@Query() query: QueryBillsDto) {
    return this.billsService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.billsService.findOne(id);
  }
}

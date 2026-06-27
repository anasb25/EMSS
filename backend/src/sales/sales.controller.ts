import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryDateRangeDto } from '../common/dto/query-date-range.dto';
import { QuerySalesDayDto } from './dto/query-sales-day.dto';
import { SalesService } from './sales.service';

@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Get('summary')
  getSummary(@Query() query: QueryDateRangeDto) {
    return this.salesService.getSummary(query);
  }

  @Get('day')
  getDaySummary(@Query() query: QuerySalesDayDto) {
    return this.salesService.getDaySummary(query.date);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.salesService.findOne(id);
  }
}

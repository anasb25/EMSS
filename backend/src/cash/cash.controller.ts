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
import { CashService } from './cash.service';
import { CreateCashEntryDto } from './dto/create-cash-entry.dto';
import { CreateOpeningBalanceDto } from './dto/create-opening-balance.dto';
import { UpdateCashEntryDto } from './dto/update-cash-entry.dto';
import { QueryDateRangeDto } from '../common/dto/query-date-range.dto';
import { QueryCashDayDto } from './dto/query-cash-day.dto';

@UseGuards(JwtAuthGuard)
@Controller('cash')
export class CashController {
  constructor(private readonly cashService: CashService) {}

  @Get('summary')
  getSummary(@Query() query: QueryDateRangeDto) {
    return this.cashService.getSummary(query);
  }

  @Get('day')
  getDaySummary(@Query() query: QueryCashDayDto) {
    return this.cashService.getDaySummary(query.date);
  }

  @Post('entries')
  createEntry(
    @Body() dto: CreateCashEntryDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.cashService.createManualEntry(dto, user.id);
  }

  @Patch('entries/:id')
  updateEntry(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCashEntryDto,
  ) {
    return this.cashService.updateManualEntry(id, dto);
  }

  @Delete('entries/:id')
  deleteEntry(@Param('id', ParseIntPipe) id: number) {
    return this.cashService.deleteManualEntry(id);
  }

  @Post('opening-balance')
  createOpeningBalance(
    @Body() dto: CreateOpeningBalanceDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.cashService.createOpeningBalance(dto, user.id);
  }
}

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
import { QueryDateRangeDto } from '../common/dto/query-date-range.dto';
import { BankService } from './bank.service';
import { CreateBankEntryDto } from './dto/create-bank-entry.dto';
import { QueryBankDayDto } from './dto/query-bank-day.dto';
import { UpdateBankEntryDto } from './dto/update-bank-entry.dto';

@UseGuards(JwtAuthGuard)
@Controller('bank')
export class BankController {
  constructor(private readonly bankService: BankService) {}

  @Get('summary')
  getSummary(@Query() query: QueryDateRangeDto) {
    return this.bankService.getSummary(query);
  }

  @Get('day')
  getDaySummary(@Query() query: QueryBankDayDto) {
    return this.bankService.getDaySummary(query.date);
  }

  @Post('entries')
  createEntry(
    @Body() dto: CreateBankEntryDto,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.bankService.createManualEntry(dto, user.id);
  }

  @Patch('entries/:id')
  updateEntry(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateBankEntryDto,
  ) {
    return this.bankService.updateManualEntry(id, dto);
  }

  @Delete('entries/:id')
  deleteEntry(@Param('id', ParseIntPipe) id: number) {
    return this.bankService.deleteManualEntry(id);
  }
}

import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateLedgerAccountDto } from './dto/create-ledger-account.dto';
import { LedgerAccountsService } from './ledger-accounts.service';

@UseGuards(JwtAuthGuard)
@Controller('ledger-accounts')
export class LedgerAccountsController {
  constructor(private readonly ledgerAccountsService: LedgerAccountsService) {}

  @Get()
  findAll() {
    return this.ledgerAccountsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateLedgerAccountDto) {
    return this.ledgerAccountsService.create(dto);
  }
}

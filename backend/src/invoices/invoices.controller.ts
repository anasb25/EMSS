import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUserPayload } from '../auth/auth.service';
import { QueryInvoicesDto } from './dto/query-invoices.dto';
import { InvoicesService } from './invoices.service';

@UseGuards(JwtAuthGuard)
@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Get()
  findAll(@Query() query: QueryInvoicesDto) {
    return this.invoicesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Post('from-job-card/:jobCardId')
  createFromJobCard(
    @Param('jobCardId') jobCardId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.invoicesService.createFromJobCard(jobCardId, user.id);
  }
}

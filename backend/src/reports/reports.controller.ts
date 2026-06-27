import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { QueryAccountingDashboardDto } from './dto/query-accounting-dashboard.dto';
import { QueryBalanceSheetDto } from './dto/query-balance-sheet.dto';
import { QueryDateRangeDto } from './dto/query-date-range.dto';
import { QueryProfitLossDto } from './dto/query-profit-loss.dto';
import { QueryVatReportDto } from './dto/query-vat-report.dto';
import { ReportsService } from './reports.service';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('main-dashboard')
  getMainDashboard() {
    return this.reportsService.getMainDashboard();
  }

  @Get('accounting-dashboard')
  getAccountingDashboard(@Query() query: QueryAccountingDashboardDto) {
    return this.reportsService.getAccountingDashboard(query);
  }

  @Get('profit-loss')
  getProfitLoss(@Query() query: QueryProfitLossDto) {
    return this.reportsService.getProfitLoss(query);
  }

  @Get('vat')
  getVatReport(@Query() query: QueryVatReportDto) {
    return this.reportsService.getVatReport(query);
  }

  @Get('sales-analytics')
  getSalesAnalytics(@Query() query: QueryDateRangeDto) {
    return this.reportsService.getSalesAnalytics(query);
  }

  @Get('purchases-analytics')
  getPurchasesAnalytics(@Query() query: QueryDateRangeDto) {
    return this.reportsService.getPurchasesAnalytics(query);
  }

  @Get('balance-sheet')
  getBalanceSheet(@Query() query: QueryBalanceSheetDto) {
    return this.reportsService.getBalanceSheet(query);
  }
}

import { Controller, Get, Query } from '@nestjs/common';
import { ReportService } from './report.service';

@Controller('api/reports')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('revenue-by-payment')
  getRevenueByPayment(@Query('months') months?: string) {
    const m = months ? parseInt(months, 10) : 12;
    return this.reportService.getRevenueByPaymentMethod(m);
  }

  @Get('passenger-age-distribution')
  getAgeDistribution(
    @Query('routeId') routeId?: string,
    @Query('months') months?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportService.getPassengerAgeDistribution(
      routeId ? +routeId : undefined,
      months ? +months : undefined,
      startDate,
      endDate,
    );
  }

  @Get('incident-trends')
  getIncidentTrends(
    @Query('months') months?: string,
    @Query('companyId') companyId?: string,
  ) {
    return this.reportService.getIncidentTrends(
      months ? +months : 12,
      companyId ? +companyId : undefined,
    );
  }
}

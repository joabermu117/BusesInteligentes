import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { TrackingService } from './tracking.service';

@Controller('api/tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  /**
   * POST /api/tracking/gps-update
   * Receives GPS updates from bus devices/drivers
   */
  @Post('gps-update')
  async updateGps(
    @Body()
    data: {
      busId: number;
      latitude: number;
      longitude: number;
      speed?: number;
    },
  ) {
    await this.trackingService.processGpsUpdate(data);
    return { success: true };
  }

  /**
   * GET /api/tracking/active-buses
   * Returns all active buses with their current locations
   */
  @Get('active-buses')
  async getActiveBuses() {
    return this.trackingService.getActiveBuses();
  }

  /**
   * GET /api/tracking/eta/:busId/stop/:stopId
   * Calculate ETA from a bus to a specific stop
   */
  @Get('eta/:busId/stop/:stopId')
  async getETA(
    @Param('busId') busId: string,
    @Param('stopId') stopId: string,
  ) {
    return this.trackingService.calculateETA(+busId, +stopId);
  }

  /**
   * GET /api/tracking/eta/:busId/route/:routeId
   * Calculate ETA from a bus to all stops on a route
   */
  @Get('eta/:busId/route/:routeId')
  async getRouteETA(
    @Param('busId') busId: string,
    @Param('routeId') routeId: string,
  ) {
    return this.trackingService.calculateAllStopsETA(+busId, +routeId);
  }
}

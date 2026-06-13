import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { ProximityService } from './proximity.service';

@Controller('api/proximity')
export class ProximityController {
  constructor(private readonly proximityService: ProximityService) {}

  /**
   * POST /api/proximity/subscribe
   * Subscribe to bus proximity notifications
   */
  @Post('subscribe')
  subscribe(
    @Body()
    data: {
      citizenId: string;
      routeId: number;
      stopId: number;
      notificationMinutes: number;
    },
  ) {
    return this.proximityService.subscribe(data);
  }

  /**
   * DELETE /api/proximity/unsubscribe/:id
   * Unsubscribe from proximity notifications
   */
  @Delete('unsubscribe/:id')
  unsubscribe(@Param('id') id: string) {
    return { success: this.proximityService.unsubscribe(+id) };
  }

  /**
   * GET /api/proximity/subscriptions/:citizenId
   * Get all active subscriptions for a citizen
   */
  @Get('subscriptions/:citizenId')
  getSubscriptions(@Param('citizenId') citizenId: string) {
    return this.proximityService.getSubscriptionsByCitizen(citizenId);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Gps } from '../../gps/entities/gps.entity';
import { Bus } from '../../buses/entities/bus.entity';
import { Shift } from '../../shifts/entities/shift.entity';
import { Route } from '../../route/entities/route.entity';
import { RouteStop } from '../../routes-stops/entities/route-stop.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';
import { TrackingGateway } from './tracking.gateway';

export interface ProximitySubscription {
  id: number;
  citizenId: string;
  routeId: number;
  stopId: number;
  notificationMinutes: number;
  busId?: number;
  active: boolean;
  createdAt: Date;
}

// In-memory store for proximity subscriptions
// In production, this should be stored in the database
const subscriptions: Map<number, ProximitySubscription> = new Map();
let subscriptionIdCounter = 1;

@Injectable()
export class ProximityService {
  private readonly logger = new Logger(ProximityService.name);

  constructor(
    @InjectRepository(Gps)
    private readonly gpsRepository: Repository<Gps>,
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
    @InjectRepository(Shift)
    private readonly shiftRepository: Repository<Shift>,
    @InjectRepository(Schedule)
    private readonly scheduleRepository: Repository<Schedule>,
    @InjectRepository(RouteStop)
    private readonly routeStopRepository: Repository<RouteStop>,
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    private readonly trackingGateway: TrackingGateway,
  ) {}

  /**
   * Create a proximity notification subscription
   */
  subscribe(data: {
    citizenId: string;
    routeId: number;
    stopId: number;
    notificationMinutes: number;
  }): ProximitySubscription {
    const id = subscriptionIdCounter++;
    const subscription: ProximitySubscription = {
      id,
      citizenId: data.citizenId,
      routeId: data.routeId,
      stopId: data.stopId,
      notificationMinutes: data.notificationMinutes,
      active: true,
      createdAt: new Date(),
    };
    subscriptions.set(id, subscription);
    this.logger.log(
      `Nueva suscripción de proximidad #${id} para ciudadano ${data.citizenId} en ruta #${data.routeId}, paradero #${data.stopId}`,
    );
    return subscription;
  }

  /**
   * Unsubscribe from proximity notifications
   */
  unsubscribe(id: number): boolean {
    const sub = subscriptions.get(id);
    if (sub) {
      sub.active = false;
      subscriptions.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Get all subscriptions for a citizen
   */
  getSubscriptionsByCitizen(citizenId: string): ProximitySubscription[] {
    return Array.from(subscriptions.values()).filter(
      (s) => s.citizenId === citizenId && s.active,
    );
  }

  /**
   * Get all active subscriptions
   */
  getAllActiveSubscriptions(): ProximitySubscription[] {
    return Array.from(subscriptions.values()).filter((s) => s.active);
  }

  /**
   * Check proximity for all active subscriptions (runs every 30 seconds)
   */
  @Cron('*/30 * * * * *')
  async checkProximity(): Promise<void> {
    const activeSubs = this.getAllActiveSubscriptions();
    if (activeSubs.length === 0) return;

    for (const sub of activeSubs) {
      await this.evaluateSubscription(sub);
    }
  }

  private async evaluateSubscription(sub: ProximitySubscription): Promise<void> {
    try {
      // Find active buses on the route
      const activeShifts = await this.shiftRepository.find({
        where: { status: 'in_progress' },
        relations: ['bus', 'bus.gps'],
      });

      // Also include simulated buses (GPS active, no shift) that have route info
      const simulatedBuses = await this.gpsRepository.find({
        where: { active: true },
        relations: ['bus'],
      });

      const allCandidates: Array<{ busId: number; plate: string; lat: number; lng: number; routeId?: number }> = [];

      // Buses with active shifts
      for (const shift of activeShifts) {
        if (!shift.bus?.gps?.latitude || !shift.bus?.gps?.longitude) continue;
        if (!shift.bus.gps.active) continue;

        const schedule = await this.scheduleRepository.findOne({
          where: { bus: { id: shift.bus.id }, status: 'in_progress' },
          relations: ['route'],
        });

        allCandidates.push({
          busId: shift.bus.id!,
          plate: shift.bus.plate ?? `Bus #${shift.bus.id}`,
          lat: Number(shift.bus.gps.latitude),
          lng: Number(shift.bus.gps.longitude),
          routeId: schedule?.route?.id,
        });
      }

      // Simulated buses (without shift) — for academic demo
      for (const gps of simulatedBuses) {
        if (!gps.bus || !gps.latitude || !gps.longitude) continue;
        if (activeShifts.some((s) => s.bus?.id === gps.bus!.id)) continue;
        // For simulated buses we check all routes since we don't have a schedule
        allCandidates.push({
          busId: gps.bus.id!,
          plate: gps.bus.plate ?? `Bus #${gps.bus.id}`,
          lat: Number(gps.latitude),
          lng: Number(gps.longitude),
          routeId: undefined, // unknown — will check all route stops
        });
      }

      for (const candidate of allCandidates) {
        // If bus has a known route and it doesn't match the subscription, skip
        if (candidate.routeId !== undefined && candidate.routeId !== sub.routeId) continue;

        // Get stop coordinates
        const routeStop = await this.routeStopRepository.findOne({
          where: { route_id: sub.routeId, stop_id: sub.stopId },
          relations: ['stop'],
        });
        if (!routeStop?.stop?.latitude || !routeStop?.stop?.longitude) continue;

        // Get route name
        const route = await this.routeRepository.findOne({
          where: { id: sub.routeId },
        });
        const routeName = route?.name ?? `Ruta #${sub.routeId}`;

        // Calculate distance
        const distance = this.haversineDistance(
          candidate.lat,
          candidate.lng,
          Number(routeStop.stop.latitude),
          Number(routeStop.stop.longitude),
        );

        // Average city speed 20 km/h => time in minutes
        const estimatedMinutes = Math.round((distance / 20) * 60);

        // If bus is within the configured notification window
        if (estimatedMinutes <= sub.notificationMinutes && estimatedMinutes > 0) {
          this.logger.log(
            `Bus ${candidate.plate} está a ~${estimatedMinutes} min del paradero #${sub.stopId} para ciudadano ${sub.citizenId}`,
          );

          // Send proximity notification via WebSocket
          this.trackingGateway.sendProximityNotification(sub.citizenId, {
            busId: candidate.busId,
            plate: candidate.plate,
            routeName,
            estimatedMinutes,
            stopName: routeStop.stop.name ?? `Paradero #${sub.stopId}`,
          });

          // Deactivate subscription after notification to avoid spamming
          sub.active = false;
          subscriptions.delete(sub.id);
        }
      }
    } catch (error) {
      this.logger.error(
        `Error evaluating proximity subscription #${sub.id}: ${error}`,
      );
    }
  }

  private haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }
}

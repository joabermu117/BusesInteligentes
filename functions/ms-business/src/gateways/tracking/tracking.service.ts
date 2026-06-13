import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Gps } from '../../gps/entities/gps.entity';
import { Bus } from '../../buses/entities/bus.entity';
import { Shift } from '../../shifts/entities/shift.entity';
import { TrackingGateway } from './tracking.gateway';
import { Route } from '../../route/entities/route.entity';
import { RouteStop } from '../../routes-stops/entities/route-stop.entity';
import { Schedule } from '../../schedules/entities/schedule.entity';

export interface BusLocationData {
  busId: number;
  plate: string;
  latitude: number;
  longitude: number;
  lastUpdate: Date;
  speed?: number;
  routeId?: number;
  routeName?: string;
  currentStopId?: number;
  currentStopName?: string;
  passengers?: number;
  status: string;
}

@Injectable()
export class TrackingService {
  private readonly logger = new Logger(TrackingService.name);

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
    private readonly trackingGateway: TrackingGateway,
  ) {}

  /**
   * Processes a GPS update from a bus (sent by the driver's device)
   * and broadcasts the new location via WebSocket
   */
  async processGpsUpdate(data: {
    busId: number;
    latitude: number;
    longitude: number;
    speed?: number;
    routeId?: number;
    routeName?: string;
  }): Promise<void> {
    const bus = await this.busRepository.findOne({
      where: { id: data.busId },
      relations: ['gps', 'company'],
    });

    if (!bus || !bus.gps) {
      this.logger.warn(`Bus #${data.busId} not found or has no GPS`);
      return;
    }

    // Update GPS location
    bus.gps.latitude = data.latitude;
    bus.gps.longitude = data.longitude;
    bus.gps.lastUpdate = new Date();
    bus.gps.active = true;
    await this.gpsRepository.save(bus.gps);

    // Get active shift to determine route and passengers
    const activeShift = await this.shiftRepository.findOne({
      where: { bus: { id: data.busId }, status: 'in_progress' },
    });

    // Get route info — prioritise explicit routeId from simulator, then resolve from schedule
    let routeId: number | undefined = data.routeId;
    let routeName: string | undefined = data.routeName;
    if (!routeId && activeShift) {
      const schedule = await this.scheduleRepository.findOne({
        where: { bus: { id: data.busId }, status: 'in_progress' },
        relations: ['route'],
      });
      if (schedule?.route) {
        routeId = schedule.route.id;
        routeName = schedule.route.name;
      }
    }

    // Find nearest stop on route
    const nearestStop = routeId
      ? await this.findNearestStop(data.latitude, data.longitude, routeId)
      : null;

    // Calculate status (delayed/normal)
    const status = await this.calculateBusStatus(
      data.busId,
      routeId,
      data.latitude,
      data.longitude,
    );

    // Count passengers (tickets with status 'issued' for active schedules)
    const passengers = await this.countPassengers(data.busId);

    const locationUpdate: BusLocationData = {
      busId: data.busId,
      plate: bus.plate ?? `Bus #${data.busId}`,
      latitude: data.latitude,
      longitude: data.longitude,
      lastUpdate: new Date(),
      speed: data.speed,
      routeId,
      routeName,
      currentStopId: nearestStop?.stop_id,
      currentStopName: nearestStop?.stop?.name,
      passengers,
      status,
    };

    this.trackingGateway.broadcastBusLocation(locationUpdate);

    // Broadcast alert if bus is significantly delayed
    if (status === 'delayed') {
      this.trackingGateway.broadcastAlert({
        type: 'delay',
        busId: data.busId,
        plate: bus.plate ?? `Bus #${data.busId}`,
        message: `Bus ${bus.plate} está presentando retraso`,
        severity: 'medium',
        routeId,
      });
    }
  }

  /**
   * Get all active buses with their current location for dashboard initial load
   */
  async getActiveBuses(): Promise<BusLocationData[]> {
    // 1. Buses con turno activo (producción real)
    const activeShifts = await this.shiftRepository.find({
      where: { status: 'in_progress' },
      relations: ['bus', 'bus.gps', 'bus.company'],
    });

    const results: BusLocationData[] = [];

    for (const shift of activeShifts) {
      if (!shift.bus?.gps?.latitude || !shift.bus?.gps?.longitude) continue;
      if (!shift.bus.gps.active) continue;

      // Get route info
      const schedule = await this.scheduleRepository.findOne({
        where: { bus: { id: shift.bus.id }, status: 'in_progress' },
        relations: ['route'],
      });

      const routeId = schedule?.route?.id;
      const routeName = schedule?.route?.name;

      // Find nearest stop
      const nearestStop = routeId
        ? await this.findNearestStop(
            shift.bus.gps.latitude,
            shift.bus.gps.longitude,
            routeId,
          )
        : null;

      const status = await this.calculateBusStatus(
        shift.bus.id!,
        routeId,
        shift.bus.gps.latitude,
        shift.bus.gps.longitude,
      );

      const passengers = await this.countPassengers(shift.bus.id!);

      results.push({
        busId: shift.bus.id!,
        plate: shift.bus.plate ?? `Bus #${shift.bus.id}`,
        latitude: Number(shift.bus.gps.latitude),
        longitude: Number(shift.bus.gps.longitude),
        lastUpdate: shift.bus.gps.lastUpdate ?? new Date(),
        routeId,
        routeName,
        currentStopId: nearestStop?.stop_id ?? undefined,
        currentStopName: nearestStop?.stop?.name ?? undefined,
        passengers,
        status,
      });
    }

    // 2. Fallback: buses con GPS activo pero sin turno (simulación)
    const busIdsWithShift = new Set(results.map((r) => r.busId));
    const allActiveGps = await this.gpsRepository.find({
      where: { active: true },
      relations: ['bus'],
    });
    for (const gps of allActiveGps) {
      if (!gps.bus || busIdsWithShift.has(gps.bus.id!)) continue;
      if (!gps.latitude || !gps.longitude) continue;

      results.push({
        busId: gps.bus.id!,
        plate: gps.bus.plate ?? `Bus #${gps.bus.id}`,
        latitude: Number(gps.latitude),
        longitude: Number(gps.longitude),
        lastUpdate: gps.lastUpdate ?? new Date(),
        routeId: undefined,
        routeName: undefined,
        currentStopId: undefined,
        currentStopName: undefined,
        passengers: 0,
        status: 'normal',
      });
    }

    return results;
  }

  /**
   * Calculate ETA from a bus to a specific stop
   */
  async calculateETA(
    busId: number,
    stopId: number,
  ): Promise<{ estimatedMinutes: number; distanceKm: number } | null> {
    const bus = await this.busRepository.findOne({
      where: { id: busId },
      relations: ['gps'],
    });
    if (!bus?.gps?.latitude || !bus?.gps?.longitude) return null;

    const routeStop = await this.routeStopRepository.findOne({
      where: { stop_id: stopId },
      relations: ['stop'],
    });
    if (!routeStop?.stop?.latitude || !routeStop?.stop?.longitude) return null;

    // Simple Euclidean distance (km) for estimation
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(
      Number(routeStop.stop.latitude) - Number(bus.gps.latitude),
    );
    const dLon = this.toRad(
      Number(routeStop.stop.longitude) - Number(bus.gps.longitude),
    );
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(Number(bus.gps.latitude))) *
        Math.cos(this.toRad(Number(routeStop.stop.latitude))) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distanceKm = R * c;

    // Assume average speed of 20 km/h in city
    const avgSpeedKmh = 20;
    const estimatedMinutes = Math.round((distanceKm / avgSpeedKmh) * 60);

    return { estimatedMinutes, distanceKm: Math.round(distanceKm * 100) / 100 };
  }

  /**
   * Calculate estimated time of arrival from bus position to all stops on a route
   * Used for route-based tracking
   */
  async calculateAllStopsETA(
    busId: number,
    routeId: number,
  ): Promise<
    Array<{ stopId: number; stopName: string; estimatedMinutes: number }>
  > {
    const bus = await this.busRepository.findOne({
      where: { id: busId },
      relations: ['gps'],
    });
    if (!bus?.gps?.latitude || !bus?.gps?.longitude) return [];

    const routeStops = await this.routeStopRepository.find({
      where: { route_id: routeId },
      relations: ['stop'],
      order: { order_index: 'ASC' },
    });

    const results: Array<{ stopId: number; stopName: string; estimatedMinutes: number }> = [];
    for (const rs of routeStops) {
      if (!rs.stop?.latitude || !rs.stop?.longitude) continue;

      const eta = await this.calculateETA(busId, rs.stop_id!);
      if (eta) {
        results.push({
          stopId: rs.stop_id!,
          stopName: rs.stop.name ?? `Paradero #${rs.stop_id}`,
          estimatedMinutes: eta.estimatedMinutes,
        });
      }
    }

    return results;
  }

  // ── Private Helpers ────────────────────────────────────────

  private async findNearestStop(
    lat: number,
    lng: number,
    routeId: number,
  ): Promise<RouteStop | null> {
    const routeStops = await this.routeStopRepository.find({
      where: { route_id: routeId },
      relations: ['stop'],
    });

    if (routeStops.length === 0) return null;

    let nearest: RouteStop | null = null;
    let minDistance = Infinity;

    for (const rs of routeStops) {
      if (!rs.stop?.latitude || !rs.stop?.longitude) continue;
      const d = this.haversineDistance(
        lat,
        lng,
        Number(rs.stop.latitude),
        Number(rs.stop.longitude),
      );
      if (d < minDistance) {
        minDistance = d;
        nearest = rs;
      }
    }

    return nearest;
  }

  private async calculateBusStatus(
    busId: number,
    routeId?: number,
    lat?: number,
    lng?: number,
  ): Promise<string> {
    // Check if bus has active incidents
    const bus = await this.busRepository.findOne({
      where: { id: busId },
      relations: ['incidentBuses', 'incidentBuses.incident'],
    });

    const hasActiveIncident = bus?.incidentBuses?.some(
      (ib) => ib.incident?.status !== 'resolved',
    );
    if (hasActiveIncident) return 'incident';

    // Check if bus is moving (if it has recent GPS, consider it normal)
    if (lat && lng) return 'normal';

    return 'normal';
  }

  private async countPassengers(busId: number): Promise<number> {
    const schedule = await this.scheduleRepository.findOne({
      where: { bus: { id: busId }, status: 'in_progress' },
      relations: ['tickets'],
    });

    if (!schedule?.tickets) return 0;
    return schedule.tickets.filter((t) => t.status === 'issued').length;
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

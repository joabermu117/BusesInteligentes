import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Bus } from '../../buses/entities/bus.entity';
import { Route } from '../../route/entities/route.entity';
import { RouteStop } from '../../routes-stops/entities/route-stop.entity';
import { TrackingService } from './tracking.service';

interface SimulatedBus {
  busId: number;
  routeId: number;
  routeName: string;
  currentStopIndex: number;
  stops: Array<{ lat: number; lng: number }>;
  progress: number; // 0..1 between current stop and next
  speed: number;
}

@Injectable()
export class BusSimulatorService {
  private readonly logger = new Logger(BusSimulatorService.name);
  private isRunning = false;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private simulatedBuses: SimulatedBus[] = [];

  constructor(
    @InjectRepository(Bus)
    private readonly busRepository: Repository<Bus>,
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    @InjectRepository(RouteStop)
    private readonly routeStopRepository: Repository<RouteStop>,
    private readonly trackingService: TrackingService,
  ) {}

  /**
   * Start the simulator: moves buses along their routes every 3 seconds
   */
  async start(): Promise<{ message: string; busesCount: number }> {
    if (this.isRunning) {
      return { message: 'El simulador ya está en ejecución', busesCount: this.simulatedBuses.length };
    }

    // Find active buses with active shifts
    const buses = await this.busRepository.find({
      where: { status: 'operative' },
      relations: ['gps'],
    });

    if (buses.length === 0) {
      return { message: 'No hay buses operativos para simular', busesCount: 0 };
    }

    // Assign each bus to a random route
    const routes = await this.routeRepository.find({ where: { is_active: true } });
    if (routes.length === 0) {
      return { message: 'No hay rutas activas', busesCount: 0 };
    }

    this.simulatedBuses = [];

    for (let i = 0; i < buses.length; i++) {
      const bus = buses[i];
      const route = routes[i % routes.length];

      const routeStops = await this.routeStopRepository.find({
        where: { route_id: route.id },
        relations: ['stop'],
        order: { order_index: 'ASC' },
      });

      if (routeStops.length < 2) continue;

      const stops = routeStops.map((rs) => ({
        lat: Number(rs.stop!.latitude!),
        lng: Number(rs.stop!.longitude!),
      }));

      this.simulatedBuses.push({
        busId: bus.id!,
        routeId: route.id!,
        routeName: route.name ?? `Ruta #${route.id}`,
        currentStopIndex: 0,
        stops,
        progress: 0,
        speed: 0.05 + Math.random() * 0.08, // random speed per bus
      });

      // Initialize GPS position at first stop
      await this.trackingService.processGpsUpdate({
        busId: bus.id!,
        latitude: stops[0].lat,
        longitude: stops[0].lng,
        speed: 0,
        routeId: route.id,
        routeName: route.name ?? `Ruta #${route.id}`,
      });
    }

    this.isRunning = true;
    this.intervalId = setInterval(() => this.tick(), 3000);

    this.logger.log(`🚍 Simulador iniciado con ${this.simulatedBuses.length} buses`);
    if (this.simulatedBuses.length > 0) {
      this.logger.log(`   Ruta #${this.simulatedBuses[0].routeId}: "${this.simulatedBuses[0].routeName}"`);
    }
    return { message: `Simulador iniciado con ${this.simulatedBuses.length} buses`, busesCount: this.simulatedBuses.length };
  }

  /**
   * Stop the simulator
   */
  stop(): { message: string } {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    this.simulatedBuses = [];
    this.logger.log('🛑 Simulador detenido');
    return { message: 'Simulador detenido' };
  }

  getStatus() {
    return {
      running: this.isRunning,
      busesCount: this.simulatedBuses.length,
    };
  }

  /**
   * Each tick: move every bus forward along its route
   */
  private async tick() {
    for (const sim of this.simulatedBuses) {
      sim.progress += sim.speed;

      if (sim.progress >= 1) {
        sim.progress = 0;
        sim.currentStopIndex++;

        // If reached the end, loop back to the start
        if (sim.currentStopIndex >= sim.stops.length - 1) {
          sim.currentStopIndex = 0;
          sim.progress = 0;
        }
      }

      const currentStop = sim.stops[sim.currentStopIndex];
      const nextStop = sim.stops[sim.currentStopIndex + 1] ?? sim.stops[0];

      // Interpolate position between current and next stop
      const lat = currentStop.lat + (nextStop.lat - currentStop.lat) * sim.progress;
      const lng = currentStop.lng + (nextStop.lng - currentStop.lng) * sim.progress;

      try {
        await this.trackingService.processGpsUpdate({
          busId: sim.busId,
          latitude: lat,
          longitude: lng,
          speed: Math.round(15 + Math.random() * 25), // 15-40 km/h simulated
          routeId: sim.routeId,
          routeName: sim.routeName,
        });
      } catch (err) {
        this.logger.warn(`Error actualizando bus #${sim.busId}: ${err}`);
      }
    }
  }
}

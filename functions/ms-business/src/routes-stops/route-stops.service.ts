import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Route } from '../route/entities/route.entity';
import { Stop } from '../stop/entities/stop.entity';
import { CreateRouteStopDto } from './dto/create-route-stop.dto';
import { UpdateRouteStopDto } from './dto/update-route-stop.dto';
import { RouteStop } from './entities/route-stop.entity';

@Injectable()
export class RouteStopsService {
  constructor(
    @InjectRepository(RouteStop)
    private readonly routeStopRepository: Repository<RouteStop>,
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    @InjectRepository(Stop)
    private readonly stopRepository: Repository<Stop>,
  ) {}

  async create(dto: CreateRouteStopDto): Promise<RouteStop> {
    const route = await this.routeRepository.findOne({
      where: { id: dto.route_id },
    });
    if (!route) throw new NotFoundException(`Route #${dto.route_id} not found`);

    const stop = await this.stopRepository.findOne({
      where: { id: dto.stop_id },
    });
    if (!stop) throw new NotFoundException(`Stop #${dto.stop_id} not found`);

    const existing = await this.routeStopRepository.findOne({
      where: { route_id: dto.route_id, stop_id: dto.stop_id },
    });
    if (existing)
      throw new ConflictException('This stop is already assigned to the route');

    const routeStop = this.routeStopRepository.create({
      route_id: dto.route_id,
      stop_id: dto.stop_id,
      order_index: dto.order_index,
    });

    return await this.routeStopRepository.save(routeStop);
  }

  async findAll(): Promise<RouteStop[]> {
    return await this.routeStopRepository.find({
      relations: ['route', 'stop'],
      order: { route_id: 'ASC', order_index: 'ASC' },
    });
  }

  async findByRoute(routeId: number): Promise<RouteStop[]> {
    const route = await this.routeRepository.findOne({
      where: { id: routeId },
    });
    if (!route) throw new NotFoundException(`Route #${routeId} not found`);

    const routeStops = await this.routeStopRepository.find({
      where: { route_id: routeId },
      relations: ['stop'],
      order: { order_index: 'ASC' },
    });
    return routeStops;
  }

  async findByStop(stopId: number): Promise<RouteStop[]> {
    const stop = await this.stopRepository.findOne({ where: { id: stopId } });
    if (!stop) throw new NotFoundException(`Stop #${stopId} not found`);

    return await this.routeStopRepository.find({
      where: { stop_id: stopId },
      relations: ['route'],
      order: { route_id: 'ASC' },
    });
  }

  async update(
    routeId: number,
    stopId: number,
    dto: UpdateRouteStopDto,
  ): Promise<RouteStop> {
    const routeStop = await this.routeStopRepository.findOne({
      where: { route_id: routeId, stop_id: stopId },
      relations: ['route', 'stop'],
    });
    if (!routeStop)
      throw new NotFoundException(
        `RouteStop for route #${routeId} and stop #${stopId} not found`,
      );

    if (dto.order_index !== undefined) {
      routeStop.order_index = dto.order_index;
    }

    return await this.routeStopRepository.save(routeStop);
  }

  async remove(routeId: number, stopId: number): Promise<{ message: string }> {
    const routeStop = await this.routeStopRepository.findOne({
      where: { route_id: routeId, stop_id: stopId },
    });
    if (!routeStop)
      throw new NotFoundException('Route-stop association not found');

    await this.routeStopRepository.remove(routeStop);
    return { message: `Stop #${stopId} removed from route #${routeId}` };
  }

  async removeAllByRoute(routeId: number): Promise<void> {
    const routeStops = await this.routeStopRepository.find({
      where: { route_id: routeId },
    });
    if (routeStops.length > 0) {
      await this.routeStopRepository.remove(routeStops);
    }
  }
}
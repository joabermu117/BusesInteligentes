import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { AddRouteStopDto } from './dto/add-route-stop.dto';
import { Route } from './entities/route.entity';
import { RouteStop } from './entities/route-stop.entity';
import { Stop } from '../stop/entities/stop.entity';

@Injectable()
export class RouteService {
  constructor(
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    @InjectRepository(RouteStop)
    private readonly routeStopRepository: Repository<RouteStop>,
    @InjectRepository(Stop)
    private readonly stopRepository: Repository<Stop>,
  ) {}

  async create(createRouteDto: CreateRouteDto): Promise<Route> {
    const route = this.routeRepository.create(createRouteDto);
    return await this.routeRepository.save(route);
  }

  async findAll(name?: string): Promise<Route[]> {
    const where = name ? { name: Like(`%${name}%`) } : {};
    return await this.routeRepository.find({
      where,
    });
  }

  async findOne(id: number): Promise<Route> {
    const route = await this.routeRepository.findOne({
      where: { id },
      relations: ['nodes', 'routeStops', 'routeStops.stop'],
    });
    if (!route) {
      throw new NotFoundException(`Route #${id} not found`);
    }
    return route;
  }

  async update(id: number, updateRouteDto: UpdateRouteDto): Promise<Route> {
    const route = await this.findOne(id);
    Object.assign(route, updateRouteDto);
    return await this.routeRepository.save(route);
  }

  async remove(id: number): Promise<{ message: string }> {
    const route = await this.findOne(id);
    await this.routeRepository.remove(route);
    return { message: `Route #${id} deleted successfully` };
  }

  async findStopsByRoute(routeId: number): Promise<RouteStop[]> {
    const route = await this.routeRepository.findOne({
      where: { id: routeId },
      relations: ['routeStops', 'routeStops.stop'],
    });
    if (!route) throw new NotFoundException(`Route #${routeId} not found`);
    if (!route.routeStops) return [];
    return route.routeStops.sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0));
  }

  async addStop(routeId: number, addRouteStopDto: AddRouteStopDto): Promise<RouteStop> {
    const route = await this.routeRepository.findOne({ where: { id: routeId } });
    if (!route) throw new NotFoundException(`Route #${routeId} not found`);

    const stop = await this.stopRepository.findOne({ where: { id: addRouteStopDto.stop_id } });
    if (!stop) throw new NotFoundException(`Stop #${addRouteStopDto.stop_id} not found`);

    const existing = await this.routeStopRepository.findOne({
      where: { route_id: routeId, stop_id: addRouteStopDto.stop_id },
    });
    if (existing) throw new ConflictException('This stop is already assigned to the route');

    const routeStop = this.routeStopRepository.create({
      route_id: routeId,
      stop_id: addRouteStopDto.stop_id,
      order_index: addRouteStopDto.order_index,
    });

    return await this.routeStopRepository.save(routeStop);
  }

  async removeStop(routeId: number, stopId: number): Promise<{ message: string }> {
    const routeStop = await this.routeStopRepository.findOne({
      where: { route_id: routeId, stop_id: stopId },
    });
    if (!routeStop) throw new NotFoundException('Route-stop association not found');

    await this.routeStopRepository.remove(routeStop);
    return { message: `Stop #${stopId} removed from route #${routeId}` };
  }
}

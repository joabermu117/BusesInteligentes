import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { Route } from './entities/route.entity';
import { RouteStopsService } from '../routes-stops/route-stops.service';

@Injectable()
export class RouteService {
  constructor(
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
    private readonly routeStopsService: RouteStopsService,
  ) {}

  async create(createRouteDto: CreateRouteDto): Promise<Route> {
    const route = this.routeRepository.create(createRouteDto);
    return await this.routeRepository.save(route);
  }

  async findAll(name?: string): Promise<Route[]> {
    const where = name ? { name: Like(`%${name}%`) } : {};
    return await this.routeRepository.find({
      where,
      relations: ['routeStops', 'routeStops.stop'],
    });
  }

  async findOne(id: number): Promise<Route> {
    const route = await this.routeRepository.findOne({
      where: { id },
      relations: ['nodes', 'routeStops', 'routeStops.stop'],
    });
    if (!route) throw new NotFoundException(`Route #${id} not found`);
    return route;
  }

  async update(id: number, updateRouteDto: UpdateRouteDto): Promise<Route> {
    const route = await this.findOne(id);
    Object.assign(route, updateRouteDto);
    return await this.routeRepository.save(route);
  }

  async remove(id: number): Promise<{ message: string }> {
    const route = await this.findOne(id);
    // Eliminar route-stops primero
    await this.routeStopsService.removeAllByRoute(id);
    await this.routeRepository.remove(route);
    return { message: `Route #${id} deleted successfully` };
  }

  async findStopsByRoute(routeId: number) {
    return this.routeStopsService.findByRoute(routeId);
  }

  async addStop(routeId: number, dto: any) {
    return this.routeStopsService.create({
      route_id: routeId,
      stop_id: dto.stop_id,
      order_index: dto.order_index,
    });
  }

  async removeStop(routeId: number, stopId: number) {
    return this.routeStopsService.remove(routeId, stopId);
  }
}
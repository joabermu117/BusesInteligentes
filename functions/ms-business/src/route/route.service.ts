import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { Route } from './entities/route.entity';
import { RouteStop } from './entities/route-stop.entity';

@Injectable()
export class RouteService {
  constructor(
    @InjectRepository(Route)
    private readonly routeRepository: Repository<Route>,
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
}

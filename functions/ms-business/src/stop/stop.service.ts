import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateStopDto } from './dto/create-stop.dto';
import { UpdateStopDto } from './dto/update-stop.dto';
import { Stop } from './entities/stop.entity';

@Injectable()
export class StopService {
  constructor(
    @InjectRepository(Stop)
    private readonly stopRepository: Repository<Stop>,
  ) {}

  async create(createStopDto: CreateStopDto): Promise<Stop> {
    const stop = this.stopRepository.create(createStopDto);
    return await this.stopRepository.save(stop);
  }

  async findAll(): Promise<Stop[]> {
    return await this.stopRepository.find({ relations: ['routeStops', 'routeStops.route'] });
  }

  async findOne(id: number): Promise<Stop> {
    const stop = await this.stopRepository.findOne({
      where: { id },
      relations: ['routeStops', 'routeStops.route'],
    });
    if (!stop) {
      throw new NotFoundException(`Stop #${id} not found`);
    }
    return stop;
  }

  async findNearest(latitude: number, longitude: number, limit = 5): Promise<any[]> {
    const result = await this.stopRepository
      .createQueryBuilder('stop')
      .leftJoinAndSelect('stop.routeStops', 'routeStop')
      .leftJoinAndSelect('routeStop.route', 'route')
      .addSelect(
        `6371000 * 2 * ASIN(SQRT(
          POWER(SIN((:lat - stop.latitude) * PI() / 360), 2) +
          COS(:lat * PI() / 180) * COS(stop.latitude * PI() / 180) *
          POWER(SIN((:lng - stop.longitude) * PI() / 360), 2)
        ))`,
        'distance',
      )
      .setParameters({ lat: latitude, lng: longitude })
      .orderBy('distance', 'ASC')
      .take(limit)
      .getRawAndEntities();

    // Mapear por ID para evitar discrepancias entre raw y entities
    const entityMap = new Map(result.entities.map((e) => [e.id, e]));
    return result.raw
      .filter((raw: any) => entityMap.has(raw.stop_id))
      .map((raw: any) => ({
        ...entityMap.get(raw.stop_id)!,
        distance: Math.round(raw.distance),
      }));
  }

  async update(id: number, updateStopDto: UpdateStopDto): Promise<Stop> {
    const stop = await this.findOne(id);
    Object.assign(stop, updateStopDto);
    return await this.stopRepository.save(stop);
  }

  async remove(id: number): Promise<{ message: string }> {
    const stop = await this.findOne(id);
    await this.stopRepository.remove(stop);
    return { message: `Stop #${id} deleted successfully` };
  }
}
